"""Seans içi fiyat güncellemesi: tüm hisselerin son fiyatını Yahoo'dan tek toplu istekle
çekip Supabase'teki `prices` tablosuna yazar. GitHub Actions'ta 15 dakikada bir çalışır
(.github/workflows/fiyat.yml). Yahoo fiyatları ~15 dakika gecikmelidir.

Kullanım:
    python scripts/update_prices.py            # Supabase'e yazar (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    python scripts/update_prices.py --dry-run  # yalnızca ekrana yazar
"""
import json
import math
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests
import yfinance as yf

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def tickers():
    index = DATA / "companies.json"
    if index.exists():
        return [c["code"] for c in json.loads(index.read_text(encoding="utf-8"))["companies"]]
    return json.loads((DATA / "tickers.json").read_text(encoding="utf-8"))


def num(v):
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(f) or math.isinf(f) else f


def fetch_quotes(codes):
    df = yf.download(
        [f"{c}.IS" for c in codes],
        period="5d",
        interval="1d",
        group_by="ticker",
        auto_adjust=False,
        threads=True,
        progress=False,
    )
    now = datetime.now(timezone.utc).isoformat()
    rows = []
    for code in codes:
        sym = f"{code}.IS"
        if sym not in df.columns.get_level_values(0):
            continue
        closes = df[sym]["Close"].dropna()
        if closes.empty:
            continue
        price = num(closes.iloc[-1])
        prev = num(closes.iloc[-2]) if len(closes) > 1 else None
        if price is None:
            continue
        vol = num(df[sym]["Volume"].dropna().iloc[-1]) if not df[sym]["Volume"].dropna().empty else None
        rows.append({
            "code": code,
            "price": round(price, 4),
            "prev_close": round(prev, 4) if prev else None,
            "change": round((price - prev) / prev, 6) if prev else None,
            "volume": int(vol) if vol is not None else None,
            "updated_at": now,
        })
    return rows


def upsert(rows):
    url = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/") + "/rest/v1/prices"
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    for i in range(0, len(rows), 500):
        r = requests.post(url, headers=headers, data=json.dumps(rows[i:i + 500]), timeout=60)
        if r.status_code >= 300:
            raise RuntimeError(f"Supabase {r.status_code}: {r.text[:300]}")


def main():
    codes = tickers()
    rows = fetch_quotes(codes)
    print(f"{len(rows)}/{len(codes)} hissenin fiyatı alındı")
    if not rows:
        sys.exit(1)
    if "--dry-run" in sys.argv:
        for r in rows[:5]:
            print(r)
        return
    upsert(rows)
    print("Supabase'e yazıldı")


if __name__ == "__main__":
    main()
