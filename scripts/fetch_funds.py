"""TEFAS yatırım fonları: getiriler, büyüklük, yatırımcı sayısı ve 5 yıllık fiyat geçmişi.

Kaynak: https://www.tefas.gov.tr (Takasbank). Yalnızca TEFAS'ta işlem gören menkul kıymet
yatırım fonları alınır (nitelikli yatırımcıya özel, TEFAS dışı fonlar hariç).

Çıktı:
  data/funds.json          liste (fon başına özet + son 3 ayın fiyatlarından küçük grafik)
  data/funds/<KOD>.json    fon sayfası için ayrıntı ve fiyat geçmişi

  python scripts/fetch_funds.py
"""

import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT_DIR = DATA / "funds"

API = "https://www.tefas.gov.tr/api/funds/"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36",
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Origin": "https://www.tefas.gov.tr",
    "Referer": "https://www.tefas.gov.tr/tr/fon-getirileri",
}
WORKERS = 4
RETRIES = 4
HISTORY_MONTHS = 60  # TEFAS en fazla 5 yıl veriyor
SPARK_POINTS = 63

BASE = {"fonTipi": "YAT", "dil": "TR", "kurucuKod": None, "sfonTurKod": None, "fonTurAciklama": None,
        "islem": None, "fonTurKod": None, "fonGrubu": None}
PERIODS = {k: "1" for k in ["donemGetiri1a", "donemGetiri3a", "donemGetiri6a", "donemGetiri1y",
                            "donemGetiriyb", "donemGetiri3y", "donemGetiri5y"]}

session = requests.Session()
session.headers.update(HEADERS)


def post(path: str, body: dict) -> list:
    for attempt in range(RETRIES):
        try:
            r = session.post(API + path, json=body, timeout=60)
            r.raise_for_status()
            j = r.json()
            if j.get("errorMessage"):
                raise RuntimeError(j["errorMessage"])
            return j.get("resultList") or []
        except Exception as e:  # noqa: BLE001
            if attempt == RETRIES - 1:
                raise
            time.sleep(5 * (attempt + 1))
    return []


def pct(v):
    """TEFAS yüzde veriyor (3.04 = %3,04); site oranla çalışıyor (0.0304)."""
    return None if v is None else round(v / 100, 6)


def ymd(d: date) -> str:
    return d.strftime("%Y%m%d")


def fetch_history(code: str) -> tuple[str, list, dict | None]:
    try:
        rows = post("fonFiyatBilgiGetir", {"fonKodu": code, "dil": "TR", "periyod": HISTORY_MONTHS})
        prices = [{"d": r["tarih"][:10], "c": r["fiyat"]} for r in rows if r.get("fiyat")]
        info = post("fonBilgiGetir", {"fonKodu": code, "dil": "TR"})
        return code, prices, (info[0] if info else None)
    except Exception as e:  # noqa: BLE001
        print(f"  {code}: {e}", file=sys.stderr)
        return code, [], None


def fetch_allocations(today: date) -> tuple[str | None, dict[str, dict[str, float]]]:
    """Tüm fonların portföy (varlık) dağılımı tek istekte: TEFAS "Fon Verileri > Portföy Dağılımı".
    Tatil/hafta sonu için son 7 güne kadar geri gidilir. Yalnızca sıfırdan büyük oranlar tutulur."""
    for back in range(8):
        day = today - timedelta(days=back)
        body = {"fonTipi": "YAT", "fonKodu": None, "aramaMetni": None, "fonTurKod": None, "fonGrubu": None,
                "sfonTurKod": None, "basTarih": ymd(day), "bitTarih": ymd(day), "basSira": 1, "bitSira": 5000,
                "fonTurAciklama": None, "dil": "TR", "kurucuKod": None, "sFonTurKod": "", "fonKod": "",
                "fonGrup": "", "fonUnvanTip": ""}
        try:
            rows = post("dagilimSiraliGetirT", body)
        except Exception:  # noqa: BLE001  (o gün veri yok: "Index 0 out of bounds")
            rows = []
        if rows:
            skip = {"fonKodu", "fonUnvan", "tarih", "bilFiyat"}
            alloc = {r["fonKodu"]: {k: round(v, 2) for k, v in r.items()
                                    if k not in skip and isinstance(v, (int, float)) and v > 0}
                     for r in rows}
            return day.isoformat(), alloc
    return None, {}


def change_since(prices: list, days: int):
    if len(prices) < 2:
        return None
    cutoff = (datetime.fromisoformat(prices[-1]["d"]) - timedelta(days=days)).date().isoformat()
    past = next((p for p in reversed(prices) if p["d"] <= cutoff), None)
    return None if not past else round(prices[-1]["c"] / past["c"] - 1, 6)


