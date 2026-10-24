"""BIST şirketlerinin mali tablolarını, fiyatlarını ve oranlarını Yahoo Finance'ten çekip
data/ klasörüne JSON olarak yazar.

Kullanım:
    python scripts/fetch_data.py                # data/tickers.json'daki tüm hisseler
    python scripts/fetch_data.py --refresh-list # önce hisse listesini Yahoo'dan yenile
    python scripts/fetch_data.py SASA THYAO     # sadece verilen kodlar
    python scripts/fetch_data.py --indices-only # sadece KAP endeks/sektör bilgisini güncelle
"""
import json
import math
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd
import yfinance as yf
from yfinance import EquityQuery

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
COMPANIES_DIR = DATA / "companies"
TICKERS_PATH = DATA / "tickers.json"

WORKERS = 3
RETRIES = 4

# İş Bankası kurucu/imtiyazlı pay grupları: fiyatları ISCTR'den çok farklı, piyasa değeri anlamsız çıkıyor
EXCLUDE = {"ISATR", "ISBTR", "ISKUR"}


INDICES_PATH = DATA / "indices.json"

# KAP'taki endeks kodlarının adları. Sektör endeksleri öncelik sırasıyla (en özelden genele):
# bir şirket birden çok sektör endeksindeyse ilk eşleşen onun sektörü olur.
MAIN_INDICES = {
    "XU030": "BIST 30",
    "XU050": "BIST 50",
    "XU100": "BIST 100",
    "XUTUM": "BIST Tüm",
    "XK030": "Katılım 30",
    "XK100": "Katılım 100",
    "XKTUM": "Katılım Tüm",
    "XTM25": "Temettü 25",
    "XYLDZ": "Yıldız Pazar",
    "XHARZ": "Halka Arz",
    "XUSRD": "Sürdürülebilirlik",
}

SECTOR_INDICES = {
    "XBANK": "Bankacılık",
    "XSGRT": "Sigorta",
    "XFINK": "Finansal Kiralama ve Faktoring",
    "XAKUR": "Aracı Kurumlar",
    "XGMYO": "Gayrimenkul Yatırım Ortaklıkları",
    "XGSYO": "Girişim Sermayesi Yatırım Ortaklıkları",
    "XYORT": "Menkul Kıymet Yatırım Ortaklıkları",
    "XHOLD": "Holding ve Yatırım",
    "XELKT": "Elektrik",
    "XILTM": "İletişim",
    "XSPOR": "Spor",
    "XTRZM": "Turizm",
    "XULAS": "Ulaştırma",
    "XINSA": "İnşaat",
    "XTCRT": "Ticaret",
    "XBLSM": "Bilişim",
    "XUTEK": "Teknoloji",
    "XMADN": "Madencilik",
    "XGIDA": "Gıda, İçecek",
    "XKMYA": "Kimya, Petrol, Plastik",
    "XMANA": "Metal Ana",
    "XMESY": "Metal Eşya, Makine",
    "XKAGT": "Orman, Kağıt, Basım",
    "XTAST": "Taş, Toprak",
    "XTEKS": "Tekstil, Deri",
    "XUSIN": "Sınai",
    "XUMAL": "Mali",
    "XUHIZ": "Hizmetler",
}


def fetch_indices():
    """Resmi endeks bileşenlerini KAP'ın Endeksler sayfasından okur (sayfa veriyi gömülü JSON olarak taşıyor)."""
    import re

    import requests

    r = requests.get("https://kap.org.tr/tr/Endeksler", headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
    r.raise_for_status()
    body = r.text.replace('\\"', '"')
    body = body[body.find('"initialData":'):]
    members = {}
    for part in re.split(r'\{"code":"', body)[1:]:
        code = part.split('"', 1)[0].strip()
        stocks = re.findall(r'"stockCode":"([A-Z0-9]+)"', part)
        if stocks and code not in members:  # sayfada aynı liste iki kez geçiyor
            members[code] = stocks
    if "XU100" not in members or len(members["XU100"]) != 100:
        raise RuntimeError("KAP endeks sayfasının yapısı değişmiş olabilir: XU100 bulunamadı")
    out = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "indices": [
            {"code": c, "name": n, "kind": "main" if c in MAIN_INDICES else "sector", "members": members.get(c, [])}
            for c, n in {**MAIN_INDICES, **SECTOR_INDICES}.items()
        ],
    }
    INDICES_PATH.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"{len(out['indices'])} endeks → {INDICES_PATH}")
    return out


