"""Son ve yaklaşan bilançolar (KAP).

- Son bilançolar: "Finansal Rapor" bildirimleri (disclosureClass FR); her şirketin en son
  açıkladığı dönem ve açıklanma zamanı.
- Yaklaşan bilançolar: şirketlerin "Finansal Takvim" bildirimlerindeki planlanan KAP ilan
  tarihleri. Her şirket tarih duyurmaz; yalnızca duyuranlar listelenir.

KAP sık istekte IP'yi geçici olarak engelliyor (429): istekler sıralı ve aralıklı,
takvim bildirimlerinin ayrıntısı data/reports_cache.json'da saklanır.

Çıktı: data/reports.json
  python scripts/fetch_reports.py
"""

import html
import json
import re
import sys
import time
from datetime import date, datetime, timedelta
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = DATA / "reports.json"
CACHE = DATA / "reports_cache.json"

LIST_URL = "https://kap.org.tr/tr/api/disclosure/members/byCriteria"
DETAIL_URL = "https://kap.org.tr/tr/Bildirim/{}"
HEADERS = {"Accept-Language": "tr", "User-Agent": "Mozilla/5.0"}
KAP_LIMIT = 2000
PAUSE = 4.0
RECENT_DAYS = 100  # son çeyrek raporu bu süre içinde açıklanmış olur
CALENDAR_DAYS = 75
WINDOW = 10

PERIOD_MONTHS = {"3 Aylık": 3, "6 Aylık": 6, "9 Aylık": 9, "Yıllık": 12}
MONTHS_TR = {m: i for i, m in enumerate(
    ["ocak", "şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"], 1)}


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


def kap_range(a: date, b: date, cls: str) -> list[dict]:
    body = {"fromDate": a.isoformat(), "toDate": b.isoformat(), "memberType": "IGS", "mkkMemberOidList": [],
            "inactiveMkkMemberOidList": [], "disclosureClass": cls, "subjectList": [], "isLate": "", "mainSector": "",
            "sector": "", "subSector": "", "marketOid": "", "index": "", "bdkReview": "", "bdkMemberOidList": [],
            "year": "", "term": "", "ruleType": "", "period": "", "fromSrc": False, "srcCategory": "",
            "disclosureIndexList": []}
    rows = get("POST", LIST_URL, json=body).json()
    if len(rows) >= KAP_LIMIT and a < b:  # 2000 sınırı: aralığı böl
        mid = a + (b - a) // 2
        return kap_range(a, mid, cls) + kap_range(mid + timedelta(days=1), b, cls)
    return rows


def scan(days: int, cls: str) -> list[dict]:
    today = date.today()
    rows, b = [], today
    start = today - timedelta(days=days)
    while b >= start:
        a = max(start, b - timedelta(days=WINDOW - 1))
        rows += kap_range(a, b, cls)
        b = a - timedelta(days=1)
    return rows


def parse_dt(s: str) -> datetime:
    return datetime.strptime(s, "%d.%m.%Y %H:%M:%S")


def our_codes(stock_codes: str | None, tickers: set[str]) -> list[str]:
    return [c.strip() for c in (stock_codes or "").split(",") if c.strip() in tickers]


def any_date(s: str) -> date | None:
    """'28/10/2026', '28.10.2026' ya da '26 Ekim 2026'"""
    m = re.search(r"(\d{1,2})[./](\d{1,2})[./](\d{4})", s)
    if m:
        return date(int(m[3]), int(m[2]), int(m[1]))
    m = re.search(r"(\d{1,2})\s+(" + "|".join(MONTHS_TR) + r")\s+(\d{4})", s.lower())
    if m:
        return date(int(m[3]), MONTHS_TR[m[2]], int(m[1]))
    return None


