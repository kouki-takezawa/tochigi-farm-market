# 栃木の直売マルシェ (MVP)

栃木県内限定・顔の見える直売マルシェ。仕様全文は [SPEC.md](./SPEC.md) を参照。

## デプロイ済みURL

- **本体サイト**: https://tochigi-farm-market.pages.dev

デザイン比較用バリアント(本体と同じSupabaseバックエンドを見ているので、すべて実データで動作する。
詳細・各ページ構成・片付け方は [variants/README.md](./variants/README.md) を参照):

| バリアント | 参考にしたデザイン | URL |
|---|---|---|
| v2-luxury | takenaka-foodware.jp 風(ダーク全面写真ヒーロー・常時スティッキーナビ) | https://tochigi-marche-luxury.pages.dev |
| v3-mono | tosou.nishizaki.co.jp 風(黒の極太見出し・実写コラージュグリッド) | https://tochigi-marche-mono.pages.dev |
| v5-organic | tenten.fun 風(縦書きコピー・余白多め・ハンバーガーメニュー) | https://tochigi-marche-organic.pages.dev |

Cloudflareプロジェクト名はそれぞれ `tochigi-farm-market` / `tochigi-marche-luxury` / `tochigi-marche-mono` / `tochigi-marche-organic`。
再デプロイはリポジトリ直下から以下のコマンド(`npx wrangler pages deploy <ディレクトリ> --project-name <プロジェクト名>`)。

```bash
npx wrangler pages deploy public --project-name tochigi-farm-market
npx wrangler pages deploy variants/v2-luxury --project-name tochigi-marche-luxury
npx wrangler pages deploy variants/v3-mono --project-name tochigi-marche-mono
npx wrangler pages deploy variants/v5-organic --project-name tochigi-marche-organic
```

`functions/` はリポジトリ直下(カレントディレクトリ)から自動検出されてバンドルされるため、
上記はすべてリポジトリのルートで実行すること(`variants/vX-yyy` の中に入って実行しない)。

## 構成

- **フロントエンド**: ビルド不要の素のHTML/CSS/JS (`public/`)
- **API**: Cloudflare Pages Functions (`functions/`, TypeScript)
- **DB**: Supabase (Postgres)。書き込みはCloudflare Functionsからservice_roleキー経由のみ
- **画像**: Cloudflare R2
- **ホスティング**: Cloudflare Pages
- **稼働維持**: GitHub Actionsが3日おきにSupabaseへ軽いクエリを送り、無料プランの自動一時停止(7日間無アクセスでpause)を防止

## 実装範囲

- 農家一覧(市町村タブ絞り込み、更新が新しい順)
- 農家ページ(出品・イベント・バイト求人表示、LINE/電話への連絡導線)
- 農家向け投稿・編集画面(出品・イベント・人手募集・バイト求人)
- 運営者向け管理画面 (`/admin.html`): 農家登録と管理URLの発行、位置(緯度経度)修正
- 出品者ログイン (`/seller.html`, PIN方式の仮実装)
- マップ表示 (`/map.html`, Leaflet + 現在地からの近い順)
- 全農家横断の一覧: 出品一覧 (`/listings.html`)・イベント一覧 (`/events.html`)・バイト求人一覧 (`/jobs.html`)

農家には認証機能を作らず、代わりに「農家ID + 秘密トークン」を含む管理URL(`/post.html?farmer=...&token=...`)を運営者が発行してLINE等で送る方式にしている(仕様の「知り合いベースで直売」というビジネスモデルに合わせ、登録は運営者が代行する前提)。

## セットアップ手順

### 1. Supabaseプロジェクトを作成

1. https://supabase.com でプロジェクトを新規作成(東京リージョン推奨)
2. SQL Editorで [`supabase_schema.sql`](./supabase_schema.sql) の内容を実行
   (既存プロジェクトを流用していて `jobs` テーブルが無い場合は [`supabase_migration_002_jobs.sql`](./supabase_migration_002_jobs.sql) も実行)
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

1. `/admin.html` を開き、`ADMIN_SECRET` を入力
2. 「新しい農家を登録」フォームから農家情報を入力
3. 発行された管理URL(`https://.../post.html?farmer=xxx&token=xxx`)を、その農家にLINE等で送る
4. 農家はそのURLをスマホのホーム画面等にブックマークし、以後は自分でそのURLから出品・イベントを更新する

## 商用利用における Vercel vs Cloudflare の判断

決済・メッセージ機能を持たず画像+テキストのシンプルなCRUDが中心、かつ「農家に導入コストを感じさせない」ことが要件のため、無料枠が広く運用コストを抑えやすいCloudflare(Pages + D1相当の代わりにSupabase + R2)を採用している。Next.jsのDXやVercel限定機能を重視する場合はVercelも選択肢になるが、本サービスの性質上はCloudflareが優位という判断。
