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
