"""Sermaye artırımları: KAP "Sermaye Artırımı - Azaltımı İşlemlerine İlişkin Bildirim"leri.

Her şirketin son 12 aydaki en yeni bildirimi açılır; mevcut ve ulaşılacak sermaye, bedelli (rüçhanlı)
artırım oranı ve rüçhan fiyatı, bedelsiz oran, tahsisli tutar, sermaye azaltımı, rüçhan / bedelsiz
tarihleri ve SPK onayı okunur.

KAP sık istekte IP'yi engelliyor (429). Bu yüzden:
- istekler sıralı ve aralıklı,
- liste sorgularının 2 haftadan eski pencereleri önbellekte tutulur (her gece yalnızca son haftalar sorulur),
- açılan bildirimler data/capital_cache.json'da saklanır, bir çalıştırmada en fazla MAX_NEW yenisi açılır.

Çıktı: data/capital.json
  python scripts/fetch_capital.py
"""

import json
import re
import sys
import time
from datetime import date, datetime, timedelta
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = DATA / "capital.json"
CACHE = DATA / "capital_cache.json"

LIST_URL = "https://kap.org.tr/tr/api/disclosure/members/byCriteria"
DETAIL_URL = "https://kap.org.tr/tr/Bildirim/{}"
HEADERS = {"Accept-Language": "tr", "User-Agent": "Mozilla/5.0"}
SUBJECT = "Sermaye Artırımı - Azaltımı İşlemlerine İlişkin Bildirim"
KAP_LIMIT = 2000
PAUSE = 5.0
DAYS = 365
BLOCK = 10  # liste penceresi (gün); takvime sabitlenir ki önbellekteki pencereler değişmesin
FRESH_DAYS = 14  # bundan yeni pencereler her çalıştırmada yeniden sorulur
MAX_NEW = 60
CANCEL = re.compile(r"yürürlükten kald|iptal|vazgeç|geri çek", re.I)


def get(method: str, url: str, **kw) -> requests.Response:
    for attempt in range(5):
        try:
            r = requests.request(method, url, headers=HEADERS, timeout=60, **kw)
            if r.status_code == 429:
                raise requests.HTTPError("429")
            r.raise_for_status()
            time.sleep(PAUSE)
            return r
        except Exception as e:  # noqa: BLE001
            if attempt == 4:
                raise
            wait = 90 * (attempt + 1) if "429" in str(e) else 5
            print(f"  {e}; {wait} sn bekleniyor", file=sys.stderr, flush=True)
            time.sleep(wait)
    raise RuntimeError("unreachable")


def kap_range(a: date, b: date) -> list[dict]:
    body = {"fromDate": a.isoformat(), "toDate": b.isoformat(), "memberType": "IGS", "mkkMemberOidList": [],
            "inactiveMkkMemberOidList": [], "disclosureClass": "ODA", "subjectList": [], "isLate": "", "mainSector": "",
            "sector": "", "subSector": "", "marketOid": "", "index": "", "bdkReview": "", "bdkMemberOidList": [],
            "year": "", "term": "", "ruleType": "", "period": "", "fromSrc": False, "srcCategory": "",
            "disclosureIndexList": []}
    rows = get("POST", LIST_URL, json=body).json()
    if len(rows) >= KAP_LIMIT and a < b:  # 2000 sınırı: aralığı böl
        mid = a + (b - a) // 2
        return kap_range(a, mid) + kap_range(mid + timedelta(days=1), b)
    keep = ("disclosureIndex", "publishDate", "stockCodes", "summary")
    return [{k: r.get(k) for k in keep} for r in rows if r.get("subject") == SUBJECT]


def tr_number(s: str | None) -> float | None:
    if not s or not re.search(r"\d", s):
        return None
    try:
        return float(s.strip().replace(".", "").replace(",", "."))
    except ValueError:
        return None


def tr_date(s: str | None) -> str | None:
    m = re.search(r"(\d{2})\.(\d{2})\.(\d{4})", s or "")
    return f"{m[3]}-{m[2]}-{m[1]}" if m else None


