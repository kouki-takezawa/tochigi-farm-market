-- 栃木県直売マルシェ Supabase(Postgres)スキーマ
-- Supabaseダッシュボードの SQL Editor に貼り付けて実行してください。

create table if not exists farmers (
  id text primary key,
  name text not null,
  municipality text not null,
  crops text not null default '',
  description text not null default '',
  cover_image_url text,
  line_url text,
  phone text,
  manage_token text not null unique,
  created_at bigint not null,
  updated_at bigint not null
);

create table if not exists listings (
  id text primary key,
  farmer_id text not null references farmers(id) on delete cascade,
  image_url text,
  title text not null,
  comment text not null default '',
  price integer,
  is_special boolean not null default false,
  created_at bigint not null
);

create table if not exists events (
  id text primary key,
  farmer_id text not null references farmers(id) on delete cascade,
  kind text not null default 'event', -- 'event' | 'labor'
  title text not null,
  event_date date not null,
  event_time text,
  location text not null default '',
  description text not null default '',
  fee text,
  created_at bigint not null
);

create index if not exists idx_listings_farmer on listings(farmer_id, created_at desc);
create index if not exists idx_events_farmer on events(farmer_id, event_date);
create index if not exists idx_farmers_municipality on farmers(municipality);
create index if not exists idx_farmers_updated on farmers(updated_at desc);

-- Row Level Security:
-- アプリのCloudflare Functionsはservice_roleキーで接続するためRLSの影響を受けない(全操作可能)。
-- anonキーは読み取り専用にし、直接の書き込み(なりすまし投稿)を防ぐ。
-- manage_tokenによる書き込み権限チェックはアプリ側(Cloudflare Functions)でのみ行う設計。

alter table farmers enable row level security;
alter table listings enable row level security;
alter table events enable row level security;

create policy "Public read farmers" on farmers for select to anon, authenticated using (true);
create policy "Public read listings" on listings for select to anon, authenticated using (true);
create policy "Public read events" on events for select to anon, authenticated using (true);
