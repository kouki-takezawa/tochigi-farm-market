-- マイグレーション: マップ機能用の緯度経度カラムを追加
-- Supabase SQL Editorで一度だけ実行してください(supabase_schema.sqlは新規構築用なので
-- 既にfarmersテーブルがある場合はこちらを実行する)。

alter table farmers add column if not exists lat double precision;
alter table farmers add column if not exists lng double precision;
