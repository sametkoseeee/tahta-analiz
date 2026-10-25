# Yayına alma rehberi (GitHub + Supabase + Vercel)

Toplam ~30 dakika. Üç ücretsiz hesap gerekiyor. Anahtarları **kimseyle paylaşma**; yalnızca aşağıda söylenen yerlere yapıştır.

Bitince:
- Site `https://<proje-adı>.vercel.app` adresinde yayında olur, her iş günü 19:30'da veriyi tazeler.
- Kullanıcılar kayıt olup izleme listesini tüm cihazlarında görür.
- İzlenen şirketlerin KAP bildirimleri site kapalıyken de telefona/masaüstüne gelir (10 dakikada bir kontrol).

---

## 1. GitHub — kodu yükle

1. <https://github.com> üzerinden hesap aç (varsa giriş yap).
2. Sağ üstte **+ → New repository**: ad `borsa-analiz`, **Private** seç, başka hiçbir kutuyu işaretleme → **Create repository**.
3. Bilgisayarında proje klasöründe şunları çalıştır (`KULLANICI_ADIN` yerine GitHub kullanıcı adını yaz):

   ```bash
   git remote add origin https://github.com/KULLANICI_ADIN/borsa-analiz.git
   git push -u origin master
   ```

   İlk seferde tarayıcıda GitHub girişi açılır, onayla.

## 2. Supabase — üyelik ve veritabanı

1. <https://supabase.com> → **Start your project** (GitHub hesabınla girebilirsin).
2. **New project**: ad `borsa-analiz`, güçlü bir veritabanı şifresi belirle (bir yere not et), bölge **Central EU (Frankfurt)** → **Create**.
3. Proje hazır olunca soldan **SQL Editor → New query**: bu repodaki `supabase/schema.sql` dosyasının tamamını yapıştır → **Run**. "Success" görmelisin.
4. Soldan **Project Settings → API**. Şu üç değeri not et:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** anahtarı → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** anahtarı → `SUPABASE_SERVICE_ROLE_KEY` (gizli! sadece Vercel ve GitHub Secrets'a)
5. Site adresi belli olunca (4. adım sonrası) **Authentication → URL Configuration**:
   - **Site URL**: `https://<proje-adı>.vercel.app`
   - **Redirect URLs**: `https://<proje-adı>.vercel.app/auth/callback` ve yerel deneme için `http://localhost:3100/auth/callback`

## 3. Vercel — site barındırma

1. <https://vercel.com> → **Sign up → Continue with GitHub**.
2. **Add New… → Project** → `borsa-analiz` reposunu **Import** et. Framework otomatik "Next.js" seçilir.
3. **Environment Variables** bölümüne şunları ekle (değerler: Supabase'ten aldıkların ve bilgisayarındaki `.env.local` dosyasındaki VAPID satırları):

   | Ad | Değer |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `.env.local`'daki değer |
   | `VAPID_PRIVATE_KEY` | `.env.local`'daki değer |
   | `VAPID_SUBJECT` | `.env.local`'daki değer |
   | `NEXT_PUBLIC_SITE_URL` | `https://<proje-adı>.vercel.app` |

4. **Deploy**'a bas. İlk build başarısız olabilir (veri henüz yok), sorun değil — asıl yayın GitHub Actions'tan yapılacak. Proje adresini (`<proje-adı>.vercel.app`) not et.
5. Üç değer daha topla:
   - **VERCEL_TOKEN**: sağ üst profil → **Account Settings → Tokens → Create** (ad: `github-actions`, süre: No expiration).
   - **VERCEL_PROJECT_ID**: proje → **Settings → General → Project ID**.
   - **VERCEL_ORG_ID**: **Account Settings → General → Vercel ID** (takım kullanıyorsan takım ayarlarındaki Team ID).

## 4. GitHub Secrets — otomatik işlerin anahtarları

GitHub'da repo → **Settings → Secrets and variables → Actions → New repository secret**. Şunların her birini ayrı ayrı ekle:

`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`,
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_SITE_URL`

## 5. İlk yayın

1. GitHub'da repo → **Actions** sekmesi → (istenirse "I understand… enable" ile iş akışlarını aç).
2. **Veri güncelle ve yayınla → Run workflow**. Tüm hisseleri çektiği için ilk sefer 20–40 dakika sürebilir.
3. Yeşil tik gelince site yayında. 2. adımdaki Supabase **URL Configuration** ayarını yapmayı unutma.
4. **KAP bildirimleri** iş akışı kendiliğinden 10 dakikada bir çalışır. İlk çalışmada mevcut bildirimleri "gönderildi" sayar; sonrakilerde yalnızca yeni bildirimleri gönderir.

## 6. Dene

1. Sitede **Giriş → Hesap oluştur**, e-postandaki bağlantıya tıkla.
2. Birkaç şirketi ☆ ile izle → **İzleme Listesi → Anlık bildirimler**'i aç, tarayıcı izin isterse **İzin ver**.
3. Telefonda da aynı hesapla girip bildirimleri açabilirsin. iPhone'da Web Push için siteyi Safari'de **Paylaş → Ana Ekrana Ekle** ile ekleyip oradan açman gerekir (iOS 16.4+).

## Yerelde üyelikle çalıştırmak

`.env.local` dosyasındaki boş Supabase satırlarını doldur, sonra:

```bash
npm run build && npm start -- -p 3100
```

Bildirim göndericiyi elle denemek için: `node --env-file=.env.local scripts/kap_push.mjs`
