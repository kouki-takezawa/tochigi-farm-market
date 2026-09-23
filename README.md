# とれたて便

全国対応・顔の見える直売マルシェ。仕様全文は [SPEC.md](./SPEC.md) を参照。

## デプロイ済みURL

- **本体サイト**: https://tochigi-farm-market.pages.dev

デザイン比較用に作っていた `variants/`(v2-luxury / v3-mono / v5-organic)は比較検討の結果すべて削除し、
本体サイト(`public/`)に1本化した。

## デザインの方針

生成り(紙)の地に深緑と柿色を効かせた低彩度のパレットで、影を使わず1pxの罫線で面を区切る。
見出しだけ明朝(Shippori Mincho)、本文は端末のゴシック。配色・角丸・余白の定義は
[`public/styles.css`](./public/styles.css) の `:root` に集約しているので、変更はそこから行う。

- **画面の役割分担**: トップは「何のサイトか」を伝える導線(ヒーロー/使い方/新着/カテゴリ/エリア)に絞り、
  検索と絞り込みの本体は出品一覧 (`/listings.html`) に集約している。トップの検索窓と各カテゴリは
  `?q=` `?cat=` `?area=` `?special=1` 付きで出品一覧へ渡す。
- **カードの共通化**: 出品・農家・イベント・求人のカードは [`public/common.js`](./public/common.js) の
  `listingCard()` / `farmerCard()` / `eventCard()` / `jobCard()` を全ページで共用する。
  ページ側で個別にカードのHTMLを書かないこと。
- **写真が無いときの表示**: 農家は写真なしで投稿できるため、出品に写真が無い場合は品目名から
  カテゴリを推定し、減光したカテゴリタイル(`/images/tile-*.jpg`)にカテゴリ名を載せて表示する。
  **鮮明な代替写真を実物の代わりに出さない**(直売サイトで実物と誤解されるのを避けるため)。
  タイルには「写真なし」のラベルを必ず添える。判定表は `common.js` の `CATEGORIES`。
- **下部タブバー**: スマホ専用。860px以上ではヘッダーのナビが担うのでCSSで非表示にしている。
  農家ページでは代わりに連絡ボタン(LINE/電話)を画面下に固定する。
- **画像**: `public/images/` は長辺1600px・JPEG品質82を上限とする。カテゴリ導線用が `cat-*.jpg`(800x600)、
  カード内の代替表示用が `tile-*.jpg`(600x450)。追加した写真の出典はフッターのクレジットにも追記すること
  (クレジットの実体は `common.js` の `initSiteFooter()`)。

再デプロイはリポジトリ直下から以下のコマンド。

```bash
npx wrangler pages deploy public --project-name tochigi-farm-market
```

過去に作成した `tochigi-marche-luxury` / `tochigi-marche-mono` / `tochigi-marche-organic` のCloudflare Pages
プロジェクトは、現在は不要になったため以下で削除できる(ダッシュボードからでも可)。

```bash
npx wrangler pages project delete tochigi-marche-luxury
npx wrangler pages project delete tochigi-marche-mono
npx wrangler pages project delete tochigi-marche-organic
```

## 構成

- **フロントエンド**: ビルド不要の素のHTML/CSS/JS (`public/`)
- **API**: Cloudflare Pages Functions (`functions/`, TypeScript)
- **DB**: Supabase (Postgres)。書き込みはCloudflare Functionsからservice_roleキー経由のみ
- **画像**: Cloudflare R2
- **ホスティング**: Cloudflare Pages
- **稼働維持**: GitHub Actionsが3日おきにSupabaseへ軽いクエリを送り、無料プランの自動一時停止(7日間無アクセスでpause)を防止

## 実装範囲

- トップ (`/`): ヒーロー・利用の流れ・新着の出品・品目カテゴリ・都道府県別エリア・イベント/求人の抜粋
- 農家一覧 (`/farmers.html`): 都道府県→市町村の2階層チップとキーワードで絞り込み、更新が新しい順
- 農家ページ(出品・イベント・バイト求人・評価表示、LINE/電話への連絡導線)
- 農家向け投稿・編集画面(出品[発送対応フラグ含む]・イベント・人手募集・バイト求人)
- 掲載申し込み (`/apply.html`): 農家が自分で登録を申請できる公開フォーム(運営者の承認制)
- 運営者向け管理画面 (`/admin.html`): 農家登録・掲載申し込みの承認/却下・管理URLの発行、位置(緯度経度)修正
- 出品者ログイン (`/seller.html`, PIN方式の仮実装)
- マップ表示 (`/map.html`, Leaflet + 現在地からの近い順・範囲絞り込み、全国対応)
- 全農家横断の一覧:
  - 出品一覧 (`/listings.html`): キーワード・品目カテゴリ・都道府県/市町村・わけあり・発送対応・並び順(新着/価格/近い順)で絞り込み。
    絞り込み状態はURLのクエリに同期するので、そのまま共有・ブックマークできる
  - イベント一覧 (`/events.html`): 都道府県/市町村で絞り込み、開催月ごとに区切って日付順に表示
  - バイト求人一覧 (`/jobs.html`): 都道府県/市町村で絞り込み、賃金を主役にしたカード