def calendar_dates(did: int) -> list[tuple[str, str]]:
    """Finansal Takvim bildiriminden (dönem sonu, planlanan ilan tarihi) çiftleri."""
    page = get("GET", DETAIL_URL.format(did)).text
    i = page.find("oda_ExplanationTextBlock")
    chunk = page[i:i + 80000] if i >= 0 else page
    chunk = (chunk.replace("\\u003c", "<").replace("\\u003e", ">").replace("\\u0026", "&")
             .replace('\\"', '"').replace("\\n", "\n"))
    text = html.unescape(re.sub(r"<[^>]+>", "\n", chunk))
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    # Tablo: her dönem için başlangıç / bitiş / planlanan ilan tarihi art arda (dd/mm/yyyy)
    slash = [l for l in lines if re.fullmatch(r"\d{2}/\d{2}/\d{4}", l)]
    pairs = []
    for k in range(0, len(slash) - 2, 3):
        end, plan = any_date(slash[k + 1]), any_date(slash[k + 2])
        if end and plan:
            pairs.append((end.isoformat(), plan.isoformat()))
    if pairs:
        return pairs
    # Tablo boşsa açıklama metni: "... 30.09.2026 dönemine ... 26 Ekim 2026 tarihinde ..."
    body = " ".join(lines[:40])
    m = re.search(r"(\d{1,2}[./]\d{1,2}[./]\d{4}|\d{1,2}\s+\w+\s+\d{4})\s+tarihinde", body)
    plan = any_date(m[1]) if m else None
    ends = re.findall(r"[-–]\s*(\d{1,2}[./]\d{1,2}[./]\d{4}|\d{1,2}\s+\w+\s+\d{4})", body)
    end = any_date(ends[0]) if ends else None
    return [(end.isoformat() if end else "", plan.isoformat())] if plan else []


def main() -> None:
    tickers = set(json.loads((DATA / "tickers.json").read_text(encoding="utf-8")))
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    today = date.today().isoformat()

    print("KAP: finansal raporlar", flush=True)
    latest: dict[str, dict] = {}
    for r in scan(RECENT_DAYS, "FR"):
        if r.get("subject") != "Finansal Rapor" or r.get("ruleType") not in PERIOD_MONTHS or not r.get("year"):
            continue
        for code in our_codes(r.get("stockCodes"), tickers):
            item = {"code": code, "at": parse_dt(r["publishDate"]).isoformat(timespec="minutes"),
                    "period": f"{r['year']}-{PERIOD_MONTHS[r['ruleType']]:02d}", "id": r["disclosureIndex"]}
            prev = latest.get(code)
            # En yeni dönem; aynı dönemde (konsolide/solo) ilk açıklanan
            if not prev or item["period"] > prev["period"] or (item["period"] == prev["period"] and item["at"] < prev["at"]):
                latest[code] = item
    recent = sorted(latest.values(), key=lambda x: x["at"], reverse=True)
    print(f"  {len(recent)} şirket")

    print("KAP: finansal takvimler", flush=True)
    calendars = [r for r in scan(CALENDAR_DAYS, "DG") if r.get("subject") == "Finansal Takvim"]
    upcoming: dict[str, dict] = {}
    for r in sorted(calendars, key=lambda x: x["disclosureIndex"]):
        codes = our_codes(r.get("stockCodes"), tickers)
        if not codes:
            continue
        key = str(r["disclosureIndex"])
        if key not in cache:
            try:
                cache[key] = calendar_dates(r["disclosureIndex"])
            except Exception as e:  # noqa: BLE001
                print(f"  {key}: {e}", file=sys.stderr)
                continue
        future = sorted((plan, end) for end, plan in cache[key] if plan >= today)
        if not future:
            continue
        plan, end = future[0]
        for code in codes:
            # Aynı şirketin daha yeni takvim bildirimi (ör. tarih değişikliği) eskisinin yerine geçer
            upcoming[code] = {"code": code, "date": plan, "periodEnd": end or None, "id": r["disclosureIndex"]}
    # Takvimdeki dönemi zaten açıklamış olanları çıkar
    upcoming_list = [u for u in upcoming.values()
                     if not (u["periodEnd"] and latest.get(u["code"], {}).get("period", "") >= u["periodEnd"][:7])]
    upcoming_list.sort(key=lambda x: (x["date"], x["code"]))
    print(f"  {len(upcoming_list)} yaklaşan bilanço")

    CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
    OUT.write_text(json.dumps({"updatedAt": datetime.now().isoformat(timespec="minutes"), "recent": recent,
                               "upcoming": upcoming_list}, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
