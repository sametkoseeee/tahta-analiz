"""Ekonomik takvim: borsayı etkileyen resmi veri açıklamaları.

- TÜİK Ulusal Veri Yayımlama Takvimi (tüm kurumlar): enflasyon, büyüme, işsizlik, dış ticaret, sanayi üretimi,
  cari denge, güven endeksleri. Kaynak: https://www.tuik.gov.tr/Kurumsal/Veri_Takvimi sayfasının kullandığı liste.
- TCMB takvimi: Para Politikası Kurulu (faiz kararı) ve Enflasyon Raporu tarihleri.

Gecede 3 istek. Çıktı: data/econ.json
  python scripts/fetch_econ.py
"""

import json
import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "econ.json"
HEADERS = {"User-Agent": "Mozilla/5.0", "Accept-Language": "tr"}
TUIK_URL = "https://www.tuik.gov.tr/Kurumsal/GetYillikHaberBulteniListesi?yil={}"
TCMB_URL = "https://www.tcmb.gov.tr/wps/wcm/connect/tr/tcmb+tr/main+menu/duyurular/takvim"
PAST_DAYS = 14
AHEAD_DAYS = 120

# (kurum, ad içinde geçen, sitede görünen ad, önem 1–3)
KEEP = [
    ("TÜİK", "Tüketici Fiyat Endeksi", "Enflasyon (TÜFE)", 3),
    ("TÜİK", "Yurt İçi Üretici Fiyat Endeksi", "Üretici enflasyonu (Yİ-ÜFE)", 2),
    ("TÜİK", "Dönemsel Gayrisafi Yurt İçi Hasıla", "Büyüme (GSYH)", 3),
    ("TÜİK", "İşgücü İstatistikleri", "İşsizlik oranı", 2),
    ("TÜİK", "Dış Ticaret İstatistikleri", "Dış ticaret", 2),
    ("TÜİK", "Sanayi Üretim Endeksi", "Sanayi üretimi", 2),
    ("TÜİK", "Tüketici Güven Endeksi", "Tüketici güveni", 1),
    ("TCMB", "Ödemeler Dengesi", "Cari denge (ödemeler dengesi)", 2),
    ("TCMB", "Piyasa Katılımcıları Anketi", "Piyasa katılımcıları anketi (enflasyon beklentisi)", 2),
    ("TCMB", "Reel Kesim Güven Endeksi", "Reel kesim güveni ve kapasite kullanımı", 1),
    ("HMB", "Merkezi Yönetim Bütçe", "Bütçe dengesi", 1),
]

MONTHS = {m: i + 1 for i, m in enumerate(
    ["ocak", "şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"])}


def tuik(year: int) -> list[dict]:
    r = requests.get(TUIK_URL.format(year), headers=HEADERS, timeout=60)
    r.raise_for_status()
    d = r.json()
    rows = (d.get("yayindaOlanlarList") or []) + (d.get("yayindaOlmayanlarList") or [])
    out = []
    for x in rows:
        if x.get("dilId") != 1:
            continue
        name = x.get("adi") or ""
        org = x.get("sorumluKisaAd") or ""
        for k_org, needle, label, weight in KEEP:
            # "Dış Ticaret İstatistikleri" ile "Dış Ticaret Endeksleri / Beklenti Anketi" karışmasın
            if org.startswith(k_org) and name.startswith(needle):
                out.append({"date": x["gTarih"][:16], "title": label, "period": x.get("donemi"), "org": org,
                            "weight": weight, "link": x.get("link")})
                break
    return out


def tcmb() -> list[dict]:
    r = requests.get(TCMB_URL, headers=HEADERS, timeout=60)
    r.raise_for_status()
    text = BeautifulSoup(r.text, "html.parser")
    out = []
    for tr in text.find_all("tr"):
        cells = [td.get_text(" ", strip=True) for td in tr.find_all("td")]
        if len(cells) < 3:
            continue
        for i, (label, weight) in {0: ("TCMB faiz kararı (PPK)", 3), 2: ("TCMB Enflasyon Raporu", 2)}.items():
            m = re.match(r"(\d{1,2}) (\w+) (\d{4})", cells[i] if i < len(cells) else "")
            if m and m[2].lower() in MONTHS:
                d = date(int(m[3]), MONTHS[m[2].lower()], int(m[1]))
                # PPK kararı 14:00'te açıklanır
                out.append({"date": f"{d.isoformat()}T{'14:00' if i == 0 else '10:30'}", "title": label, "period": None,
                            "org": "TCMB", "weight": weight, "link": TCMB_URL})
    return out


def main() -> None:
    today = date.today()
    events: list[dict] = []
    for year in sorted({today.year, (today + timedelta(days=AHEAD_DAYS)).year}):
        try:
            events += tuik(year)
        except Exception as e:  # noqa: BLE001
            print(f"TÜİK {year}: {e}", file=sys.stderr)
    try:
        events += tcmb()
    except Exception as e:  # noqa: BLE001
        print(f"TCMB: {e}", file=sys.stderr)
    if not events:
        sys.exit("Takvim alınamadı; önceki dosya kalır")

    lo = (today - timedelta(days=PAST_DAYS)).isoformat()
    hi = (today + timedelta(days=AHEAD_DAYS)).isoformat()
    seen = set()
    out = []
    for e in sorted(events, key=lambda e: (e["date"], -e["weight"])):
        key = (e["date"][:10], e["title"])
        if lo <= e["date"][:10] <= hi and key not in seen:
            seen.add(key)
            out.append(e)
    OUT.write_text(json.dumps({"updatedAt": datetime.now().isoformat(timespec="seconds"), "events": out},
                              ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(out)} etkinlik yazıldı")


if __name__ == "__main__":
    main()
