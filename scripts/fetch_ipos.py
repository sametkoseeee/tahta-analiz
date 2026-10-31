"""Halka arz takvimi: KAP "Payların Borsa Birincil Piyasada Halka Arzı" (Borsa İstanbul duyurusu: fiyat,
satış tarihleri, aracı kurum, pazar) ve "Halka Arz Sonuçları" (aracı kurum: büyüklük, katılımcı sayısı).

İki bildirim şirket koduyla birleştirilir. Liste sorgusu iki konu ile süzüldüğünden yılda ~60 bildirim
gelir; açılan bildirimler data/ipos_cache.json'da saklanır, KAP'a az istek gider.

Çıktı: data/ipos.json
  python scripts/fetch_ipos.py
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
OUT = DATA / "ipos.json"
CACHE = DATA / "ipos_cache.json"

LIST_URL = "https://kap.org.tr/tr/api/disclosure/members/byCriteria"
DETAIL_URL = "https://kap.org.tr/tr/Bildirim/{}"
HEADERS = {"Accept-Language": "tr", "User-Agent": "Mozilla/5.0"}
OFFER = "8aca490d4ff02191014ff0375bd800b1"  # Payların Borsa Birincil Piyasada Halka Arzı
RESULT = "4028328d9c4c12ca019c6bf0a40c0518"  # Halka Arz Sonuçları
PAUSE = 5.0
DAYS = 365
MAX_NEW = 40

MONTHS = {m: i + 1 for i, m in enumerate(
    ["ocak", "şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"])}


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


def kap_list(a: date, b: date) -> list[dict]:
    body = {"fromDate": a.isoformat(), "toDate": b.isoformat(), "memberType": "IGS", "mkkMemberOidList": [],
            "inactiveMkkMemberOidList": [], "disclosureClass": "", "subjectList": [OFFER, RESULT], "isLate": "",
            "mainSector": "", "sector": "", "subSector": "", "marketOid": "", "index": "", "bdkReview": "",
            "bdkMemberOidList": [], "year": "", "term": "", "ruleType": "", "period": "", "fromSrc": False,
            "srcCategory": "", "disclosureIndexList": []}
    return get("POST", LIST_URL, json=body).json()


def fields(idx: int) -> dict:
    """Bildirim formu: "oda_Alan|..." satırından sonra TR etiket, EN etiket, TR değer gelir"""
    page = get("GET", DETAIL_URL.format(idx)).text
    page = (page.replace("\\u003c", "<").replace("\\u003e", ">").replace("\\u0026", "&")
            .replace('\\"', '"').replace("\\n", "\n"))
    lines = BeautifulSoup(page, "html.parser").get_text("\n", strip=True).split("\n")
    out: dict[str, str] = {}
    m = re.search(r"İlgili Şirketler\nRelated Companies\n\[([^\]]*)\]", "\n".join(lines))
    out["codes"] = m[1] if m else ""
    keys = [i for i, s in enumerate(lines) if s.startswith("oda_")]
    for n, i in enumerate(keys):
        key = lines[i].split("|", 1)[0][4:]
        end = keys[n + 1] if n + 1 < len(keys) else min(len(lines), i + 40)
        # Serbest metin alanında etiket yok, metin hemen başlar
        vals = lines[i + 1:end] if key.endswith("TextBlock") else lines[i + 3:end]
        if not vals:
            continue
        out[key] = " ".join(vals) if key.endswith("TextBlock") else vals[0]
    return out


def tr_number(s: str | None) -> float | None:
    if not s or not re.search(r"\d", s):
        return None
    try:
        return float(s.strip().replace(".", "").replace(",", "."))
    except ValueError:
        return None


def sale_dates(text: str) -> tuple[str | None, str | None]:
    """Açıklamadaki satış günleri: "26-27/08/2026", "9-10-11 Eylül 2026", "26.08.2026 - 27.08.2026" """
    t = text.lower()
    m = re.search(r"((?:\d{1,2}\s*[-–,]\s*|\d{1,2}\s+ve\s+)*\d{1,2})\s*[./](\d{1,2})[./](\d{4})", t)
    n = re.search(r"((?:\d{1,2}\s*[-–,]\s*|\d{1,2}\s+ve\s+)*\d{1,2})\s+(" + "|".join(MONTHS) + r")\s+(\d{4})", t)
    full = re.findall(r"\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b", t)
    if n and (not m or n.start() < m.start()):
        days, month, year = [int(d) for d in re.findall(r"\d{1,2}", n[1])], MONTHS[n[2]], int(n[3])
    elif m:
        days, month, year = [int(d) for d in re.findall(r"\d{1,2}", m[1])], int(m[2]), int(m[3])
        # "26.08.2026 - 27.08.2026": iki tam tarih
        if len(days) == 1 and len(full) >= 2:
            a, b = full[0], full[1]
            return (f"{a[2]}-{int(a[1]):02d}-{int(a[0]):02d}", f"{b[2]}-{int(b[1]):02d}-{int(b[0]):02d}")
    else:
        return None, None
    try:
        return (date(year, month, min(days)).isoformat(), date(year, month, max(days)).isoformat())
    except ValueError:
        return None, None


def main() -> None:
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    today = date.today()
    rows = kap_list(today - timedelta(days=DAYS // 2), today) + kap_list(today - timedelta(days=DAYS), today - timedelta(days=DAYS // 2 + 1))
    print(f"{len(rows)} halka arz bildirimi", flush=True)

    new = [r for r in rows if str(r["disclosureIndex"]) not in cache][:MAX_NEW]
    for r in new:
        try:
            f = fields(r["disclosureIndex"])
        except Exception as e:  # noqa: BLE001
            print(f"  {r['disclosureIndex']}: {e}", file=sys.stderr, flush=True)
            continue
        f["subject"] = "offer" if "Birincil" in (r.get("subject") or "") else "result"
        f["published"] = r.get("publishDate")
        cache[str(r["disclosureIndex"])] = f
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    companies = {}
    idx_file = DATA / "companies.json"
    if idx_file.exists():
        companies = {c["code"]: c for c in json.loads(idx_file.read_text(encoding="utf-8"))["companies"]}

    ipos: dict[str, dict] = {}
    # Eskiden yeniye: düzeltme / güncelleme bildirimleri öncekinin üzerine yazar
    for idx in sorted(cache, key=int):
        f = cache[idx]
        codes = [c.strip() for c in f.get("codes", "").split(",") if c.strip()]
        expl = f.get("ExplanationTextBlock", "")
        # Sonuç bildiriminde ilk kodlar aracı kurumun olabilir; işlem kodu açıklamada ya da son sırada
        code = next((c for c in codes if c in companies), None) or (codes[-1] if codes else None)
        m = re.search(r"\b([A-Z0-9]{4,6})\.HE\b", expl)
        if m:
            code = m[1]
        if not code:
            continue
        d = ipos.setdefault(code, {"code": code})
        start, end = sale_dates(expl)
        if f["subject"] == "offer":
            d.update({
                "name": f.get("TitleOfRelatedCompanyPublicOffer") or d.get("name"),
                "price": tr_number(f.get("PublicOfferPrice")) or d.get("price"),
                "nominal": tr_number(f.get("NominalValue")),
                "ratio": tr_number(f.get("ProportionOfSharesToBeOfferedPercentage")),
                "broker": f.get("IntermediaryBrokerageHouse"),
                "market": f.get("MarketToTrade"),
                "method": f.get("PublicOfferType"),
                "offerId": int(idx),
            })
        else:
            d.update({
                "name": d.get("name") or (f.get("IssuerName") or "").title(),
                "price": d.get("price") or tr_number(f.get("IpoPrice")),
                "shares": tr_number(f.get("NumberOfSharesOffered")),
                "size": tr_number(f.get("IpoSize")),
                "investors": tr_number(f.get("TotalNumberOfInvestors")),
                "resultId": int(idx),
            })
        if start and (f["subject"] == "offer" or not d.get("start")):
            d["start"], d["end"] = start, end
        if not d.get("start") and f.get("published"):  # tarih okunamadı: sonuç bildirimi satıştan hemen sonra gelir
            dd, mm, yy = f["published"][:10].split(".")
            d["start"] = d["end"] = f"{yy}-{mm}-{dd}"

    out = []
    for d in ipos.values():
        if not d.get("name"):
            continue
        c = companies.get(d["code"])
        # "İ".title() birleşik nokta (U+0307) bırakıyor
        d["name"] = d["name"].replace("̇", "")
        cur = c["metrics"]["price"] if c else None
        d["current"] = cur
        d["return"] = None
        # Getiri yalnızca ilk işlem günü fiyatı halka arz fiyatıyla tutarlıysa: arada bedelsiz / bölünme
        # olduysa geçmiş fiyatlar düzeltilmiştir ve "güncel / halka arz fiyatı" yanıltıcı olur
        detail = DATA / "companies" / f"{d['code']}.json"
        if cur and d.get("price") and d.get("end") and detail.exists():
            prices = json.loads(detail.read_text(encoding="utf-8")).get("prices", [])
            after = [p["c"] for p in prices if p["d"] > d["end"]]
            jump = any(not 0.8 <= b / a <= 1.25 for a, b in zip(after, after[1:]) if a)
            if after and not jump and 0.85 <= after[0] / d["price"] <= 1.25:
                d["return"] = round(cur / d["price"] - 1, 4)
        out.append(d)
    out.sort(key=lambda d: d.get("start") or "", reverse=True)
    OUT.write_text(json.dumps({"updatedAt": datetime.now().isoformat(timespec="seconds"), "items": out},
                              ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(out)} halka arz yazıldı ({len(new)} yeni bildirim açıldı)", flush=True)


if __name__ == "__main__":
    main()