農家には認証機能を作らず、代わりに「農家ID + 秘密トークン」を含む管理URL(`/post.html?farmer=...&token=...`)を発行してLINE等で送る方式にしている(仕様の「知り合いベースで直売」というビジネスモデルに合わせた設計)。登録経路は2つ:運営者が直接 `/admin.html` から登録するか、農家が `/apply.html` から申し込み、運営者が `/admin.html` で承認すると同じ形の管理URLが発行される。いずれの経路でも、無審査で即時公開されることはない。

出品には「発送も相談可」の自己申告フラグを持たせられるが、これはあくまで農家がその旨を表示できるだけで、当サイトが配送を代行・手配することはない(決済・仲介と同様に対象外の方針は維持)。また、全国の初対面ユーザー間の信頼材料として、購入者が農家ページに評価(星1〜5+コメント)を投稿できる。運営者はADMIN_SECRETで不適切な評価を削除できる。

## セットアップ手順

### 1. Supabaseプロジェクトを作成

1. https://supabase.com でプロジェクトを新規作成(東京リージョン推奨)
2. SQL Editorで [`supabase_schema.sql`](./supabase_schema.sql) の内容を実行(新規構築の場合はこれで全テーブルが揃う)
   - 既存プロジェクトを流用していて一部テーブル・カラムが無い場合は、不足しているマイグレーションを追加で実行する:
     [`supabase_migration_001_geo.sql`](./supabase_migration_001_geo.sql)(緯度経度)、
     [`supabase_migration_002_jobs.sql`](./supabase_migration_002_jobs.sql)(バイト・求人)、
     [`supabase_migration_003_nationwide.sql`](./supabase_migration_003_nationwide.sql)(都道府県・発送対応フラグ・掲載申し込み・評価)
3. 動作確認したい場合は [`seed.sql`](./seed.sql) も実行(デモ用データ。本番では削除してよい)
4. Project Settings > API から以下を控える
   - `Project URL` → `SUPABASE_URL`
   - `anon public` キー → `SUPABASE_ANON_KEY`
   - `service_role` キー → `SUPABASE_SERVICE_ROLE_KEY`(**絶対にクライアント側に公開しない**)

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. Cloudflareの準備

```bash
npx wrangler login
npx wrangler r2 bucket create tochigi-farm-market-images
npx wrangler pages project create tochigi-farm-market
```

Pagesプロジェクトに環境変数(Secrets)を設定:

```bash
npx wrangler pages secret put SUPABASE_URL --project-name tochigi-farm-market
npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name tochigi-farm-market
npx wrangler pages secret put ADMIN_SECRET --project-name tochigi-farm-market
```

`ADMIN_SECRET` は `/admin.html` (農家登録画面)にアクセスするための任意の秘密文字列を自分で決めて設定する。

### 4. デプロイ

```bash
npm run deploy
```

初回デプロイ後、CloudflareダッシュボードのPagesプロジェクトに表示されるURL(`https://tochigi-farm-market.pages.dev` 等)でアクセスできる。独自ドメインを使う場合はPagesのCustom domainsから設定する。

### 5. ローカル開発

```bash
npm run dev
```

ローカルでSupabase/R2に接続するには `.dev.vars` ファイル(gitignore済み)を作成し以下を記載する。

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxx
ADMIN_SECRET=xxxx
```

### 6. Supabase自動一時停止対策(GitHub Actions)

`.github/workflows/keep-supabase-alive.yml` が3日ごとにSupabaseへ軽いSELECTクエリを送信し、無料プランの「7日間アクセスなしで自動pause」を防ぐ。GitHubリポジトリの Settings > Secrets and variables > Actions に以下を登録すること。

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

登録を忘れるとワークフローが失敗し、GitHubから通知メールが届く仕組みになっている(気づけるようにあえてサイレントに失敗させていない)。

### 7. 農家を登録する

運営者が直接登録する場合:
1. `/admin.html` を開き、`ADMIN_SECRET` を入力
2. 「新しい農家を登録」フォームから農家情報(都道府県を含む)を入力
3. 発行された管理URL(`https://.../post.html?farmer=xxx&token=xxx`)を、その農家にLINE等で送る
4. 農家はそのURLをスマホのホーム画面等にブックマークし、以後は自分でそのURLから出品・イベントを更新する

農家がセルフ申し込みする場合:
1. 農家が `/apply.html` から掲載を申し込む(農家名・都道府県・市町村・連絡方法などを入力)
2. 運営者が `/admin.html` の「掲載申し込み(セルフ申請)」で内容を確認し、承認または却下する
3. 承認すると上記と同じ形の管理URLが発行されるので、運営者がその農家に送る(または別途連絡窓口を用意する)

## 商用利用における Vercel vs Cloudflare の判断

決済・メッセージ機能を持たず画像+テキストのシンプルなCRUDが中心、かつ「農家に導入コストを感じさせない」ことが要件のため、無料枠が広く運用コストを抑えやすいCloudflare(Pages + D1相当の代わりにSupabase + R2)を採用している。Next.jsのDXやVercel限定機能を重視する場合はVercelも選択肢になるが、本サービスの性質上はCloudflareが優位という判断。