def form_rows(page: str) -> list[list[str]]:
    """Bildirim formundaki satırlar; form sayfaya RSC verisi içinde kaçışlı HTML olarak gömülü"""
    i = page.find("Özet Bilgi")
    if i < 0:
        return []
    s = page.rfind("\\u003ctable", 0, i)
    chunk = page[s if s >= 0 else i:]
    chunk = (chunk.replace("\\u003c", "<").replace("\\u003e", ">").replace("\\u0026", "&")
             .replace('\\"', '"').replace("\\n", "\n"))
    out = []
    for tr in BeautifulSoup(chunk, "html.parser").find_all("tr"):
        if tr.find("tr"):
            continue
        cells = [td.get_text(" ", strip=True) for td in tr.find_all("td", recursive=False)]
        if any(cells):
            out.append(cells)
    return out


def sections(rows: list[list[str]]) -> dict[str, dict]:
    """Bedelli / Bedelsiz / Tahsisli / Azaltım bölümleri: {başlık: {"total": {...}, "groups": [{...}]}}"""
    out: dict[str, dict] = {}
    cur = None
    group_head = total_head = None
    for cells in rows:
        filled = [c for c in cells if c]
        if len(filled) == 1 and re.match(r"(Bedelli|Bedelsiz|Sermaye Azalt|Tahsisli)", filled[0]):
            cur = filled[0]
            out[cur] = {"total": {}, "groups": []}
            group_head = total_head = None
            continue
        if cur is None:
            continue
        # Toplam tablosunun başlığında ilk (etiket) hücre boş; sütunlar ham hücre sırasıyla eşlenir
        if cells[0] == "Pay Grup Bilgileri":
            group_head = cells
        elif filled and filled[0] == "Mevcut Sermaye (TL)":
            total_head = cells
        elif cells[0] == "TOPLAM" and total_head:
            out[cur]["total"] = {k: v for k, v in zip(total_head, cells) if k}
        elif group_head and len(cells) == len(group_head):
            out[cur]["groups"].append(dict(zip(group_head, cells)))
    return out


def pick(d: dict, *words: str) -> str | None:
    return next((v for k, v in d.items() if all(w in k for w in words)), None)


def parse(page: str, code: str) -> dict:
    rows = form_rows(page)
    kv = {c[0]: c[1] for c in rows if len(c) >= 2 and c[0] and c[1]}
    secs = sections(rows)
    rec = {
        "summary": kv.get("Özet Bilgi"),
        "decision": tr_date(kv.get("Yönetim Kurulu Karar Tarihi")),
        "current": tr_number(kv.get("Mevcut Sermaye (TL)")),
        "target": tr_number(kv.get("Ulaşılacak Sermaye (TL)")),
        "rights": None, "bonus": None, "allocated": None, "reduction": None,
        "spkApplied": tr_date(kv.get("SPK Başvuru Tarihi")),
        "spkApproved": tr_date(kv.get("SPK Onay Tarihi")),
        "registered": tr_date(kv.get("Sermaye Tescil Tarihi")),
        "payDate": tr_date(kv.get("Ödeme Tarihi")),
    }
    for title, s in secs.items():
        t = s["total"]
        own = next((g for g in s["groups"] if code in g.get("Pay Grup Bilgileri", "")), s["groups"][0] if s["groups"] else {})
        if title.startswith("Bedelli") and "Tahsisli" not in title:
            rec["rights"] = {
                "amount": tr_number(pick(t, "Kullanım Tutarı")), "pct": tr_number(pick(t, "Kullanım Oranı")),
                "price": tr_number(pick(own, "Kullandırma Fiyatı")),
                "start": tr_date(kv.get("Rüçhan Hakkı Kullanımı Başlangıç Tarihi")),
                "end": tr_date(kv.get("Rüçhan Hakkı Kullanımı Bitiş Tarihi")),
            }
        elif "Tahsisli" in title:
            rec["allocated"] = {"amount": tr_number(pick(t, "Tutarı")), "pct": tr_number(pick(t, "(%)"))}
        elif title.startswith("Bedelsiz"):
            rec["bonus"] = {
                "amount": tr_number(pick(t, "Toplam Bedelsiz", "Tutarı")), "pct": tr_number(pick(t, "Toplam Bedelsiz", "Oranı")),
                "start": tr_date(kv.get("Bedelsiz Pay Alma Hakkı Kullanım Başlangıç Tarihi")),
            }
        elif title.startswith("Sermaye Azalt"):
            rec["reduction"] = {"amount": tr_number(pick(t, "Tutar")), "pct": tr_number(pick(t, "Oran"))}
    return rec


