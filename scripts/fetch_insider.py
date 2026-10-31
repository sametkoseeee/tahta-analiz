"""İçeriden işlemler: KAP "Pay Alım Satım Bildirimi" (yöneticiler, ortaklar, ilişkili kişiler) ve
"Payların Geri Alınmasına İlişkin Bildirim" (şirketin kendi payını geri alması).

- Alım-satım: her bildirim ayrı işlemdir; son DAYS gün açılır.
- Geri alım: her bildirimde programın tüm geçmiş işlemleri var; şirket başına yalnızca en yeni bildirim açılır.

KAP sık istekte IP'yi engelliyor (429): istekler sıralı ve aralıklı, liste pencereleri ve açılan bildirimler
data/insider_cache.json'da saklanır, bir çalıştırmada en fazla MAX_NEW bildirim açılır (ilk doldurma birkaç akşam).

Çıktı: data/insider.json
  python scripts/fetch_insider.py
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
OUT = DATA / "insider.json"
CACHE = DATA / "insider_cache.json"

LIST_URL = "https://kap.org.tr/tr/api/disclosure/members/byCriteria"
DETAIL_URL = "https://kap.org.tr/tr/Bildirim/{}"
HEADERS = {"Accept-Language": "tr", "User-Agent": "Mozilla/5.0"}
TRADE = "8aca490d50286f620150287614ae005c"  # Pay Alım Satım Bildirimi
BUYBACK = "4028328d6233239a01629b43e4694fae"  # Payların Geri Alınmasına İlişkin Bildirim
KAP_LIMIT = 2000
PAUSE = 5.0
DAYS = 30
BLOCK = 7
FRESH_DAYS = 10
MAX_NEW = 120


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
            "inactiveMkkMemberOidList": [], "disclosureClass": "", "subjectList": [TRADE, BUYBACK], "isLate": "",
            "mainSector": "", "sector": "", "subSector": "", "marketOid": "", "index": "", "bdkReview": "",
            "bdkMemberOidList": [], "year": "", "term": "", "ruleType": "", "period": "", "fromSrc": False,
            "srcCategory": "", "disclosureIndexList": []}
    rows = get("POST", LIST_URL, json=body).json()
    if len(rows) >= KAP_LIMIT and a < b:
        mid = a + (b - a) // 2
        return kap_range(a, mid) + kap_range(mid + timedelta(days=1), b)
    return [{"id": r["disclosureIndex"], "kind": "trade" if r.get("subject", "").startswith("Pay Alım") else "buyback",
             "published": r.get("publishDate"), "by": r.get("kapTitle"), "byCodes": r.get("stockCodes"),
             "summary": r.get("summary")} for r in rows]


def blocks(start: date, end: date):
    o = end.toordinal()
    b = date.fromordinal(o - o % BLOCK)
    while b + timedelta(days=BLOCK - 1) >= start:
        yield b, min(b + timedelta(days=BLOCK - 1), end)
        b -= timedelta(days=BLOCK)


def page_text(idx: int) -> str:
    t = get("GET", DETAIL_URL.format(idx)).text
    t = t.replace("\\u003c", "<").replace("\\u003e", ">").replace("\\u0026", "&").replace('\\"', '"').replace("\\n", "\n")
    return BeautifulSoup(t, "html.parser").get_text("\n", strip=True)


def num(s: str | None) -> float | None:
    if not s:
        return None
    s = s.strip().replace("%", "").strip()
    if not re.search(r"\d", s):
        return None
    try:
        return float(s.replace(".", "").replace(",", "."))
    except ValueError:
        return None


def related(text: str) -> list[str]:
    # Şirket formu: "İlgili Şirketler\nRelated Companies\n[KOD]"; aracı kurum formu: "İlgili Şirketler\nKOD"
    m = re.search(r"İlgili Şirketler\nRelated Companies\n\[([^\]]*)\]", text) or re.search(
        r"İlgili Şirketler\n([A-Z0-9, ]{3,})\n", text)
    return [c.strip() for c in (m[1] if m else "").split(",") if c.strip()]


def attachment_trade(text: str) -> dict | None:
    """Aracı kurum aracılığıyla yapılan bildirim: işlem ayrıntısı ekte, metinde yalnızca işlemi yapan kişi yazar"""
    m = re.search(r"kapsamında\s+(.+?)\s+tarafından", text.replace("\n", ""))
    return {"who": m[1].strip()[:120]} if m else None


TRADE_ROW = re.compile(
    r"(\d{2}/\d{2}/\d{4})\n(-?[\d.,]+)\n(-?[\d.,]+)\n(-?[\d.,]+)\n(-?[\d.,]+)\n(-?[\d.,]+)\n%\s*([\d.,-]+)\n%\s*[\d.,-]+\n%\s*([\d.,-]+)")
PRICE = re.compile(r"(\d+(?:[.,]\d+)?)\s*(?:-|–|ile)\s*(\d+(?:[.,]\d+)?)\s*TL|(\d+(?:[.,]\d+)?)\s*TL\s*(?:fiyat|ortalama)", re.I)


def parse_trade(text: str) -> dict | None:
    rows = {}
    for m in TRADE_ROW.finditer(text):
        d = m[1]
        if d in rows:  # Türkçe ve İngilizce tablo aynı satırı tekrar eder
            continue
        rows[d] = {"date": f"{d[6:]}-{d[3:5]}-{d[:2]}", "buy": num(m[2]) or 0, "sell": num(m[3]) or 0,
                   "before": num(m[7]), "after": num(m[8])}
    if not rows:
        return None
    lst = sorted(rows.values(), key=lambda r: r["date"])
    expl = text[text.find("oda_ExplanationTextBlock"):][:1500]
    p = PRICE.search(expl)
    price = None
    if p:
        lo, hi, single = num(p[1]), num(p[2]), num(p[3])
        price = (lo + hi) / 2 if lo and hi else single
    return {"date": lst[-1]["date"], "first": lst[0]["date"], "buy": sum(r["buy"] for r in lst),
            "sell": sum(r["sell"] for r in lst), "before": lst[0]["before"], "after": lst[-1]["after"], "price": price}


# "B Grubu, ATAKP, TREATKY00016" ya da "GUBRF, TRAGUBRF91E2"; planlanan dönem tablosu (iki tarih) eşleşmez
BUY_ROW = re.compile(
    r"(?:^|\n)(?:[^\n,]*,\s*)?([A-Z0-9]{3,6}),\s*TR[A-Z0-9]{10}\n(\d{2}\.\d{2}\.\d{4})\n(?!\d{2}\.\d{2}\.\d{4})([\d.,]+)\n([\d.,]+)\n([\d.,]+)(?=\n)")


def parse_buyback(text: str) -> list[dict]:
    i = text.find("Geri Alım İşlemlerinin Detayları")
    if i < 0:
        return []
    out = []
    for m in BUY_ROW.finditer(text[i:]):
        d = m[2]
        out.append({"code": m[1], "date": f"{d[6:]}-{d[3:5]}-{d[:2]}", "nominal": num(m[3]), "ratio": num(m[4]),
                    "price": num(m[5])})
    return out


def main() -> None:
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    lists: dict[str, list] = cache.get("lists", {})
    parsed: dict[str, dict] = cache.get("parsed", {})
    buybacks: dict[str, dict] = cache.get("buybacks", {})  # "KOD|tarih" -> işlem

    today = date.today()
    start = today - timedelta(days=DAYS)
    fresh = today - timedelta(days=FRESH_DAYS)
    rows: list[dict] = []
    for a, b in blocks(start, today):
        key = a.isoformat()
        if key not in lists or b >= fresh:
            lists[key] = kap_range(a, b)
        rows += lists[key]
    lists = {k: v for k, v in lists.items() if k >= (start - timedelta(days=BLOCK)).isoformat()}
    print(f"{len(rows)} bildirim ({sum(r['kind'] == 'trade' for r in rows)} alım-satım)", flush=True)

    # Geri alım: şirket (bildirimi yapan) başına en yeni bildirim yeterli
    newest: dict[str, dict] = {}
    for r in rows:
        if r["kind"] == "buyback":
            k = r["byCodes"] or r["by"]
            if k not in newest or r["id"] > newest[k]["id"]:
                newest[k] = r
    todo = [r for r in rows if r["kind"] == "trade" and str(r["id"]) not in parsed]
    todo += [r for r in newest.values() if str(r["id"]) not in parsed]
    todo.sort(key=lambda r: -r["id"])  # önce en yeniler
    print(f"{len(todo)} yeni bildirim açılacak, bu çalıştırmada en fazla {MAX_NEW}", flush=True)

    for r in todo[:MAX_NEW]:
        try:
            text = page_text(r["id"])
        except Exception as e:  # noqa: BLE001
            print(f"  {r['id']}: {e}", file=sys.stderr, flush=True)
            continue
        codes = related(text)
        if r["kind"] == "trade":
            t = parse_trade(text)
            a = None if t else attachment_trade(text)
            parsed[str(r["id"])] = {**r, "codes": codes, **(t or {}), **(a or {}), "ok": bool(t or a)}
        else:
            items = parse_buyback(text)
            # Aynı gün farklı fiyatlardan birden çok satır olabilir: bildirimdeki satırlar gün bazında toplanır
            # (aynı şirketin sonraki bildirimi aynı günü yeniden yazar, böylece tekrar sayılmaz)
            days: dict[str, dict] = {}
            for it in items:
                k = f"{it['code']}|{it['date']}"
                d = days.setdefault(k, {"code": it["code"], "date": it["date"], "nominal": 0.0, "ratio": 0.0, "amount": 0.0})
                d["nominal"] += it["nominal"] or 0
                d["ratio"] += it["ratio"] or 0
                d["amount"] += (it["nominal"] or 0) * (it["price"] or 0)
            for k, d in days.items():
                d["price"] = round(d["amount"] / d["nominal"], 4) if d["nominal"] else None
                buybacks[k] = {**d, "id": r["id"]}
            parsed[str(r["id"])] = {"id": r["id"], "kind": "buyback", "ok": bool(items)}

    CACHE.write_text(json.dumps({"lists": lists, "parsed": parsed, "buybacks": buybacks}, ensure_ascii=False,
                                separators=(",", ":")), encoding="utf-8")

    known = {}
    idx = DATA / "companies.json"
    if idx.exists():
        known = {c["code"]: c for c in json.loads(idx.read_text(encoding="utf-8"))["companies"]}
    lo = start.isoformat()
    trades = []
    for p in parsed.values():
        if p.get("kind") != "trade" or not p.get("ok"):
            continue
        # Ekli bildirimde işlem tarihi yok: yayım tarihi kullanılır
        day = p.get("date") or (f"{p['published'][6:10]}-{p['published'][3:5]}-{p['published'][:2]}" if p.get("published") else "")
        code = next((c for c in p["codes"] if c in known), p["codes"][0] if p["codes"] else None)
        if not code or day < lo:
            continue
        detail = "buy" in p
        net = p["buy"] - p["sell"] if detail else None
        trades.append({"id": p["id"], "code": code, "by": p.get("who") or p["by"], "summary": p["summary"], "date": day,
                       "buy": p.get("buy"), "sell": p.get("sell"), "net": net, "before": p.get("before"),
                       "after": p.get("after"), "price": p.get("price"),
                       "value": round(abs(net) * p["price"]) if detail and p.get("price") else None})
    trades.sort(key=lambda t: (t["date"], t["id"]), reverse=True)
    bb = sorted((v for v in buybacks.values() if v["date"] >= lo), key=lambda v: (v["date"], v["code"]), reverse=True)
    for v in bb:
        v["value"] = round(v.pop("amount", 0) or (v["nominal"] or 0) * (v["price"] or 0)) or None
        v["ratio"] = round(v["ratio"], 5)
    OUT.write_text(json.dumps({"updatedAt": datetime.now().isoformat(timespec="seconds"), "trades": trades,
                               "buybacks": bb}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    fails = sum(1 for p in parsed.values() if not p.get("ok"))
    print(f"{len(trades)} alım-satım, {len(bb)} geri alım işlemi yazıldı ({fails} bildirim okunamadı)", flush=True)


if __name__ == "__main__":
    main()