def enrich(index):
    """Şirketlere endeks üyeliklerini ve BIST sektörünü ekler (Yahoo sektörü yedek olarak kalır)."""
    try:
        data = fetch_indices()
    except Exception as e:  # noqa: BLE001
        print(f"KAP endeksleri alınamadı, eski dosya kullanılıyor: {e}")
        if not INDICES_PATH.exists():
            return
        data = json.loads(INDICES_PATH.read_text(encoding="utf-8"))

    by_code = {}
    for ix in data["indices"]:
        for s in ix["members"]:
            by_code.setdefault(s, []).append(ix["code"])

    for code, c in index.items():
        codes = by_code.get(code, [])
        c["indices"] = [i for i in MAIN_INDICES if i in codes]
        sector = next((SECTOR_INDICES[i] for i in SECTOR_INDICES if i in codes), None)
        if sector:
            c["sector"] = sector
        path = COMPANIES_DIR / f"{code}.json"
        if path.exists():
            d = json.loads(path.read_text(encoding="utf-8"))
            if d.get("sector") != c["sector"] or d.get("indices") != c["indices"]:
                d["sector"], d["indices"] = c["sector"], c["indices"]
                path.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")


def refresh_tickers():
    """Borsa İstanbul'daki tüm hisseleri Yahoo tarayıcısından alıp data/tickers.json'a yazar."""
    q = EquityQuery("eq", ["exchange", "IST"])
    codes, offset = [], 0
    while True:
        r = yf.screen(q, offset=offset, size=250, sortField="intradaymarketcap", sortAsc=False)
        quotes = r.get("quotes", [])
        if not quotes:
            break
        codes += [x["symbol"].removesuffix(".IS") for x in quotes if x.get("quoteType") == "EQUITY"]
        offset += len(quotes)
        if offset >= r.get("total", 0):
            break
    # Yahoo'nun tarayıcısında eksik kalan hisseleri KAP'taki BIST Tüm listesinden tamamla
    try:
        xutum = next(i for i in fetch_indices()["indices"] if i["code"] == "XUTUM")["members"]
        codes += xutum
    except Exception as e:  # noqa: BLE001
        print(f"KAP listesi alınamadı, yalnızca Yahoo listesi kullanılıyor: {e}")
    codes = sorted(set(codes) - EXCLUDE)
    TICKERS_PATH.write_text(json.dumps(codes), encoding="utf-8")
    print(f"{len(codes)} hisse kodu → {TICKERS_PATH}")
    return codes

SECTORS = {
    "Financial Services": "Mali Kuruluşlar",
    "Industrials": "Sanayi",
    "Basic Materials": "Temel Malzemeler",
    "Consumer Cyclical": "Tüketici (Döngüsel)",
    "Consumer Defensive": "Tüketici (Temel)",
    "Energy": "Enerji",
    "Utilities": "Elektrik ve Altyapı",
    "Communication Services": "İletişim",
    "Technology": "Teknoloji",
    "Real Estate": "Gayrimenkul",
    "Healthcare": "Sağlık",
}

# (Türkçe etiket, Yahoo satır adı veya alternatifler)
BALANCE_ROWS = [
    ("Dönen Varlıklar", ["Current Assets"]),
    ("Nakit ve Nakit Benzerleri", ["Cash And Cash Equivalents", "Cash Cash Equivalents And Short Term Investments"]),
    ("Ticari Alacaklar", ["Accounts Receivable", "Receivables"]),
    ("Stoklar", ["Inventory"]),
    ("Duran Varlıklar", ["Total Non Current Assets"]),
    ("Maddi Duran Varlıklar", ["Net PPE"]),
    ("Toplam Varlıklar", ["Total Assets"]),
    ("Kısa Vadeli Yükümlülükler", ["Current Liabilities"]),
    ("Uzun Vadeli Yükümlülükler", ["Total Non Current Liabilities Net Minority Interest"]),
    ("Toplam Yükümlülükler", ["Total Liabilities Net Minority Interest"]),
    ("Finansal Borçlar", ["Total Debt"]),
    ("Net Borç", ["Net Debt"]),
    ("Ana Ortaklık Özkaynakları", ["Stockholders Equity", "Common Stock Equity"]),
    ("Azınlık Payları", ["Minority Interest"]),
    ("Toplam Özkaynaklar", ["Total Equity Gross Minority Interest"]),
    ("Hisse Adedi", ["Share Issued", "Ordinary Shares Number"]),
]

