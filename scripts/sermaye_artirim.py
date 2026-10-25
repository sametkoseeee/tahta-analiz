"""KAP "Sermaye Artırımı - Azaltımı İşlemlerine İlişkin Bildirim"lerinden sermaye artırım tablosu.

Her bildirimin yapılandırılmış formu (mevcut/ulaşılacak sermaye, bedelli-bedelsiz oranları,
rüçhan fiyatı, tarihler) okunur; aynı şirketin aynı yönetim kurulu kararına ait bildirimleri
tek satırda birleştirilir ve en güncel durumu gösterilir.

Çıktı: data/sermaye_artirimlari.json. Bildirimler data/sermaye_cache.json'da saklanır, sonraki
çalıştırmalar yalnızca son günleri tarar.

  python scripts/sermaye_artirim.py            # artımlı güncelleme (ilk seferde 1 yıl)
  python scripts/sermaye_artirim.py --days 730 # belirtilen gün sayısını yeniden tara
"""

import argparse
import datetime as dt
import json
import re
import sys
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = DATA / "sermaye_artirimlari.json"
CACHE = DATA / "sermaye_cache.json"

LIST_URL = "https://kap.org.tr/tr/api/disclosure/members/byCriteria"
DETAIL_URL = "https://kap.org.tr/tr/Bildirim/{}"
HEADERS = {"Accept-Language": "tr", "User-Agent": "Mozilla/5.0"}
SUBJECT = "Sermaye Artırımı - Azaltımı İşlemlerine İlişkin Bildirim"
FIRST_RUN_DAYS = 365
RESCAN_DAYS = 5  # geç yayımlanan/düzeltilen bildirimler için


KAP_LIMIT = 2000  # KAP tek sorguda en fazla bu kadar bildirim döndürür
WINDOW_DAYS = 7
PAUSE = 4.0  # KAP sık istekte IP'yi geçici olarak engelliyor (429)


def kap_get(method: str, url: str, **kw) -> requests.Response:
    for attempt in range(6):
        try:
            r = requests.request(method, url, headers=HEADERS, timeout=60, **kw)
            if r.status_code == 429:
                raise requests.HTTPError("429")
            r.raise_for_status()
            time.sleep(PAUSE)
            return r
        except Exception as e:  # noqa: BLE001
            if attempt == 5:
                raise
            wait = 60 * (attempt + 1) if "429" in str(e) else 5
            print(f"  {e}; {wait} sn bekleniyor", file=sys.stderr, flush=True)
            time.sleep(wait)
    raise RuntimeError("unreachable")


def kap_range(a: dt.date, b: dt.date) -> list[dict]:
    """[a, b] aralığındaki sermaye bildirimleri; 2000 sınırına takılırsa aralık bölünür."""
    body = {"fromDate": a.isoformat(), "toDate": b.isoformat(), "memberType": "IGS",
            "mkkMemberOidList": [], "inactiveMkkMemberOidList": [], "disclosureClass": "", "subjectList": [],
            "isLate": "", "mainSector": "", "sector": "", "subSector": "", "marketOid": "", "index": "",
            "bdkReview": "", "bdkMemberOidList": [], "year": "", "term": "", "ruleType": "", "period": "",
            "fromSrc": False, "srcCategory": "", "disclosureIndexList": []}
    rows = kap_get("POST", LIST_URL, json=body).json()
    if len(rows) >= KAP_LIMIT and a < b:
        mid = a + (b - a) // 2
        return kap_range(a, mid) + kap_range(mid + dt.timedelta(days=1), b)
    if len(rows) >= KAP_LIMIT:
        print(f"  {a}: tek günde {len(rows)} bildirim, bir kısmı eksik olabilir", file=sys.stderr)
    return [x for x in rows if x.get("subject") == SUBJECT]


def tr_number(s: str | None) -> float | None:
    if not s:
        return None
    s = s.strip().replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def tr_date(s: str | None) -> str | None:
    """'05.11.2026 ...' -> '2026-11-05'"""
    m = re.search(r"(\d{2})\.(\d{2})\.(\d{4})", s or "")
    return f"{m[3]}-{m[2]}-{m[1]}" if m else None


def form_html(page: str) -> str | None:
    """Bildirim formu sayfaya RSC verisi içinde kaçışlı HTML olarak gömülü."""
    i = page.find("tbl_SA_Report_ID")
    if i < 0:
        return None
    start = page.rfind("\\u003ctable", 0, i)
    end = page.find('"])', i)
    chunk = page[start:end if end > 0 else None]
    return (chunk.replace("\\u003c", "<").replace("\\u003e", ">").replace("\\u0026", "&")
            .replace('\\"', '"').replace("\\n", "\n"))


