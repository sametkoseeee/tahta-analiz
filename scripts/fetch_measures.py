"""Tedbirli hisseler: Borsa İstanbul'un KAP'taki "Pay Piyasasında Volatilite Bazlı Tedbir Sistemi"
(VBTS) duyuruları.

Duyuru metninden pay kodu, tedbirin başlangıç/bitiş tarihi ve türü (kredili işlem ve açığa satış
yasağı, brüt takas, emir paketi, tek fiyat, internetten emir yasağı) okunur. Açılan duyurular
data/measures_cache.json'da saklanır; sonraki çalıştırmalar yalnızca yenileri açar.

Çıktı: data/measures.json
  python scripts/fetch_measures.py
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
OUT = DATA / "measures.json"
CACHE = DATA / "measures_cache.json"

LIST_URL = "https://kap.org.tr/tr/api/disclosure/members/byCriteria"
DETAIL_URL = "https://kap.org.tr/tr/Bildirim/{}"
HEADERS = {"Accept-Language": "tr", "User-Agent": "Mozilla/5.0"}
TOPIC = "Volatilite Bazlı Tedbir"
KAP_LIMIT = 2000
PAUSE = 4.0
DAYS = 120  # VBTS tedbirleri genelde bir ay sürer; son biten tedbirler de gösterilir
WINDOW = 10

# Metindeki ifade -> tedbir türü (sayfadaki sütunlar)
KINDS = {
    "credit": ("kredili", "açığa satış"),
    "gross": ("brüt takas",),
    "package": ("emir paketi",),
    "single": ("tek fiyat",),
    "internet": ("internet", "elektronik ortam"),
}
DATE = r"(\d{2})[./](\d{2})[./](\d{4})"


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
    """Borsa İstanbul gibi şirket dışı KAP üyelerinin (DDK) duyuruları; devre kesici duyuruları çok
    olduğundan 2000 sınırına sık takılır, aralık bölünür."""
    body = {"fromDate": a.isoformat(), "toDate": b.isoformat(), "memberType": "DDK", "mkkMemberOidList": [],
            "inactiveMkkMemberOidList": [], "disclosureClass": "", "subjectList": [], "isLate": "", "mainSector": "",
            "sector": "", "subSector": "", "marketOid": "", "index": "", "bdkReview": "", "bdkMemberOidList": [],
            "year": "", "term": "", "ruleType": "", "period": "", "fromSrc": False, "srcCategory": "",
            "disclosureIndexList": []}
    rows = get("POST", LIST_URL, json=body).json()
    if len(rows) >= KAP_LIMIT and a < b:
        mid = a + (b - a) // 2
        return kap_range(a, mid) + kap_range(mid + timedelta(days=1), b)
    return [r for r in rows if TOPIC in (r.get("summary") or "") + (r.get("subject") or "")]


def iso(m: tuple[str, str, str]) -> str:
    return f"{m[2]}-{m[1]}-{m[0]}"


def parse(page: str) -> list[dict]:
    """Duyurunun Türkçe metnindeki her cümle: '<KOD>.E payları <başlangıç> ... <bitiş> ... <tedbir>'"""
    page = (page.replace("\\u003c", "<").replace("\\u003e", ">").replace("\\u0026", "&")
            .replace('\\"', '"').replace("\\n", "\n"))
    soup = BeautifulSoup(page, "html.parser")
    text = "\n".join(td.get_text("\n", strip=True)
                     for td in soup.select("td.content-tr") if "text-block-value" in str(td))
    out = []
    for sentence in re.split(r"(?<=\.)\s+|\n", text):
        codes = re.findall(r"\b([A-Z0-9]{3,6})\.E\b", sentence)
        dates = re.findall(DATE, sentence)
        if not codes or len(dates) < 2:
            continue
        low = sentence.lower()
        kinds = [k for k, words in KINDS.items() if any(w in low for w in words)]
        for code in codes:
            out.append({"code": code, "start": iso(dates[0]), "end": iso(dates[1]), "kinds": kinds,
                        "text": sentence.strip()})
    return out


def main() -> None:
    tickers = set(json.loads((DATA / "tickers.json").read_text(encoding="utf-8")))
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    today = date.today()

    print("KAP: VBTS duyuruları", flush=True)
    found, b = [], today
    start = today - timedelta(days=DAYS)
    while b >= start:
        a = max(start, b - timedelta(days=WINDOW - 1))
        found += kap_range(a, b)
        b = a - timedelta(days=1)
    todo = [r for r in found if str(r["disclosureIndex"]) not in cache]
    print(f"  {len(found)} duyuru, {len(todo)} yeni", flush=True)
    for r in todo:
        try:
            cache[str(r["disclosureIndex"])] = parse(get("GET", DETAIL_URL.format(r["disclosureIndex"])).text)
        except Exception as e:  # noqa: BLE001
            print(f"  {r['disclosureIndex']}: {e}", file=sys.stderr)
    CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    items = []
    for r in found:
        for m in cache.get(str(r["disclosureIndex"])) or []:
            if m["code"] in tickers:
                items.append({**m, "id": r["disclosureIndex"],
                              "published": datetime.strptime(r["publishDate"][:10], "%d.%m.%Y").date().isoformat()})
    items.sort(key=lambda x: (x["end"], x["code"]), reverse=True)
    OUT.write_text(json.dumps({"updatedAt": datetime.now().isoformat(timespec="minutes"), "items": items},
                              ensure_ascii=False), encoding="utf-8")
    active = sum(1 for x in items if x["end"] >= today.isoformat())
    print(f"{len(items)} tedbir yazıldı ({active} süren)")


if __name__ == "__main__":
    main()