def status(d: dict, today: str) -> str:
    if CANCEL.search(d["summary"] or ""):
        return "İptal"
    r, b = d["rights"] or {}, d["bonus"] or {}
    if r.get("start") and r["start"] <= today <= (r.get("end") or r["start"]):
        return "Rüçhan süreci"
    if (r.get("end") and r["end"] < today) or (b.get("start") and b["start"] <= today):
        return "Tamamlandı"
    if (r.get("start") and r["start"] > today) or (b.get("start") and b["start"] > today):
        return "Tarih belli"
    if d["registered"]:
        return "Tamamlandı"
    if d["spkApproved"]:
        return "SPK onaylı"
    if d["spkApplied"]:
        return "SPK başvurusu"
    return "Karar"


def blocks(start: date, end: date):
    """Takvime sabitlenmiş BLOCK günlük pencereler (yeniden eskiye)"""
    o = end.toordinal()
    b = date.fromordinal(o - o % BLOCK)
    while b + timedelta(days=BLOCK - 1) >= start:
        yield b, min(b + timedelta(days=BLOCK - 1), end)
        b -= timedelta(days=BLOCK)


def main() -> None:
    tickers = set(json.loads((DATA / "tickers.json").read_text(encoding="utf-8")))
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    lists: dict = cache.setdefault("lists", {})
    details: dict = cache.setdefault("details", {})
    today = date.today()

    print("KAP: sermaye artırımı bildirimleri", flush=True)
    found = []
    asked = 0
    for a, b in blocks(today - timedelta(days=DAYS), today):
        key = a.isoformat()
        if key in lists and b < today - timedelta(days=FRESH_DAYS):
            found += lists[key]
            continue
        lists[key] = kap_range(a, b)
        found += lists[key]
        asked += 1
    oldest = (today - timedelta(days=DAYS + BLOCK)).isoformat()
    for k in [k for k in lists if k < oldest]:
        del lists[k]
    CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    # Şirket başına en yeni bildirim
    latest: dict[str, dict] = {}
    for r in found:
        for code in [c.strip() for c in (r.get("stockCodes") or "").split(",") if c.strip() in tickers]:
            if code not in latest or r["disclosureIndex"] > latest[code]["disclosureIndex"]:
                latest[code] = r
    todo = sorted((r for r in latest.values() if str(r["disclosureIndex"]) not in details),
                  key=lambda r: r["disclosureIndex"], reverse=True)
    print(f"  {asked} liste sorgusu, {len(found)} bildirim, {len(latest)} şirket, {len(todo)} yeni ayrıntı"
          + (f" (bu çalıştırmada {MAX_NEW})" if len(todo) > MAX_NEW else ""), flush=True)

    for i, r in enumerate(todo[:MAX_NEW], 1):
        code = next(c.strip() for c in r["stockCodes"].split(",") if c.strip() in tickers)
        try:
            details[str(r["disclosureIndex"])] = parse(get("GET", DETAIL_URL.format(r["disclosureIndex"])).text, code)
        except Exception as e:  # noqa: BLE001
            print(f"  {r['disclosureIndex']}: {e}", file=sys.stderr)
        if i % 20 == 0:
            print(f"  {i}/{min(len(todo), MAX_NEW)}", flush=True)
            CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
    CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    items = []
    for code, r in latest.items():
        d = details.get(str(r["disclosureIndex"]))
        if not d:
            continue
        items.append({"code": code, "id": r["disclosureIndex"],
                      "published": datetime.strptime(r["publishDate"][:10], "%d.%m.%Y").date().isoformat(),
                      **d, "status": status(d, today.isoformat())})
    items.sort(key=lambda x: x["id"], reverse=True)
    OUT.write_text(json.dumps({"updatedAt": datetime.now().isoformat(timespec="minutes"), "items": items},
                              ensure_ascii=False), encoding="utf-8")
    print(f"{len(items)} şirket yazıldı ({sum(1 for x in items if x['status'] not in ('Tamamlandı', 'İptal'))} süren)")


if __name__ == "__main__":
    main()