INCOME_ROWS = [
    ("Hasılat", ["Total Revenue", "Operating Revenue"]),
    ("Satışların Maliyeti", ["Cost Of Revenue"]),
    ("Brüt Kâr", ["Gross Profit"]),
    ("Faaliyet Giderleri", ["Operating Expense"]),
    ("Esas Faaliyet Kârı", ["Operating Income", "Total Operating Income As Reported"]),
    ("FAVÖK", ["EBITDA", "Normalized EBITDA"]),
    ("Net Finansman Gideri", ["Net Non Operating Interest Income Expense"]),
    ("Vergi Öncesi Kâr", ["Pretax Income"]),
    ("Vergi Gideri", ["Tax Provision"]),
    ("Dönem Net Kârı", ["Net Income Including Noncontrolling Interests", "Net Income Continuous Operations"]),
    ("Ana Ortaklık Net Kârı", ["Net Income Common Stockholders", "Net Income"]),
    ("Hisse Başına Kâr", ["Basic EPS"]),
]

CASHFLOW_ROWS = [
    ("İşletme Faaliyetlerinden Nakit", ["Operating Cash Flow", "Cash Flow From Continuing Operating Activities"]),
    ("Yatırım Faaliyetlerinden Nakit", ["Investing Cash Flow", "Cash Flow From Continuing Investing Activities"]),
    ("Finansman Faaliyetlerinden Nakit", ["Financing Cash Flow", "Cash Flow From Continuing Financing Activities"]),
    ("Yatırım Harcamaları", ["Capital Expenditure"]),
    ("Serbest Nakit Akışı", ["Free Cash Flow"]),
    ("Ödenen Temettü", ["Cash Dividends Paid", "Common Stock Dividend Paid"]),
    ("Dönem Sonu Nakit", ["End Cash Position"]),
]


def clean(v):
    if v is None:
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    if math.isnan(f) or math.isinf(f):
        return None
    return f


def statement(df: pd.DataFrame, rows, max_periods: int):
    """Yahoo tablosunu {periods: [...], rows: [{label, values}]} biçimine çevirir (eskiden yeniye)."""
    if df is None or df.empty:
        return {"periods": [], "rows": []}
    # Yahoo bazen tamamen boş bir dönem sütunu döndürür; onları at
    cols = [c for c in sorted(df.columns) if df[c].notna().any()][-max_periods:]
    periods = [pd.Timestamp(c).strftime("%Y-%m") for c in cols]
    out = []
    for label, keys in rows:
        key = next((k for k in keys if k in df.index), None)
        if key is None:
            continue
        values = [clean(df.at[key, c]) for c in cols]
        if all(v is None for v in values):
            continue
        out.append({"label": label, "values": values})

    # Yahoo'nun "Net Debt" kalemi kiralama borçlarını dışarıda bırakıyor; finansal borç − nakit olarak hesapla
    labels = [r["label"] for r in out]
    if "Finansal Borçlar" in labels and "Nakit ve Nakit Benzerleri" in labels:
        debt = out[labels.index("Finansal Borçlar")]["values"]
        cash = out[labels.index("Nakit ve Nakit Benzerleri")]["values"]
        net = [d - c if d is not None and c is not None else None for d, c in zip(debt, cash)]
        if "Net Borç" in labels:
            out[labels.index("Net Borç")]["values"] = net
        else:
            out.insert(labels.index("Finansal Borçlar") + 1, {"label": "Net Borç", "values": net})
    return {"periods": periods, "rows": out}


def row(stmt, label):
    for r in stmt["rows"]:
        if r["label"] == label:
            return r["values"]
    return None


def last(values):
    if not values:
        return None
    for v in reversed(values):
        if v is not None:
            return v
    return None


def ttm(values):
    """Son 4 çeyreğin toplamı (hepsi varsa)."""
    if not values or len(values) < 4:
        return None
    tail = values[-4:]
    if any(v is None for v in tail):
        return None
    return sum(tail)


def ratio(a, b):
    if a is None or b is None or b == 0:
        return None
    return a / b


def yoy(values):
    """Son çeyreğin geçen yılın aynı çeyreğine göre değişimi."""
    if not values or len(values) < 5:
        return None
    cur, prev = values[-1], values[-5]
    if cur is None or prev is None or prev == 0:
        return None
    return (cur - prev) / abs(prev)


_fx_cache = {"TRY": 1.0}


def fx_to_try(currency: str):
    """Raporlama para biriminin güncel TL karşılığı (THY, Pegasus gibi USD raporlayanlar için)."""
    currency = (currency or "TRY").upper()
    if currency not in _fx_cache:
        h = yf.Ticker(f"{currency}TRY=X").history(period="5d")
        _fx_cache[currency] = float(h["Close"].iloc[-1]) if not h.empty else None
    return _fx_cache[currency]


