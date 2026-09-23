-- マイグレーション: 全国展開に伴う拡張(都道府県・発送対応フラグ・掲載申し込み・レビュー)
-- Supabase SQL Editorで一度だけ実行してください。

-- 農家に都道府県を追加(既存行は空文字。運営画面で後追い入力が必要)
alter table farmers add column if not exists prefecture text not null default '';
create index if not exists idx_farmers_prefecture on farmers(prefecture);

-- 出品に「発送も相談可」の自己申告フラグを追加。
-- サイトが配送を代行するわけではなく、農家が購入者と直接相談する際の目印として使う。
alter table listings add column if not exists ships_available boolean not null default false;

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
create index if not exists idx_applications_status on farmer_applications(status, created_at desc);

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
create index if not exists idx_reviews_farmer on reviews(farmer_id, created_at desc);

alter table farmer_applications enable row level security;
alter table reviews enable row level security;

-- 申し込みには連絡先(電話番号・メール等)が含まれるため、anon/authenticatedへの
-- 読み取りポリシーは作らない(service_roleで動くCloudflare Functions経由のみ参照可能)。

drop policy if exists "Public read reviews" on reviews;
create policy "Public read reviews" on reviews for select to anon, authenticated using (true);
