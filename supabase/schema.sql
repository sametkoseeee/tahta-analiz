-- Tahta Analiz veritabanı şeması. Supabase > SQL Editor'de bir kez çalıştır.

-- Kullanıcının izleme listesi
create table if not exists public.watchlist (
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null check (code ~ '^[A-Z0-9]{2,8}$'),
  created_at timestamptz not null default now(),
  primary key (user_id, code)
);

-- Web Push abonelikleri (bir kullanıcının birden çok cihazı olabilir)
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- Bildirimi gönderilmiş KAP bildirimleri (aynı bildirim iki kez gönderilmesin)
create table if not exists public.sent_disclosures (
  disclosure_id bigint primary key,
  sent_at timestamptz not null default now()
);

-- Seans içi güncel fiyatlar (scripts/update_prices.py 15 dakikada bir yazar)
create table if not exists public.prices (
  code text primary key,
  price numeric not null,
  prev_close numeric,
  change numeric,
  volume bigint,
  updated_at timestamptz not null default now()
);

-- Satır düzeyi güvenlik: herkes yalnızca kendi kayıtlarını görür/değiştirir
alter table public.watchlist enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.sent_disclosures enable row level security; -- yalnızca service role erişir (politika yok)

drop policy if exists "kendi izleme listesi" on public.watchlist;
create policy "kendi izleme listesi" on public.watchlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Fiyatlar herkese açık okunur, yalnızca service role yazar
alter table public.prices enable row level security;
drop policy if exists "fiyatlar herkese açık" on public.prices;
create policy "fiyatlar herkese açık" on public.prices for select using (true);

drop policy if exists "kendi abonelikleri" on public.push_subscriptions;
create policy "kendi abonelikleri" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Portföyüm: üyenin elindeki hisseler (lot ve pay başına ortalama maliyet)
create table if not exists public.portfolio (
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null check (code ~ '^[A-Z0-9]{2,8}$'),
  lots numeric not null check (lots > 0),
  cost numeric not null check (cost >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, code)
);
alter table public.portfolio enable row level security;
drop policy if exists "kendi portföyü" on public.portfolio;
create policy "kendi portföyü" on public.portfolio
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Fiyat alarmları (scripts/alarm_push.mjs seans içinde 15 dakikada bir kontrol eder)
create table if not exists public.price_alerts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null check (code ~ '^[A-Z0-9]{2,8}$'),
  direction text not null check (direction in ('above', 'below')),
  price numeric not null check (price > 0),
  created_at timestamptz not null default now(),
  triggered_at timestamptz,
  triggered_price numeric
);
create index if not exists price_alerts_open_idx on public.price_alerts (code) where triggered_at is null;
alter table public.price_alerts enable row level security;
drop policy if exists "kendi alarmları" on public.price_alerts;
create policy "kendi alarmları" on public.price_alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Haftalık e-posta bülteni: yalnızca açıkça isteyen üyeler (scripts/weekly_bulletin.mjs)
create table if not exists public.newsletter (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.newsletter enable row level security;
drop policy if exists "kendi bülten tercihi" on public.newsletter;
create policy "kendi bülten tercihi" on public.newsletter
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