def parse_form(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    kv: dict[str, str] = {}
    totals: dict[str, str] = {}
    groups: list[dict[str, str]] = []
    header: list[str] | None = None
    for tr in soup.find_all("tr"):
        if tr.find("tr"):
            continue
        tds = tr.find_all("td", recursive=False)
        cells = [td.get_text(" ", strip=True) for td in tds]
        if "th" in (tr.get("class") or []) or (cells and cells[0] == "Pay Grup Bilgileri"):
            header = cells
            continue
        if len(tds) == 2 and tds[0].find(class_="bold") and header is None:
            kv.setdefault(cells[0], cells[1])
            continue
        if header and len(cells) == len(header):
            row = dict(zip(header, cells))
            if cells[0] == "TOPLAM":
                totals.update({k: v for k, v in row.items() if v})
                header = None
            else:
                groups.append(row)
        elif len(tds) == 2 and tds[0].find(class_="bold"):
            header = None
            kv.setdefault(cells[0], cells[1])
    return {"kv": kv, "totals": totals, "groups": groups}


def first(d: dict[str, str], *needles: str) -> str | None:
    for k, v in d.items():
        if v and all(n in k for n in needles):
            return v
    return None


def extract(form: dict) -> dict:
    kv, totals, groups = form["kv"], form["totals"], form["groups"]
    rec = {
        "ykKarar": tr_date(kv.get("Yönetim Kurulu Karar Tarihi")),
        "kayitliTavan": tr_number(kv.get("Kayıtlı Sermaye Tavanı (TL)")),
        "mevcut": tr_number(kv.get("Mevcut Sermaye (TL)")),
        "ulasilacak": tr_number(kv.get("Ulaşılacak Sermaye (TL)")),
        "bedelliOran": tr_number(first(totals, "Rüçhan Hakkı Kullanım Oranı")),
        "tahsisliOran": tr_number(first(totals, "Tahsisli", "(%)")),
        "bedelsizOran": tr_number(first(totals, "Toplam Bedelsiz", "Oranı")),
        "azaltimOran": tr_number(first(totals, "Azalt", "(%)")),
        "ruchanFiyat": None,
        "ruchanBaslangic": tr_date(first(kv, "Rüçhan Hakkı Kullanımı Başlangıç")),
        "ruchanBitis": tr_date(first(kv, "Rüçhan Hakkı Kullanımı Bitiş")),
        "bedelsizBaslangic": tr_date(first(kv, "Bedelsiz Pay Alma Hakkı Kullanım Başlangıç")),
        "tahsisliTarih": tr_date(kv.get("Sermaye Artırım Tarihi")),
        "spkBasvuru": tr_date(kv.get("SPK Başvuru Tarihi")),
        "spkOnay": tr_date(kv.get("SPK Onay Tarihi")),
    }
    if rec["bedelsizOran"] is None:
        ic = tr_number(first(totals, "İç Kaynaklardan", "Oranı"))
        kar = tr_number(first(totals, "Kar Payından", "Oranı"))
        if ic is not None or kar is not None:
            rec["bedelsizOran"] = (ic or 0) + (kar or 0)
    prices = {tr_number(g.get("Rüçhan Hakkı Kullandırma Fiyatı (TL)")) for g in groups} - {None}
    if prices:
        rec["ruchanFiyat"] = min(prices)
    return rec


def fetch_detail(item: dict) -> dict:
    did = item["disclosureIndex"]
    rec = {
        "id": did,
        "date": tr_date(item.get("publishDate")),
        "time": (item.get("publishDate") or "")[11:16],
        "stockCodes": item.get("stockCodes") or item.get("relatedStocks") or "",
        "company": item.get("kapTitle"),
        "summary": (item.get("summary") or "").strip(),
    }
    try:
        html = form_html(kap_get("GET", DETAIL_URL.format(did)).text)
        if html:
            rec.update(extract(parse_form(html)))
    except Exception as e:  # noqa: BLE001
        print(f"  {did}: {e}", file=sys.stderr)
        rec["error"] = True
    return rec


STATUS_RANK = {"YK kararı": 0, "SPK başvurusu": 1, "SPK onayı": 2, "Hak kullanımı": 3, "Tamamlandı": 4}


def status_of(r: dict, today: str) -> str:
    s = r["summary"].lower()
    if "tescil" in s or "satışının tamamlanması" in s or "sonucu" in s:
        return "Tamamlandı"
    if r.get("ruchanBitis") and r["ruchanBitis"] < today or r.get("tahsisliTarih") and r["tahsisliTarih"] <= today:
        return "Tamamlandı"
    start = r.get("ruchanBaslangic") or r.get("bedelsizBaslangic")
    if start and start <= today:
        return "Hak kullanımı"
    if r.get("spkOnay"):
        return "SPK onayı"
    if r.get("spkBasvuru"):
        return "SPK başvurusu"
    return "YK kararı"


CANCEL = re.compile(r"yürürlükten kaldır|vazgeç|iptal edil|geri çek", re.I)
FIELDS = ["kayitliTavan", "mevcut", "ulasilacak", "bedelliOran", "tahsisliOran", "bedelsizOran", "azaltimOran",
          "ruchanFiyat", "ruchanBaslangic", "ruchanBitis", "bedelsizBaslangic", "tahsisliTarih", "spkBasvuru", "spkOnay"]


def build_table(disclosures: list[dict], tickers: set[str]) -> list[dict]:
    today = dt.date.today().isoformat()
    processes: dict[tuple, dict] = {}
    for r in sorted(disclosures, key=lambda x: (x["date"] or "", x["time"], x["id"])):
        if r.get("mevcut") is None and r.get("ulasilacak") is None:
            continue
        codes = [c.strip() for c in r["stockCodes"].split(",") if c.strip()]
        ours = [c for c in codes if c in tickers]
        code = ours[0] if ours else (codes[0] if codes else None)
        if not code:
            continue
        key = (code, r.get("ykKarar") or f"{r.get('mevcut')}-{r.get('ulasilacak')}")
        p = processes.setdefault(key, {"code": code, "listed": bool(ours), "company": r["company"],
                                       "ykKarar": r.get("ykKarar"), "status": "YK kararı", "disclosures": []})
        for f in FIELDS:
            if r.get(f) is not None:
                p[f] = r[f]
        st = status_of(r, today)
        if STATUS_RANK[st] >= STATUS_RANK.get(p["status"], 0):
            p["status"] = st
        if CANCEL.search(r["summary"]):
            p["status"] = "İptal"
        p["disclosures"].append({"id": r["id"], "date": r["date"], "summary": r["summary"]})
        p["lastDate"] = r["date"]
    rows = []
    for p in processes.values():
        p.setdefault("mevcut", None)
        p.setdefault("ulasilacak", None)
        p["disclosures"].reverse()
        rows.append(p)
    rows.sort(key=lambda p: (p["lastDate"] or "", p["code"]), reverse=True)
    return rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, help="bu kadar günü yeniden tara")
    args = ap.parse_args()

    DATA.mkdir(exist_ok=True)
    cache = json.loads(CACHE.read_text(encoding="utf8")) if CACHE.exists() else {"scanned": None, "items": {}}
    today = dt.date.today()
    if args.days:
        start = today - dt.timedelta(days=args.days)
    elif cache["scanned"]:
        start = dt.date.fromisoformat(cache["scanned"]) - dt.timedelta(days=RESCAN_DAYS)
    else:
        start = today - dt.timedelta(days=FIRST_RUN_DAYS)
    print(f"KAP taranıyor: {start} → {today}", flush=True)

    def save() -> None:
        CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf8")

    # Haftalık pencerelerle, en yeniden geriye doğru
    found: list[dict] = []
    b = today
    while b >= start:
        a = max(start, b - dt.timedelta(days=WINDOW_DAYS - 1))
        found += kap_range(a, b)
        b = a - dt.timedelta(days=1)
    new = [x for x in found if str(x["disclosureIndex"]) not in cache["items"]
           or cache["items"][str(x["disclosureIndex"])].get("error")]
    print(f"{len(found)} sermaye bildirimi, {len(new)} yeni; ayrıntılar çekiliyor", flush=True)
    for i, x in enumerate(new, 1):
        rec = fetch_detail(x)
        cache["items"][str(rec["id"])] = rec
        if i % 50 == 0:
            print(f"  {i}/{len(new)}", flush=True)
            save()

    cache["scanned"] = today.isoformat()
    save()

    tickers = set(json.loads((DATA / "tickers.json").read_text(encoding="utf8")))
    rows = build_table(list(cache["items"].values()), tickers)
    OUT.write_text(json.dumps({"updatedAt": dt.datetime.now().isoformat(timespec="minutes"), "rows": rows},
                              ensure_ascii=False), encoding="utf8")
    print(f"{len(rows)} sermaye işlemi → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
