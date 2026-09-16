-- デモ用シードデータ(開発確認用。本番投入前に削除してよい)
-- supabase_schema.sql を実行した後、Supabase SQL Editor で実行してください。

insert into farmers (id, name, municipality, crops, description, cover_image_url, line_url, phone, manage_token, created_at, updated_at) values
('farmer-demo-1', '鈴木農園', '宇都宮市', 'トマト・きゅうり・とうもろこし', '朝採れ野菜を中心に、農薬をできるだけ減らして育てています。畑の見学もいつでも歓迎です。', null, 'https://line.me/R/ti/p/@example1', '090-1111-2222', 'demo-token-suzuki', 1757900000, 1757900000),
('farmer-demo-2', '佐藤いちご園', '足利市', 'いちご・ぶどう', '観光農園も兼ねたいちご農家です。わけあり品も随時出しています。', null, null, '090-3333-4444', 'demo-token-sato', 1757900100, 1757900100),
('farmer-demo-3', '高橋牧場・畑', '那須塩原市', '米・りんご', '米とりんごを育てています。収穫期には手伝ってくれる方を探しています。', null, 'https://line.me/R/ti/p/@example3', null, 'demo-token-takahashi', 1757900200, 1757900200);

insert into listings (id, farmer_id, image_url, title, comment, price, is_special, created_at) values
('listing-demo-1', 'farmer-demo-1', null, '朝採れトマト', '甘みが強い品種です。今日の朝収穫しました。', 400, false, 1757986000),
('listing-demo-2', 'farmer-demo-1', null, '規格外きゅうり', '曲がっているだけで味は同じです。', 150, true, 1757986100),
('listing-demo-3', 'farmer-demo-2', null, '完熟いちご', '甘さがのった完熟いちごです。', 600, false, 1757986200);

insert into events (id, farmer_id, kind, title, event_date, event_time, location, description, fee, created_at) values
('event-demo-1', 'farmer-demo-2', 'event', 'いちご狩り体験', '2026-04-05', '10:00〜15:00', '佐藤いちご園 直売所前', '時間内食べ放題のいちご狩りです。予約不要。', '1500円', 1757986300),
('event-demo-2', 'farmer-demo-3', 'labor', '稲刈り手伝い募集', '2026-09-25', '9:00〜', '高橋牧場・畑 第2圃場', '稲刈りを手伝ってくれる方を募集しています。動きやすい服装でお越しください。', null, 1757986400);
