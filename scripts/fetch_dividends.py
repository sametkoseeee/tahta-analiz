"""Temettü (kâr payı) takvimi: KAP "Kar Payı Dağıtım İşlemlerine İlişkin Bildirim"leri.

Her şirketin son 13 aydaki en yeni kâr payı bildirimi açılır; pay başına brüt/net nakit
kâr payı, stopaj, bedelsiz pay oranı, genel kurul tarihi ve ödeme (hak kullanım) tarihi okunur.

KAP sık istekte IP'yi geçici olarak engelliyor (429): istekler sıralı ve aralıklı, bildirim
ayrıntıları data/dividends_cache.json'da saklanır (sonraki çalıştırmalar yalnızca yenileri açar).

Çıktı: data/dividends.json
  python scripts/fetch_dividends.py
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
OUT = DATA / "dividends.json"
CACHE = DATA / "dividends_cache.json"

LIST_URL = "https://kap.org.tr/tr/api/disclosure/members/byCriteria"
DETAIL_URL = "https://kap.org.tr/tr/Bildirim/{}"
HEADERS = {"Accept-Language": "tr", "User-Agent": "Mozilla/5.0"}
SUBJECT = "Kar Payı Dağıtım İşlemlerine İlişkin Bildirim"
KAP_LIMIT = 2000
PAUSE = 4.0
DAYS = 400
WINDOW = 10


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
            wait = 60 * (attempt + 1) if "429" in str(e) else 5
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
    return [r for r in rows if r.get("subject") == SUBJECT]


def tr_number(s: str | None) -> float | None:
    if not s:
        return None
    try:
        return float(s.strip().replace(".", "").replace(",", "."))
    except ValueError:
        return None


def tr_date(s: str | None) -> str | None:
    m = re.search(r"(\d{2})\.(\d{2})\.(\d{4})", s or "")
    return f"{m[3]}-{m[2]}-{m[1]}" if m else None


def form_rows(page: str) -> list[tuple[list[str], list[str]]]:
    """Bildirim formundaki satırlar: (sınıflar, hücreler). Form sayfaya RSC verisi içinde
    kaçışlı HTML olarak gömülü; tablo sınıf adı bildirim türüne göre değiştiği için tamamı taranır."""
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
            out.append((tr.get("class") or [], cells))
    return out


def parse(page: str, code: str) -> dict:
    rows = form_rows(page)
    kv = {c[0]: c[1] for _, c in rows if len(c) == 2}
    rec = {
        "summary": kv.get("Özet Bilgi"),
        "decision": tr_date(kv.get("Karar Tarihi")),
        "meeting": tr_date(kv.get("Konunun Gündemde Yer Aldığı Genel Kurul Tarihi")),
        "discussed": kv.get("Kar Payı Dağıtımı Konusu Görüşüldü mü?"),
        "cashForm": kv.get("Nakit Kar Payı Ödeme Şekli"),
        "stockForm": kv.get("Pay Biçiminde Ödeme"),
        "gross": None, "net": None, "withholding": None, "bonusPct": None, "payDate": None,
    }

    def section(start: str, stop: tuple[str, ...]):
        on = False
        for cls, cells in rows:
            if cells[0].startswith(start):
                on = True
                continue
            if on and any(cells[0].startswith(s) for s in stop):
                return
            if on:
                yield cls, cells

    # Nakit kâr payı tablosu: işlem gören pay grubu (kodu içeren satır), yoksa ilk satır
    header, data = None, []
    for _, cells in section("Nakit Kar Payı Ödeme Tutar ve Oranları", ("Kar Payı Ödeme Tarihleri", "Pay Olarak")):
        if cells[0] == "Pay Grup Bilgileri":
            header = cells
        elif header and len(cells) == len(header):
            data.append(dict(zip(header, cells)))
    row = next((d for d in data if code in d.get("Pay Grup Bilgileri", "")), data[0] if data else None)
    if row:
        col = lambda *n: next((v for k, v in row.items() if all(x in k for x in n)), None)  # noqa: E731
        rec["gross"] = tr_number(col("Brüt(TL)"))
        rec["net"] = tr_number(col("Net(TL)"))
        rec["withholding"] = tr_number(col("Stopaj"))

    # Ödeme tarihleri: genel kurulca onaylanan sonra gelir; bölümdeki son tarih
    dates = [tr_date(c) for _, cells in section("Kar Payı Ödeme Tarihleri", ("Pay Olarak", "Ek Açıklamalar"))
             for c in cells if tr_date(c)]
    rec["payDate"] = dates[-1] if dates else None

    header, data = None, []
    for _, cells in section("Pay Olarak Kar Payı Ödeme Tutar ve Oranları", ("Ek Açıklamalar", "Eklenen")):
        if cells[0] == "Pay Grup Bilgileri":
            header = cells
        elif header and len(cells) == len(header):
            data.append(dict(zip(header, cells)))
    row = next((d for d in data if code in d.get("Pay Grup Bilgileri", "")), data[0] if data else None)
    if row:
        rec["bonusPct"] = tr_number(next((v for k, v in row.items() if "Oranı" in k), None))
    return rec


def main() -> None:
    tickers = set(json.loads((DATA / "tickers.json").read_text(encoding="utf-8")))
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    today = date.today()

    print("KAP: kâr payı bildirimleri", flush=True)
    found, b = [], today
    start = today - timedelta(days=DAYS)
    while b >= start:
        a = max(start, b - timedelta(days=WINDOW - 1))
        found += kap_range(a, b)
        b = a - timedelta(days=1)

    # Şirket başına en yeni bildirim
    latest: dict[str, dict] = {}
    for r in found:
        for code in [c.strip() for c in (r.get("stockCodes") or "").split(",") if c.strip() in tickers]:
            if code not in latest or r["disclosureIndex"] > latest[code]["disclosureIndex"]:
                latest[code] = r
    todo = [r for r in latest.values() if str(r["disclosureIndex"]) not in cache]
    print(f"  {len(found)} bildirim, {len(latest)} şirket, {len(todo)} yeni ayrıntı", flush=True)

    for i, r in enumerate(todo, 1):
        code = next(c.strip() for c in r["stockCodes"].split(",") if c.strip() in tickers)
        try:
            cache[str(r["disclosureIndex"])] = parse(get("GET", DETAIL_URL.format(r["disclosureIndex"])).text, code)
        except Exception as e:  # noqa: BLE001
            print(f"  {r['disclosureIndex']}: {e}", file=sys.stderr)
        if i % 25 == 0:
            print(f"  {i}/{len(todo)}", flush=True)
            CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
    CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    items = []
    for code, r in latest.items():
        d = cache.get(str(r["disclosureIndex"]))
        if not d:
            continue
        pays_cash = (d["gross"] or 0) > 0
        pays_bonus = (d["bonusPct"] or 0) > 0
        if not pays_cash and not pays_bonus:
            status = "Dağıtılmayacak"
        elif d["payDate"] and d["payDate"] <= today.isoformat():
            status = "Ödendi"
        elif d["discussed"] == "Görüşüldü" or "genel kurul" in (d["summary"] or "").lower():
            status = "Onaylandı"
        else:
            status = "Teklif"
        items.append({"code": code, "id": r["disclosureIndex"], "published": r["publishDate"][:10],
                      **{k: d[k] for k in ("summary", "decision", "meeting", "gross", "net", "withholding",
                                           "bonusPct", "payDate")}, "status": status})
    items.sort(key=lambda x: (x["payDate"] or "0000", x["code"]), reverse=True)
    OUT.write_text(json.dumps({"updatedAt": datetime.now().isoformat(timespec="minutes"), "items": items},
                              ensure_ascii=False), encoding="utf-8")
    print(f"{len(items)} şirket yazıldı ({sum(1 for x in items if x['status'] != 'Dağıtılmayacak')} kâr payı dağıtan)")


if __name__ == "__main__":
    main()
