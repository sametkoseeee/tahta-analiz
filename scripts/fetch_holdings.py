"""Hisse senedi fonlarının en büyük hisseleri: KAP aylık "Portföy Dağılım Raporu" (PDF eki).

Her hisse fonunun en yeni aylık raporu açılır, PDF'teki hisse satırları okunur (aynı hissenin
birden fazla satırı ve açığa satışlar toplanır) ve fon toplam değerine oranlanır.

Rapor biçimi portföy şirketine göre değişiyor; satırlar pdfplumber ile satır satır okunuyor:
satırın ilk sözcüğü borsa kodu, rayiç değer ise satırdaki nominal × fiyat çarpımına eşit sayı
(fiyat sütunu olmayan raporlarda satırdaki en büyük tutar).

KAP sık istekte IP'yi engelliyor (429). Bu yüzden:
- istekler sıralı ve aralıklı,
- rapor listesinin 2 haftadan eski pencereleri önbellekte tutulur,
- okunan raporlar data/holdings_cache.json'da saklanır; bir çalıştırmada en fazla MAX_NEW yeni rapor açılır
  (rapor ayda bir yayımlandığından ilk doldurmadan sonra her ay ~190 rapor, birkaç akşama yayılır).

Çıktı: data/holdings.json
  python scripts/fetch_holdings.py
  python scripts/fetch_holdings.py --pdf rapor.pdf   (yerel deneme, KAP'a istek atmaz)
"""

import io
import json
import re
import sys
import time
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path

import pdfplumber
import requests

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = DATA / "holdings.json"
CACHE = DATA / "holdings_cache.json"

LIST_URL = "https://kap.org.tr/tr/api/disclosure/funds/byCriteria"
DETAIL_URL = "https://kap.org.tr/tr/Bildirim/{}"
FILE_URL = "https://kap.org.tr/tr/api/file/download/{}"
HEADERS = {"Accept-Language": "tr", "User-Agent": "Mozilla/5.0"}
SUBJECT_OID = "8aca490d502e34b801502e380044002b"  # Portföy Dağılım Raporu
KAP_LIMIT = 2000
PAUSE = 5.0
DAYS = 75  # aylık rapor ay bitiminden ~10 gün sonra geliyor; son iki ayın raporları
BLOCK = 7
FRESH_DAYS = 14
MAX_NEW = 60
FORMAT = 2  # 1: yalnız ilk 10 hisse, 2: tüm hisseler

ATTACH = re.compile(r'objId\\?"?:\\?"([0-9a-f]{32})\\?",\\?"fileName\\?":\\?"([^"\\]+)')


def get(method: str, url: str, **kw) -> requests.Response:
    for attempt in range(5):
        try:
            r = requests.request(method, url, headers=HEADERS, timeout=120, **kw)
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


def kap_range(a: date, b: date, codes: set[str]) -> list[dict]:
    body = {"fromDate": a.isoformat(), "toDate": b.isoformat(), "fundTypeList": ["YF"], "mkkMemberOidList": [],
            "fundOidList": [], "passiveFundOidList": [], "disclosureClass": "", "isLate": "",
            "subjectList": [SUBJECT_OID], "discIndex": [], "fromSrc": False, "srcCategory": ""}
    rows = get("POST", LIST_URL, json=body).json()
    if len(rows) >= KAP_LIMIT and a < b:  # 2000 sınırı: aralığı böl
        mid = a + (b - a) // 2
        return kap_range(a, mid, codes) + kap_range(mid + timedelta(days=1), b, codes)
    # Aylık raporlar ("9. Ay"); serbest fonların haftalık raporları ("40. Hafta") alınmaz
    return [{"code": r["fundCode"], "idx": r["disclosureIndex"], "year": r["year"], "period": r["period"]}
            for r in rows if r.get("fundCode") in codes and str(r.get("ruleType", "")).endswith("Ay")]


