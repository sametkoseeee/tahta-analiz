"""İş Yatırım mali tablo servisinden uzun dönem (2016'dan bugüne) mali tablolar.

Servis 4 dönemlik gruplar halinde TL cinsinden değer döndürür; USD raporlayan şirketler
(THYAO, PGSUS…) de TL'ye çevrilmiş gelir. Gelir tablosu ve nakit akışı kümülatiftir
(3A, 6A, 9A, 12A); burada tek çeyreğe çevrilir. Bilanço dönem sonu değeridir.
"""
import time
from datetime import date

import requests

URL = "https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/Common/Data.aspx/MaliTablo"
HEADERS = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
FIRST_YEAR = 2016

# Sanayi/hizmet şirketleri ("XI_29"): (etiket, toplanacak kalem kodları)
INDUSTRIAL = {
    "balance": [
        ("Dönen Varlıklar", ["1A"]),
        ("Nakit ve Nakit Benzerleri", ["1AA"]),
        ("Kısa Vadeli Finansal Yatırımlar", ["1AB"]),
        ("Ticari Alacaklar", ["1AC"]),
        ("Stoklar", ["1AF"]),
        ("Duran Varlıklar", ["1AK"]),
        ("Maddi Duran Varlıklar", ["1BG"]),
        ("Kullanım Hakkı Varlıkları", ["1BFAA"]),
        ("Maddi Olmayan Duran Varlıklar", ["1BH", "1BGA"]),
        ("Toplam Varlıklar", ["1BL"]),
        ("Kısa Vadeli Yükümlülükler", ["2A"]),
        ("Uzun Vadeli Yükümlülükler", ["2B"]),
        ("Toplam Yükümlülükler", ["2A", "2B"]),
        ("Finansal Borçlar", ["2AA", "2BA"]),
        ("Ana Ortaklık Özkaynakları", ["2O"]),
        ("Azınlık Payları", ["2ODA"]),
        ("Toplam Özkaynaklar", ["2N"]),
        ("Ödenmiş Sermaye", ["2OA"]),
    ],
    "income": [
        ("Hasılat", ["3C"]),
        ("Satışların Maliyeti", ["3CA"]),
        ("Brüt Kâr", ["3D"]),
        ("Pazarlama, Satış ve Dağıtım Giderleri", ["3DA"]),
        ("Genel Yönetim Giderleri", ["3DB"]),
        ("Araştırma ve Geliştirme Giderleri", ["3DC"]),
        ("Net Faaliyet Kârı", ["3H"]),
        ("Esas Faaliyet Kârı", ["3DF"]),
        ("FAVÖK", ["3H", "4B"]),  # net faaliyet kârı + amortisman
        ("Yatırım Faaliyetlerinden Net Gelir", ["3HA", "3HAA"]),
        ("Finansman Gelirleri", ["3HB"]),
        ("Finansman Giderleri", ["3HC"]),
        ("Vergi Öncesi Kâr", ["3I"]),
        ("Vergi Gideri", ["3IA"]),
        ("Dönem Net Kârı", ["3L"]),
        ("Ana Ortaklık Net Kârı", ["3Z"]),
    ],
    "cashflow": [
        ("İşletme Faaliyetlerinden Nakit", ["4C"]),
        ("Amortisman ve İtfa Payları", ["4CAB"]),
        ("İşletme Sermayesindeki Değişim", ["4CAF"]),
        ("Yatırım Faaliyetlerinden Nakit", ["4CAK"]),
        ("Yatırım Harcamaları", ["4CAI"]),
        ("Serbest Nakit Akışı", ["4CB"]),
        ("Finansman Faaliyetlerinden Nakit", ["4CBE"]),
        ("Ödenen Temettü", ["4CBB"]),
        ("Dönem Sonu Nakit", ["4CBL"]),
    ],
}

