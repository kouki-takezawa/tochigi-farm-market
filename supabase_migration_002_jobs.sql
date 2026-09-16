-- マイグレーション: バイト・求人募集用の jobs テーブルを追加
-- Supabase SQL Editorで一度だけ実行してください。
--
-- 既存の「イベント」の人手募集(events.kind='labor')は、単発の手伝い募集(無償/謝礼程度)を
-- 想定した仕組みとして残す。jobsは「時給・日給などの給与が明示された、より正式な
-- 求人・アルバイト募集」を扱う、意図的に別立ての機能。

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

create index if not exists idx_jobs_farmer on jobs(farmer_id, created_at desc);
create index if not exists idx_jobs_created on jobs(created_at desc);

alter table jobs enable row level security;

drop policy if exists "Public read jobs" on jobs;
create policy "Public read jobs" on jobs for select to anon, authenticated using (true);