def blocks(start: date, end: date):
    """Takvime sabitlenmiş BLOCK günlük pencereler (yeniden eskiye)"""
    o = end.toordinal()
    b = date.fromordinal(o - o % BLOCK)
    while b + timedelta(days=BLOCK - 1) >= start:
        yield b, min(b + timedelta(days=BLOCK - 1), end)
        b -= timedelta(days=BLOCK)


# --- PDF okuma ---------------------------------------------------------------------------------

NUM = re.compile(r"^-?\d[\d.,]*[.,]\d+%?$")


def number(tok: str, comma_decimal: bool) -> float | None:
    if not NUM.match(tok):
        return None
    tok = tok.rstrip("%")
    tok = tok.replace(".", "").replace(",", ".") if comma_decimal else tok.replace(",", "")
    try:
        return float(tok)
    except ValueError:
        return None


def market_value(nums: list[float]) -> float | None:
    """Satırdaki rayiç değer: başka iki sayının (nominal × fiyat) çarpımına eşit en büyük tutar"""
    best = None
    for k, v in enumerate(nums):
        if abs(v) < 1 or (best is not None and abs(v) <= abs(best)):
            continue
        for i, a in enumerate(nums):
            if i == k:
                continue
            for j in range(i + 1, len(nums)):
                if j != k and abs(a * nums[j] - v) <= max(0.05, abs(v) * 0.003):
                    best = v
                    break
            if best == v:
                break
    if best is None:  # fiyat sütunu yok: nominal ve rayiç değerden büyüğü
        big = [v for v in nums if abs(v) >= 1]
        best = max(big, key=abs) if big else None
    return best


TOTAL = [
    re.compile(r"FON TOPLAM DE[ĞG]ER[İI]\s*:?\s*(-?[\d.,]{6,})"),
    re.compile(r"TOPLAM DE[ĞG]ER\s*/\s*NET[^\d\n]*(?:\n[^\d\n]*)?\s*:?\s*([\d.,]{6,})", re.I),
]
# Portföy tablosu burada biter; sonrası temettüler ve ay içindeki alış / satış dökümü (aynı hisseler tekrar geçer)
END = re.compile(r"^\s*(?:(?:IV|4)\s*-\s*FON TOPLAM DE|(?:V|VI|VII|VIII|IX)\s*-)|PORTFÖYDEN SATIŞ|PORTFÖYE ALIŞ")
DIVIDEND = re.compile(r"TEM+ETT", re.I)


def parse_pdf(data: bytes, tickers: set[str]) -> dict | None:
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        # Yalnızca baştaki sayfalar: portföy tablosu başta, sonrası çoğunlukla işlem dökümü
        text = "\n".join(p.extract_text() or "" for p in pdf.pages[:12])
    comma_decimal = len(re.findall(r"\d\.\d{3},\d", text)) >= len(re.findall(r"\d,\d{3}\.\d", text))
    nav = None
    for rx in TOTAL:
        m = rx.search(text)
        if m and (nav := number(m[1], comma_decimal)):
            break
    if not nav or nav <= 0:
        return None
    values: dict[str, float] = defaultdict(float)
    head = re.search(r"(?:III|3)\s*-\s*FON PORTF", text)
    for line in text[head.start() if head else 0:].split("\n"):
        if END.search(line):
            break
        toks = line.split()
        if not toks or toks[0] not in tickers or DIVIDEND.search(line):
            continue
        nums = [n for t in toks[1:] if (n := number(t, comma_decimal)) is not None]
        v = market_value(nums)
        if v is not None:
            values[toks[0]] += v
    items = sorted(((c, round(v / nav * 100, 2)) for c, v in values.items() if v > 0), key=lambda x: -x[1])
    total = round(sum(p for _, p in items), 2)
    # Okuma hatası (yanlış toplam değer, işlem dökümünden gelen tekrarlar) şüphesi: kullanma
    if not items or total > 110 or total < 10 or items[0][1] > 40:
        return None
    # Tüm hisseler saklanır: fon sayfası ilk TOP'u, hisse sayfası "bu hisseyi tutan fonlar"ı gösterir
    return {"total": total, "count": len(items), "items": [{"code": c, "pct": p} for c, p in items if p >= 0.01]}