# Bankalar ("UFRS")
BANK = {
    "balance": [
        ("Nakit Değerler ve Merkez Bankası", ["1A"]),
        ("Bankalar", ["1AC"]),
        ("Krediler", ["1AF"]),
        ("Maddi Duran Varlıklar", ["1AN"]),
        ("Toplam Varlıklar", ["1Z"]),
        ("Mevduat", ["2A"]),
        ("Alınan Krediler", ["2C"]),
        ("İhraç Edilen Menkul Kıymetler", ["2E"]),
        ("Finansal Borçlar", ["2C", "2D", "2E"]),
        ("Ana Ortaklık Özkaynakları", ["2O"]),
        ("Toplam Özkaynaklar", ["2O"]),
        ("Ödenmiş Sermaye", ["2OA"]),
    ],
    "income": [
        ("Faiz Gelirleri", ["3A"]),
        ("Faiz Giderleri", ["3B"]),
        ("Net Faiz Geliri", ["3C"]),
        ("Net Ücret ve Komisyon Gelirleri", ["3CA"]),
        ("Ticari Kâr/Zarar", ["3CC"]),
        ("Faaliyet Gelirleri Toplamı", ["3CE"]),
        ("Kredi Karşılıkları", ["3CF"]),
        ("Diğer Faaliyet Giderleri", ["3CG"]),
        ("Net Faaliyet Kârı", ["3CH"]),
        ("Vergi Öncesi Kâr", ["3CL"]),
        ("Vergi Gideri", ["3CM"]),
        ("Dönem Net Kârı", ["3Z"]),
        ("Ana Ortaklık Net Kârı", ["3ZA"]),
    ],
    "cashflow": [],
}

# Sigorta şirketleri ("UFRS", bankalardan farklı kalem yapısı)
INSURANCE = {
    "balance": [
        ("Nakit ve Nakit Benzerleri", ["1A"]),
        ("Finansal Varlıklar", ["1B"]),
        ("Esas Faaliyetlerden Alacaklar", ["1C"]),
        ("Dönen Varlıklar", ["1H"]),
        ("Duran Varlıklar", ["1S"]),
        ("Toplam Varlıklar", ["1Z"]),
        ("Sigortacılık Teknik Karşılıkları", ["2E", "2MD"]),
        ("Kısa Vadeli Yükümlülükler", ["2I"]),
        ("Finansal Borçlar", ["2A", "2J"]),
        ("Ana Ortaklık Özkaynakları", ["2O"]),
        ("Toplam Özkaynaklar", ["2O"]),
    ],
    "income": [
        ("Teknik Gelirler", ["3A", "3D", "3FA"]),
        ("Teknik Giderler", ["3B", "3E", "3FJ"]),
        ("Teknik Bölüm Dengesi", ["3K"]),
        ("Yatırım Gelirleri", ["3L"]),
        ("Yatırım Giderleri", ["3M"]),
        ("Dönem Net Kârı", ["3Z"]),
        ("Ana Ortaklık Net Kârı", ["3Z"]),
    ],
    "cashflow": [],
}

# Diğer UFRS şirketleri için yalnızca ortak toplamlar
FINANCIAL_GENERIC = {
    "balance": [
        ("Toplam Varlıklar", ["1Z"]),
        ("Ana Ortaklık Özkaynakları", ["2O"]),
        ("Toplam Özkaynaklar", ["2O"]),
    ],
    "income": [
        ("Dönem Net Kârı", ["3Z"]),
        ("Ana Ortaklık Net Kârı", ["3Z"]),
    ],
    "cashflow": [],
}

# Dönem sonu bakiyesi olan (kümülatif olmayan) gelir/nakit kalemleri
POINT_IN_TIME = {"Dönem Sonu Nakit"}


def _pick_ufrs_template(descs):
    """UFRS şablonunu banka mı sigorta mı olduğuna kalem adlarından karar ver."""
    if "MEVDUAT" in descs.get("2A", "").upper():
        return BANK
    if "teknik" in descs.get("3A", "").lower() or "sigortacılık" in descs.get("2E", "").lower():
        return INSURANCE
    return FINANCIAL_GENERIC


GROUPS = ["XI_29", "UFRS"]

_session = requests.Session()
_session.headers.update(HEADERS)


def _periods_until_now():
    """FIRST_YEAR/3'ten bu yılın son çeyreğine kadar (yıl, ay) listesi, yeniden eskiye."""
    today = date.today()
    out = []
    for y in range(today.year, FIRST_YEAR - 1, -1):
        for m in (12, 9, 6, 3):
            if y == today.year and m > today.month:
                continue
            out.append((y, m))
    return out


def _request(code, group, periods, retries=3):
    params = {"companyCode": code, "exchange": "TRY", "financialGroup": group}
    for i, (y, m) in enumerate(periods, 1):
        params[f"year{i}"] = y
        params[f"period{i}"] = m
    for attempt in range(retries):
        try:
            r = _session.get(URL, params=params, timeout=40)
            r.raise_for_status()
            return r.json().get("value") or []
        except (requests.RequestException, ValueError):
            if attempt == retries - 1:
                raise
            time.sleep(3 * (attempt + 1))
    return []