def main() -> None:
    print("TEFAS: fon getirileri")
    returns = post("fonGetiriBazliBilgiGetir",
                   {**BASE, **PERIODS, "basTarih": None, "bitTarih": None, "calismaTipi": 2, "getiriOrani": "1"})
    returns = [r for r in returns if r.get("tefasDurum")]
    print(f"  {len(returns)} TEFAS fonu")

    today = date.today()
    sizes = {r["fonKodu"]: r for r in post("fonBuyuklukBazliBilgiGetir",
                                            {**BASE, "basTarih": ymd(today - timedelta(days=30)), "bitTarih": ymd(today),
                                             "calismaTipi": 2})}
    founders = {f.get("kurucuKod") or f.get("kurucuKodu"): f.get("kurucuUnvan") or f.get("unvan")
                for f in post("fonKurucuGetir", {"fonTipi": "YAT", "dil": "TR"})}

    print("TEFAS: portföy dağılımları")
    alloc_date, allocations = fetch_allocations(today)
    print(f"  {len(allocations)} fon ({alloc_date})")

    print("TEFAS: fiyat geçmişleri")
    codes = [r["fonKodu"] for r in returns]
    history: dict[str, tuple[list, dict | None]] = {}
    with ThreadPoolExecutor(WORKERS) as ex:
        for i, (code, prices, info) in enumerate(ex.map(fetch_history, codes), 1):
            history[code] = (prices, info)
            if i % 100 == 0:
                print(f"  {i}/{len(codes)}", flush=True)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    funds = []
    for r in returns:
        code = r["fonKodu"]
        prices, info = history.get(code, ([], None))
        old = OUT_DIR / f"{code}.json"
        if not prices and old.exists():  # çekilemediyse önceki gün kalsın
            funds_old = json.loads(old.read_text(encoding="utf-8"))
            prices = funds_old.get("prices", [])
        size = sizes.get(code, {})
        last = prices[-1]["c"] if prices else (info or {}).get("sonFiyat")
        summary = {
            "code": code,
            "name": r["fonUnvan"],
            "umbrella": r.get("fonTurAciklama"),
            "category": size.get("fonTurAciklama") or (info or {}).get("fonKategori"),
            "founder": founders.get(size.get("kurucuKodu")) or size.get("kurucuKodu"),
            "risk": int(r["riskDegeri"]) if str(r.get("riskDegeri") or "").isdigit() else None,
            "price": last,
            "priceDate": prices[-1]["d"] if prices else None,
            "change": pct((info or {}).get("gunlukGetiri")),
            "r1m": pct(r.get("getiri1a")),
            "r3m": pct(r.get("getiri3a")),
            "r6m": pct(r.get("getiri6a")),
            "rytd": pct(r.get("getiriyb")),
            "r1y": pct(r.get("getiri1y")),
            "r3y": pct(r.get("getiri3y")),
            "r5y": pct(r.get("getiri5y")),
            "size": size.get("sonPortfoyDegeri") or (info or {}).get("portBuyukluk"),
            "sizeChange1m": pct(size.get("portBuyuklukDegisim")),
            "investors": (info or {}).get("yatirimciSayi"),
            "marketShare": pct((info or {}).get("pazarPayi")),
            "categoryRank": (info or {}).get("kategoriDerece"),
            "categoryCount": (info or {}).get("kategoriFonSay"),
            "spark": [p["c"] for p in prices[-SPARK_POINTS:]],
        }
        if summary["change"] is None:
            summary["change"] = change_since(prices, 1)
        funds.append(summary)
        detail = {k: v for k, v in summary.items() if k != "spark"}
        detail["prices"] = prices
        if allocations.get(code):
            detail["alloc"] = allocations[code]
            detail["allocDate"] = alloc_date
        elif old.exists():  # dağılım çekilemediyse önceki kalsın
            prev = json.loads(old.read_text(encoding="utf-8"))
            if prev.get("alloc"):
                detail["alloc"], detail["allocDate"] = prev["alloc"], prev.get("allocDate")
        old.write_text(json.dumps(detail, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    funds.sort(key=lambda f: f["size"] or 0, reverse=True)
    (DATA / "funds.json").write_text(
        json.dumps({"updatedAt": datetime.now().isoformat(timespec="minutes"), "funds": funds},
                   ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    missing = sum(1 for f in funds if not f["price"])
    print(f"{len(funds)} fon yazıldı (fiyatı olmayan: {missing})")


if __name__ == "__main__":
    main()