def download(idx: int) -> bytes | None:
    page = get("GET", DETAIL_URL.format(idx)).text
    att = [(oid, name) for oid, name in ATTACH.findall(page) if name.lower().endswith(".pdf")]
    if not att:
        return None
    raw = get("GET", FILE_URL.format(att[0][0])).content
    i = raw.find(b"%PDF")  # KAP dosyanın başına birkaç bayt ekliyor
    return raw[i:] if i >= 0 else None


def main() -> None:
    tickers = set(json.loads((DATA / "tickers.json").read_text(encoding="utf-8")))
    if len(sys.argv) > 2 and sys.argv[1] == "--pdf":
        print(json.dumps(parse_pdf(Path(sys.argv[2]).read_bytes(), tickers), ensure_ascii=False, indent=1))
        return

    funds = json.loads((DATA / "funds.json").read_text(encoding="utf-8"))["funds"]
    codes = {f["code"] for f in funds if "Hisse" in (f.get("umbrella") or "")}
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    lists: dict[str, list] = cache.get("lists", {})
    parsed: dict[str, dict] = cache.get("funds", {})

    today = date.today()
    start = today - timedelta(days=DAYS)
    fresh = today - timedelta(days=FRESH_DAYS)
    reports: list[dict] = []
    for a, b in blocks(start, today):
        key = a.isoformat()
        if key not in lists or b >= fresh:
            lists[key] = kap_range(a, b, codes)
        reports += lists[key]
    lists = {k: v for k, v in lists.items() if k >= (start - timedelta(days=BLOCK)).isoformat()}
    print(f"{len(reports)} aylık hisse fonu raporu", flush=True)

    # Fon başına en yeni dönem; aynı dönemin düzeltmesi varsa en son bildirim
    latest: dict[str, dict] = {}
    for r in reports:
        cur = latest.get(r["code"])
        if cur is None or (r["year"], r["period"], r["idx"]) > (cur["year"], cur["period"], cur["idx"]):
            latest[r["code"]] = r

    # Önce yeni dönem raporları, sonra eski biçimde (yalnız ilk 10 hisse) saklanmış olanlar yeniden okunur
    new = [r for r in latest.values() if parsed.get(r["code"], {}).get("idx") != r["idx"]]
    old = [r for r in latest.values() if r not in new and "items" in parsed[r["code"]]
           and parsed[r["code"]].get("v") != FORMAT]
    todo = new + old
    print(f"{len(new)} yeni, {len(old)} yeniden okunacak rapor; bu çalıştırmada en fazla {MAX_NEW}", flush=True)
    for r in todo[:MAX_NEW]:
        rec = {"idx": r["idx"], "period": f"{r['year']}-{r['period']:02d}", "v": FORMAT}
        try:
            pdf = download(r["idx"])
            res = parse_pdf(pdf, tickers) if pdf else None
        except Exception as e:  # noqa: BLE001
            print(f"  {r['code']}: {e}", file=sys.stderr, flush=True)
            continue
        if res:
            rec.update(res)
        else:
            rec["fail"] = True
            print(f"  {r['code']}: rapor okunamadı ({r['idx']})", flush=True)
        # Okunamayan yeni rapor, önceki ayın okunmuş verisini silmesin
        if res or "items" not in parsed.get(r["code"], {}):
            parsed[r["code"]] = rec
        else:
            parsed[r["code"]]["idx"] = r["idx"]

    CACHE.write_text(json.dumps({"lists": lists, "funds": parsed}, ensure_ascii=False, separators=(",", ":")),
                     encoding="utf-8")
    out = {c: {k: d[k] for k in ("period", "total", "count", "items")} for c, d in parsed.items()
           if c in codes and "items" in d}
    OUT.write_text(json.dumps({"updatedAt": datetime.now().isoformat(timespec="seconds"), "funds": out},
                              ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    fails = sum(1 for d in parsed.values() if d.get("fail"))
    print(f"{len(out)} fonun hisseleri yazıldı ({fails} rapor okunamadı)", flush=True)


if __name__ == "__main__":
    main()