def _num(v):
    if v in (None, ""):
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _raw(code, group, periods):
    """({(yıl, ay): {kalem_kodu: değer}}, {kalem_kodu: açıklama}) — boş dönemler atlanır."""
    data, descs = {}, {}
    for i in range(0, len(periods), 4):
        chunk = periods[i:i + 4]
        rows = _request(code, group, chunk)
        for r in rows:
            descs.setdefault(r["itemCode"], (r.get("itemDescTr") or "").strip())
        for j, p in enumerate(chunk, 1):
            vals = {r["itemCode"]: _num(r.get(f"value{j}")) for r in rows}
            if any(v not in (None, 0) for v in vals.values()):
                data[p] = vals
        # İlk iki gruptan (son 2 yıl) hiç veri gelmiyorsa şirket bu şablonu kullanmıyor demektir
        if i == 4 and not data:
            return {}, {}
    return data, descs


def _value(vals, codes):
    xs = [vals.get(c) for c in codes]
    if all(x is None for x in xs):
        return None
    return sum(x for x in xs if x is not None)


def _build(raw, template):
    periods = sorted(raw)  # eskiden yeniye
    if not periods:
        return None

    def cumulative(label_codes):
        return {p: _value(raw[p], label_codes) for p in periods}

    def stmt(section, kind):
        rows_q, rows_a = [], []
        for label, codes in template[section]:
            cum = cumulative(codes)
            if kind == "balance" or label in POINT_IN_TIME:
                q = [cum[p] for p in periods]
            else:
                # Kümülatif → tek çeyrek: Q1 aynen, diğerleri bir önceki çeyrekle farkı
                q = []
                for y, m in periods:
                    cur = cum[(y, m)]
                    if m == 3:
                        q.append(cur)
                    else:
                        prev = cum.get((y, m - 3))
                        q.append(cur - prev if cur is not None and prev is not None else None)
            a = [cum[p] for p in periods if p[1] == 12]
            if any(v is not None for v in q):
                rows_q.append({"label": label, "values": [round(v) if v is not None else None for v in q]})
            if any(v is not None for v in a):
                rows_a.append({"label": label, "values": [round(v) if v is not None else None for v in a]})
        return (
            {"periods": [f"{y}-{m:02d}" for y, m in periods], "rows": rows_q},
            {"periods": [f"{y}-12" for y, m in periods if m == 12], "rows": rows_a},
        )

    out = {"quarterly": {}, "annual": {}}
    for section in ("balance", "income", "cashflow"):
        q, a = stmt(section, section)
        out["quarterly"][section], out["annual"][section] = q, a

    # Net borç ve hisse başına kâr türetilmiş kalemler
    for mode in ("quarterly", "annual"):
        bal, inc = out[mode]["balance"], out[mode]["income"]
        get = lambda s, l: next((r["values"] for r in s["rows"] if r["label"] == l), None)  # noqa: E731
        debt, cash = get(bal, "Finansal Borçlar"), get(bal, "Nakit ve Nakit Benzerleri")
        if debt and cash:
            net = [d - c if d is not None and c is not None else None for d, c in zip(debt, cash)]
            idx = next(i for i, r in enumerate(bal["rows"]) if r["label"] == "Finansal Borçlar")
            bal["rows"].insert(idx + 1, {"label": "Net Borç", "values": net})
        ni, shares = get(inc, "Ana Ortaklık Net Kârı"), get(bal, "Ödenmiş Sermaye")
        if ni and shares and bal["periods"] == inc["periods"]:
            eps = [round(n / s, 4) if n is not None and s else None for n, s in zip(ni, shares)]
            inc["rows"].append({"label": "Hisse Başına Kâr", "values": eps})
    return out


def fetch_statements(code: str, group_hint: str | None = None):
    """(statements, group) ya da (None, None). group_hint önceki çalıştırmada bulunan şablondur."""
    periods = _periods_until_now()
    for group in sorted(GROUPS, key=lambda g: g != group_hint):
        raw, descs = _raw(code, group, periods)
        if raw:
            template = INDUSTRIAL if group == "XI_29" else _pick_ufrs_template(descs)
            return _build(raw, template), group
    return None, None
