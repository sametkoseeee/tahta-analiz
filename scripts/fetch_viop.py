"""VİOP yaklaşık teminat ve kaldıraç tablosu.

- Teminat oranları (PSR, Fiyat Değişim Aralığı): Takasbank "BISTECH Risk Parametreleri"
  sayfasındaki güncel parametre tablosu (herkese açık Excel).
- Kontrat büyüklükleri: Borsa İstanbul VİOP sözleşme özellikleri.
- Fiyat: VİOP vade fiyatı Borsa İstanbul'un lisanslı verisi olduğu için kullanılmaz;
  dayanak varlığın spot fiyatı alınır (hisseler data/companies.json, diğerleri Yahoo).
  Teminat ≈ spot × kontrat büyüklüğü × PSR, kaldıraç ≈ 1 / PSR.

Çıktı: data/viop.json
  python scripts/fetch_viop.py
"""

import io
import json
import re
import sys
from datetime import datetime
from pathlib import Path

import openpyxl
import requests
import yfinance as yf

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = DATA / "viop.json"

PAGE = "https://www.takasbank.com.tr/tr/kaynaklar/bistech-risk-parametreleri"
# Takasbank'ın güvenlik duvarı kimliği belirsiz istemcileri reddediyor; kendimizi açıkça tanıtıyoruz
HEADERS = {"User-Agent": "TahtaAnaliz/1.0 (+https://tahtaanaliz.com; info@tahtaanaliz.com)", "Accept-Language": "tr"}

# Pay dışı sözleşmeler: (ad, tür, Yahoo sembolü, kontrat büyüklüğü, birim, fiyat para birimi)
OTHER = {
    "XU030": ("BIST 30 Endeksi", "Endeks", "XU030.IS", 0.1, "Endeks/1000 × 100", "TRY"),
    "USDTRY": ("Dolar/TL", "Döviz", "TRY=X", 1000, "1.000 USD", "TRY"),
    "EURTRY": ("Euro/TL", "Döviz", "EURTRY=X", 1000, "1.000 EUR", "TRY"),
    "EURUSD": ("Euro/Dolar", "Döviz", "EURUSD=X", 1000, "1.000 EUR", "USD"),
    "XAUUSD": ("Ons Altın", "Emtia", "GC=F", 1, "1 ons", "USD"),
    "XAUTRY": ("Gram Altın", "Emtia", None, 1, "1 gram", "TRY"),
}
TROY_OUNCE_G = 31.1034768


def param_table() -> tuple[str, dict[str, float]]:
    """Takasbank güncel parametre tablosundaki vadeli/opsiyon PSR değerleri (%)."""
    html = requests.get(PAGE, headers=HEADERS, timeout=60).text
    links = re.findall(r'href="([^"]*parametre_tablosu_[^"]+\.xlsx)"', html)
    if not links:
        raise RuntimeError("Takasbank parametre tablosu bağlantısı bulunamadı")
    url = links[-1] if links[-1].startswith("http") else "https://www.takasbank.com.tr" + links[-1]
    wb = openpyxl.load_workbook(io.BytesIO(requests.get(url, headers=HEADERS, timeout=60).content),
                                read_only=True, data_only=True)
    rows = [[c for c in r if c is not None] for r in wb.worksheets[0].iter_rows(values_only=True)]
    psr: dict[str, float] = {}
    on = False
    for r in rows:
        text = " ".join(str(c) for c in r)
        if "EK-4" in text:  # Vadeli İşlem ve Opsiyon Piyasası tablosu
            on = True
        if on and text.startswith("2)"):  # PSR bölümü bitti
            break
        if on and len(r) == 2 and isinstance(r[0], str) and isinstance(r[1], (int, float)):
            psr[r[0].strip()] = float(r[1])
    if len(psr) < 20:
        raise RuntimeError(f"PSR tablosu beklenenden kısa ({len(psr)})")
    return url, psr


def last_prices(symbols: list[str]) -> dict[str, float]:
    df = yf.download(symbols, period="5d", interval="1d", progress=False, auto_adjust=False, group_by="ticker")
    out = {}
    for s in symbols:
        try:
            closes = df[s]["Close"].dropna()
            if len(closes):
                out[s] = float(closes.iloc[-1])
        except KeyError:
            pass
    return out


def main() -> None:
    url, psr = param_table()
    print(f"Takasbank: {len(psr)} sözleşme PSR ({url.rsplit('/', 1)[-1]})")
    companies = {c["code"]: c for c in json.loads((DATA / "companies.json").read_text(encoding="utf-8"))["companies"]}
    yahoo = last_prices([v[2] for v in OTHER.values() if v[2]])
    usdtry = yahoo.get("TRY=X")
    if "GC=F" in yahoo and usdtry:
        yahoo["XAUTRY"] = yahoo["GC=F"] / TROY_OUNCE_G * usdtry

    rows = []
    for code, rate in sorted(psr.items()):
        if code in companies:
            c = companies[code]
            spot, name, kind, size, unit, ccy = c["metrics"]["price"], c["name"], "Pay", 100, "100 pay", "TRY"
        elif code in OTHER:
            name, kind, sym, size, unit, ccy = OTHER[code]
            spot = yahoo.get(sym or code)
        else:
            continue  # spot fiyatı olmayan sözleşmeler (elektrik, TLREF, tahvil, bazı emtialar)
        if not spot:
            print(f"  {code}: spot fiyat yok, atlandı", file=sys.stderr)
            continue
        fx = usdtry if ccy == "USD" else 1
        contract_value = spot * size * (fx or 0)
        rows.append({
            "code": code, "name": name, "kind": kind, "spot": round(spot, 4), "currency": ccy,
            "size": size, "unit": unit, "psr": rate,
            "contractValue": round(contract_value, 2),
            "margin": round(contract_value * rate / 100, 2),
            "leverage": round(100 / rate, 2),
        })
    OUT.write_text(json.dumps({"updatedAt": datetime.now().isoformat(timespec="minutes"),
                               "source": url, "usdtry": usdtry, "rows": rows}, ensure_ascii=False), encoding="utf-8")
    print(f"{len(rows)} sözleşme yazıldı")


if __name__ == "__main__":
    main()
