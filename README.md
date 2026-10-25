# Hisse Analiz

BIST şirketlerinin mali tablolarını, oranlarını ve fiyat geçmişini gösteren, Fintables benzeri bir site.

- **Ana sayfa:** günün yükselen/düşenleri, en büyük şirketler, sektöre göre filtrelenebilir hisse tablosu
- **Şirket sayfası** (`/sirketler/THYAO`): fiyat grafiği, değerleme/kârlılık/büyüme/borçluluk oranları, hasılat–kâr ve marj grafikleri, bilanço / gelir tablosu / nakit akışı (çeyreklik ve yıllık), Excel'e aktarma
- **Hisse Radar** (`/radar`): oranlara göre çok kriterli tarama, hazır taramalar, endeks ve sektör filtresi, Excel'e aktarma
- **İzleme listesi** (`/izleme-listesi`): ☆ ile şirket ekleme, izlenen şirketlerin KAP bildirimleri, yeni bildirimde tarayıcı bildirimi ve zil sayacı

## İzleme listesi ve bildirimler

- Liste ve bildirim ayarları tarayıcıda (localStorage) tutulur; üyelik olmadığı için cihaza özeldir.
- Haberler KAP'tan gelir: `/api/haberler?codes=THYAO,ASELS&days=7` sunucuda KAP'ın bildirim sorgusunu çağırır (1 dakika önbellekli).
- Site açık bir sekmedeyken izlenen şirketler 2 dakikada bir kontrol edilir; yeni bildirim gelince tarayıcı bildirimi gösterilir. Sekme kapalıyken bildirim için Web Push ve sürekli çalışan bir sunucu gerekir.
- API rotası olduğu için site statik dışa aktarılamaz; `npm start` ile (Node sunucusu) çalışır.

## Veri

`scripts/fetch_data.py` veriyi çekip `data/` klasörüne JSON yazar; site build sırasında bu dosyaları okur.

- **Mali tablolar:** İş Yatırım'ın mali tablo servisinden (`scripts/isyatirim.py`), 2016'dan bugüne çeyreklik ve yıllık, TL cinsinden. Sanayi, banka ve sigorta şirketleri için ayrı kalem şablonları var. Kümülatif gelir tablosu/nakit akışı tek çeyreğe çevrilir; FAVÖK = net faaliyet kârı + amortisman. Veri gelmezse Yahoo'ya (son 5–6 çeyrek) düşülür.
- **Fiyatlar ve şirket bilgileri:** Yahoo Finance (yfinance). Seans içinde `scripts/update_prices.py` 15 dakikada bir tüm fiyatları tek toplu istekle çekip Supabase `prices` tablosuna yazar; site `/api/fiyatlar` üzerinden okuyup fiyata bağlı oranları tarayıcıda yeniden hesaplar (yeniden build gerekmez).

```bash
pip install yfinance pandas
python scripts/fetch_data.py                # data/tickers.json'daki tüm hisseler
python scripts/fetch_data.py --refresh-list # önce hisse listesini Yahoo'dan yenile (yeni halka arzlar için)
python scripts/fetch_data.py ASELS SISE     # sadece bazı hisseler
```

Notlar:
- Hisse listesi Yahoo'nun tarayıcısından gelir (Borsa İstanbul'daki tüm paylar); son 30 günde işlem görmeyenler atlanır.
- Endeks üyelikleri (BIST 30/50/100, Katılım, Temettü 25…) ve sektörler KAP'ın Endeksler sayfasından gelir; `python scripts/fetch_data.py --indices-only` yalnızca bunları günceller.
- Oranlar son 12 ay (son 4 çeyrek toplamı) üzerinden hesaplanır; çeyreklik veri yoksa son yıllık veri kullanılır.
- İş Yatırım USD raporlayan şirketlerin (THYAO, PGSUS…) tablolarını da TL verir; Yahoo'ya düşülen şirketlerde oranlar güncel kurla TL'ye çevrilir.
- Net borç = finansal borçlar − nakit (kiralama borçları dahil). Hisse adedi = ödenmiş sermaye (nominal 1 TL).
- Yahoo verisi kişisel kullanım içindir. Site ticari olarak yayına alınacaksa lisanslı bir veri kaynağı gerekir.

## Çalıştırma

```bash
npm install
npm run dev     # geliştirme
npm run build && npm start
```

Veriyi güncelledikten sonra yeniden build almak gerekir.