def fetch(code: str):
    t = yf.Ticker(f"{code}.IS")
    info = t.info or {}
    fin_currency = (info.get("financialCurrency") or "TRY").upper()
    fx = fx_to_try(fin_currency) or 1.0

    hist = t.history(period="5y", interval="1d", auto_adjust=False)
    prices = []
    if not hist.empty:
        for idx, r in hist.iterrows():
            c = clean(r["Close"])
            if c is not None:
                prices.append({"d": idx.strftime("%Y-%m-%d"), "c": round(c, 4), "v": int(clean(r["Volume"]) or 0)})

    q_bal = statement(t.quarterly_balance_sheet, BALANCE_ROWS, 8)
    q_inc = statement(t.quarterly_income_stmt, INCOME_ROWS, 8)
    q_cf = statement(t.quarterly_cashflow, CASHFLOW_ROWS, 8)
    a_bal = statement(t.balance_sheet, BALANCE_ROWS, 5)
    a_inc = statement(t.income_stmt, INCOME_ROWS, 5)
    a_cf = statement(t.cashflow, CASHFLOW_ROWS, 5)

    price = prices[-1]["c"] if prices else clean(info.get("currentPrice"))
    prev = prices[-2]["c"] if len(prices) > 1 else None
    year = [p["c"] for p in prices[-252:]]

    shares = last(row(q_bal, "Hisse Adedi") or row(a_bal, "Hisse Adedi")) or clean(info.get("sharesOutstanding"))
    mcap = price * shares if price and shares else clean(info.get("marketCap"))

    # Çeyreklik veri yetersizse yıllığa düş; sonuç TL'ye çevrilir
    def pick(label, stmt_q, stmt_a, use_ttm):
        qv = row(stmt_q, label)
        if use_ttm:
            v = ttm(qv)
            if v is None:
                v = last(row(stmt_a, label))
        else:
            v = last(qv) if qv else last(row(stmt_a, label))
        return v * fx if v is not None else None

    net_income = pick("Ana Ortaklık Net Kârı", q_inc, a_inc, True)
    revenue = pick("Hasılat", q_inc, a_inc, True)
    gross = pick("Brüt Kâr", q_inc, a_inc, True)
    ebitda = pick("FAVÖK", q_inc, a_inc, True)
    op_income = pick("Esas Faaliyet Kârı", q_inc, a_inc, True)
    equity = pick("Ana Ortaklık Özkaynakları", q_bal, a_bal, False)
    assets = pick("Toplam Varlıklar", q_bal, a_bal, False)
    net_debt = pick("Net Borç", q_bal, a_bal, False)
    debt = pick("Finansal Borçlar", q_bal, a_bal, False)
    cur_assets = pick("Dönen Varlıklar", q_bal, a_bal, False)
    cur_liab = pick("Kısa Vadeli Yükümlülükler", q_bal, a_bal, False)
    fcf = pick("Serbest Nakit Akışı", q_cf, a_cf, True)

    ev = mcap + net_debt if mcap is not None and net_debt is not None else None
    div_yield = clean(info.get("dividendYield"))
    if div_yield is not None and div_yield > 1:  # yfinance bazen yüzde olarak döner
        div_yield /= 100

    metrics = {
        "price": price,
        "change": ratio(price - prev, prev) if price and prev else None,
        "change1y": ratio(price - year[0], year[0]) if price and year else None,
        "high52": max(year) if year else None,
        "low52": min(year) if year else None,
        "marketCap": mcap,
        "ev": ev,
        "pe": ratio(mcap, net_income) if net_income and net_income > 0 else None,
        "pb": ratio(mcap, equity) if equity and equity > 0 else None,
        "evEbitda": ratio(ev, ebitda) if ebitda and ebitda > 0 else None,
        "ps": ratio(mcap, revenue) if revenue and revenue > 0 else None,
        "roe": ratio(net_income, equity) if equity and equity > 0 else None,
        "roa": ratio(net_income, assets),
        "grossMargin": ratio(gross, revenue),
        "ebitdaMargin": ratio(ebitda, revenue),
        "operatingMargin": ratio(op_income, revenue),
        "netMargin": ratio(net_income, revenue),
        "currentRatio": ratio(cur_assets, cur_liab),
        "debtToEquity": ratio(debt, equity) if equity and equity > 0 else None,
        "netDebtEbitda": ratio(net_debt, ebitda) if ebitda and ebitda > 0 else None,
        "revenueGrowth": yoy(row(q_inc, "Hasılat")),
        "netIncomeGrowth": yoy(row(q_inc, "Ana Ortaklık Net Kârı")),
        "dividendYield": div_yield,
        "fcfYield": ratio(fcf, mcap),
        "netIncomeTtm": net_income,
        "revenueTtm": revenue,
        "ebitdaTtm": ebitda,
        "equity": equity,
        "netDebt": net_debt,
    }

    sector_en = info.get("sector")
    detail = {
        "code": code,
        "name": info.get("longName") or info.get("shortName") or code,
        "sector": SECTORS.get(sector_en, sector_en or "Diğer"),
        "industry": info.get("industry"),
        "summary": info.get("longBusinessSummary"),
        "website": info.get("website"),
        "employees": info.get("fullTimeEmployees"),
        "city": info.get("city"),
        "financialCurrency": fin_currency,
        "metrics": metrics,
        "prices": prices,
        "statements": {
            "quarterly": {"balance": q_bal, "income": q_inc, "cashflow": q_cf},
            "annual": {"balance": a_bal, "income": a_inc, "cashflow": a_cf},
        },
    }
    return detail


