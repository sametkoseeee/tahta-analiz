"""Borsa İstanbul endeksleri: son değer, günlük ve dönemsel getiriler.

Yahoo Finance tüm endekslerin güncel değerini ve son 5 günü verir; uzun geçmiş yalnızca birkaç ana endekste
(BIST 100, BIST 30, Banka, Sınai) var. Diğerlerinin dönemsel getirileri, her akşam kaydedilen kapanışlardan
(data/index_history.json) hesaplanır ve zamanla dolar.

Çıktı: data/indices.json
  python scripts/fetch_indices.py
"""

import json
from datetime import date, datetime, timedelta
from pathlib import Path

import pandas as pd
import yfinance as yf

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = DATA / "indices.json"
HISTORY = DATA / "index_history.json"

NAMES = {
    "XU100": "BIST 100", "XU030": "BIST 30", "XU050": "BIST 50", "XUTUM": "BIST Tüm", "XU500": "BIST 500",
    "XTUMY": "BIST Tüm-100", "XYUZO": "BIST 100-30", "X10XB": "BIST Banka Dışı Likit 10", "XYLDZ": "BIST Yıldız",
    "XHARZ": "BIST Halka Arz", "XUGRA": "BIST Geri Alım", "XTM25": "BIST Temettü 25", "XTMTU": "BIST Temettü",
    "XSD25": "BIST Sürdürülebilirlik 25", "XK030": "BIST Katılım 30", "XK050": "BIST Katılım 50",
    "XK100": "BIST Katılım 100", "XKTUM": "BIST Katılım Tüm", "XKTMT": "BIST Katılım Temettü",
    "XUMAL": "BIST Mali", "XBANK": "BIST Banka", "XLBNK": "BIST Likit Banka", "XAKUR": "BIST Aracı Kurumlar",
    "XFINK": "BIST Finansal Kiralama Faktoring", "XGMYO": "BIST Gayrimenkul Y.O.", "XHOLD": "BIST Holding ve Yatırım",
    "XSGRT": "BIST Sigorta", "XYORT": "BIST Menkul Kıymet Y.O.", "XUSIN": "BIST Sınai", "XGIDA": "BIST Gıda İçecek",
    "XKMYA": "BIST Kimya Petrol Plastik", "XMADN": "BIST Madencilik", "XMANA": "BIST Metal Ana",
    "XMESY": "BIST Metal Eşya Makina", "XKAGT": "BIST Orman Kağıt Basım", "XTAST": "BIST Taş Toprak",
    "XTEKS": "BIST Tekstil Deri", "XUHIZ": "BIST Hizmetler", "XELKT": "BIST Elektrik", "XILTM": "BIST İletişim",
    "XINSA": "BIST İnşaat", "XSPOR": "BIST Spor", "XTCRT": "BIST Ticaret", "XTRZM": "BIST Turizm",
    "XULAS": "BIST Ulaştırma", "XUTEK": "BIST Teknoloji", "XBLSM": "BIST Bilişim",
}
GROUPS = {
    "Ana": ["XU100", "XU030", "XU050", "XUTUM", "XU500", "XTUMY", "XYUZO", "X10XB", "XYLDZ", "XHARZ", "XUGRA",
            "XTM25", "XTMTU", "XSD25"],
    "Katılım": ["XK030", "XK050", "XK100", "XKTUM", "XKTMT"],
}
# Dönem adı -> geriye gün sayısı (YTD ayrıca)
PERIODS = {"w1": 7, "m1": 30, "m3": 91, "m6": 182, "y1": 365, "y3": 365 * 3, "y5": 365 * 5}


def closes(df: pd.DataFrame, code: str) -> pd.Series:
    try:
        s = df[code + ".IS"]["Close"].dropna()
    except KeyError:
        return pd.Series(dtype=float)
    s.index = [d.date().isoformat() for d in s.index]
    return s


def main() -> None:
    history: dict[str, dict[str, float]] = json.loads(HISTORY.read_text(encoding="utf-8")) if HISTORY.exists() else {}
    tickers = [c + ".IS" for c in NAMES]
    short = yf.download(tickers, period="5d", interval="1d", group_by="ticker", progress=False, threads=True)
    long_ = yf.download(tickers, period="6y", interval="1d", group_by="ticker", progress=False, threads=True)

    rows = []
    for code, name in NAMES.items():
        h = history.setdefault(code, {})
        for s in (closes(long_, code), closes(short, code)):
            h.update({d: round(float(v), 4) for d, v in s.items()})
        if not h:
            continue
        days = sorted(h)
        last_day, price = days[-1], h[days[-1]]
        prev = h[days[-2]] if len(days) > 1 else None
        if prev is None:  # geçmişi olmayan endeksler: önceki kapanış Yahoo'nun özet bilgisinden
            try:
                prev = float(yf.Ticker(code + ".IS").fast_info["previousClose"]) or None
            except Exception:  # noqa: BLE001
                prev = None

        def back(target: str) -> float | None:
            """target gününde ya da öncesindeki son kapanış; geçmiş yetmiyorsa None"""
            older = [d for d in days if d <= target]
            return h[older[-1]] if older and older[-1] != last_day else None

        last = date.fromisoformat(last_day)
        ret = {}
        for key, n in PERIODS.items():
            base = back((last - timedelta(days=n)).isoformat())
            # Geçmişin başlangıcı hedeften çok sonraysa (kayıt yeni başladıysa) getiri gösterilmez
            ret[key] = round(price / base - 1, 6) if base and days[0] <= (last - timedelta(days=n)).isoformat() else None
        ytd_base = back(f"{last.year - 1}-12-31")
        ret["ytd"] = round(price / ytd_base - 1, 6) if ytd_base and days[0] <= f"{last.year - 1}-12-31" else None
        group = next((g for g, codes in GROUPS.items() if code in codes), "Sektör")
        rows.append({"code": code, "name": name, "group": group, "date": last_day, "price": price,
                     "change": round(price / prev - 1, 6) if prev else None, "ret": ret})

    HISTORY.write_text(json.dumps(history, separators=(",", ":")), encoding="utf-8")
    OUT.write_text(json.dumps({"updatedAt": datetime.now().isoformat(timespec="minutes"), "rows": rows},
                              ensure_ascii=False), encoding="utf-8")
    print(f"{len(rows)} endeks yazıldı")


if __name__ == "__main__":
    main()
