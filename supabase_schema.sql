-- とれたて便 Supabase(Postgres)スキーマ
-- Supabaseダッシュボードの SQL Editor に貼り付けて実行してください。

create table if not exists farmers (
  id text primary key,
  name text not null,
  prefecture text not null default '',
  municipality text not null,
  crops text not null default '',
  description text not null default '',
  cover_image_url text,
  line_url text,
  phone text,
  lat double precision,
  lng double precision,
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
  ships_available boolean not null default false,
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

-- バイト・求人募集(events.kind='labor'の単発手伝いとは別に、給与を明示した正式な求人を扱う)
create table if not exists jobs (
  id text primary key,
  farmer_id text not null references farmers(id) on delete cascade,
  title text not null,
  wage text not null,
  work_date text not null default '',
  work_hours text,
  capacity text,
  description text not null default '',
  created_at bigint not null
);

-- 農家自身がセルフ申請できる掲載申し込み。運営者が内容を確認し、承認したら
-- farmersテーブルへ登録して管理URLを発行する(知り合いベースの本人確認は運営者が引き続き担う)。
create table if not exists farmer_applications (
  id text primary key,
  name text not null,
  prefecture text not null,
  municipality text not null,
  crops text not null default '',
  description text not null default '',
  contact_method text not null default '', -- 'line' | 'phone' | 'email'
  contact_value text not null default '',
  status text not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  admin_note text,
  created_at bigint not null,
  reviewed_at bigint
);

-- 全国の初対面ユーザー同士が直接連絡することになるため、購入者が残せる
-- 農家への評価・コメント(信頼材料)。運営者がADMIN_SECRETで不適切な投稿を削除できる。
create table if not exists reviews (
  id text primary key,
  farmer_id text not null references farmers(id) on delete cascade,
  reviewer_name text not null default '匿名',
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  created_at bigint not null
);

create index if not exists idx_listings_farmer on listings(farmer_id, created_at desc);
create index if not exists idx_events_farmer on events(farmer_id, event_date);
create index if not exists idx_jobs_farmer on jobs(farmer_id, created_at desc);
create index if not exists idx_jobs_created on jobs(created_at desc);
create index if not exists idx_farmers_municipality on farmers(municipality);
create index if not exists idx_farmers_prefecture on farmers(prefecture);
create index if not exists idx_farmers_updated on farmers(updated_at desc);
create index if not exists idx_applications_status on farmer_applications(status, created_at desc);
create index if not exists idx_reviews_farmer on reviews(farmer_id, created_at desc);

-- Row Level Security:
-- アプリのCloudflare Functionsはservice_roleキーで接続するためRLSの影響を受けない(全操作可能)。
-- anonキーは読み取り専用にし、直接の書き込み(なりすまし投稿)を防ぐ。
-- manage_tokenによる書き込み権限チェックはアプリ側(Cloudflare Functions)でのみ行う設計。

alter table farmers enable row level security;
alter table listings enable row level security;
alter table events enable row level security;
alter table jobs enable row level security;
alter table farmer_applications enable row level security;
alter table reviews enable row level security;

create policy "Public read farmers" on farmers for select to anon, authenticated using (true);
create policy "Public read listings" on listings for select to anon, authenticated using (true);
create policy "Public read events" on events for select to anon, authenticated using (true);
create policy "Public read jobs" on jobs for select to anon, authenticated using (true);
create policy "Public read reviews" on reviews for select to anon, authenticated using (true);
-- farmer_applicationsには連絡先が含まれるため、公開の読み取りポリシーは作らない
-- (service_roleで動くCloudflare Functions経由でのみ運営者が参照する)。