def round_sig(v, digits=6):
    """companies.json'ı küçük tutmak için anlamlı basamağa yuvarla."""
    if v is None or v == 0:
        return v
    return round(v, digits - 1 - int(math.floor(math.log10(abs(v)))))


def fetch_with_retry(code: str):
    for attempt in range(RETRIES):
        try:
            return fetch(code)
        except Exception as e:  # noqa: BLE001
            if attempt == RETRIES - 1:
                raise
            # Yahoo hız sınırına takılırsa beklemeyi uzat
            time.sleep(30 * (attempt + 1) if "Too Many Requests" in str(e) else 1)


def is_active(d) -> bool:
    """İşlem görmeyen (kotasyondan çıkmış) hisseleri ayıkla."""
    if not d["prices"]:
        return False
    last_day = datetime.strptime(d["prices"][-1]["d"], "%Y-%m-%d")
    return datetime.now() - last_day < timedelta(days=30)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    COMPANIES_DIR.mkdir(parents=True, exist_ok=True)
    index_path = DATA / "companies.json"

    if "--indices-only" in sys.argv:
        out = json.loads(index_path.read_text(encoding="utf-8"))
        index = {c["code"]: c for c in out["companies"]}
        enrich(index)
        out["companies"] = sorted(index.values(), key=lambda c: c["code"])
        index_path.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
        return

    if args:
        codes = [c.upper() for c in args]
    elif "--refresh-list" in sys.argv or not TICKERS_PATH.exists():
        codes = refresh_tickers()
    else:
        codes = json.loads(TICKERS_PATH.read_text(encoding="utf-8"))

    index = {}
    if index_path.exists():
        for c in json.loads(index_path.read_text(encoding="utf-8"))["companies"]:
            index[c["code"]] = c

    lock = threading.Lock()
    done = 0
    failed, inactive = [], []

    def handle(code, d):
        nonlocal done
        with lock:
            done += 1
            prefix = f"[{done}/{len(codes)}] {code}:"
            if d is None:
                return
            if not is_active(d):
                inactive.append(code)
                index.pop(code, None)
                (COMPANIES_DIR / f"{code}.json").unlink(missing_ok=True)
                print(f"{prefix} işlem görmüyor, atlandı")
                return
            (COMPANIES_DIR / f"{code}.json").write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
            index[code] = {
                "code": code,
                "name": d["name"],
                "sector": d["sector"],
                "industry": d["industry"],
                "metrics": {k: round_sig(v) if isinstance(v, float) else v for k, v in d["metrics"].items()},
                "spark": [p["c"] for p in d["prices"][-90:]][::3],
            }
            print(f"{prefix} {d['name']} — {len(d['statements']['quarterly']['income']['periods'])} çeyrek")

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(fetch_with_retry, c): c for c in codes}
        for f in as_completed(futures):
            code = futures[f]
            try:
                handle(code, f.result())
            except Exception as e:  # noqa: BLE001
                failed.append(code)
                handle(code, None)
                print(f"{code}: HATA {e}")

    enrich(index)
    out = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "companies": sorted(index.values(), key=lambda c: c["code"]),
    }
    index_path.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"{len(index)} şirket yazıldı → {index_path}")
    if inactive:
        print(f"İşlem görmeyen ({len(inactive)}): {' '.join(sorted(inactive))}")
    if failed:
        print(f"Hata alan ({len(failed)}): {' '.join(sorted(failed))} — tekrar denemek için: "
              f"python scripts/fetch_data.py {' '.join(sorted(failed))}")


if __name__ == "__main__":
    main()
