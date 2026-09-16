# デザイン比較用バリアント(3パターン)

トップページのデザイン案として6パターン作成し、1・4・6(editorial・colorblock・tech)はNG判定のため削除済み。
残った3パターンは、実在サイト3つ(tosou.nishizaki.co.jp / tenten.fun / takenaka-foodware.jp)を参考に
デザイン・レイアウトを作り直し、機能面は本体サイトと完全に同等(農家一覧・農家ページ・マップ・投稿編集・
運営管理・出品者ログイン・出品一覧・イベント一覧・バイト求人一覧)まで作り込んである。

本体サイト([public/](../public/))とは別のCloudflare Pagesプロジェクトとしてデプロイしており、
同じSupabaseバックエンド(`functions/`)を見ているので、すべてのページが本物のデータで動作する。

## 一覧

| フォルダ | プロジェクト名 | URL | 参考サイト | イメージ |
|---|---|---|---|---|
| `v2-luxury` | tochigi-marche-luxury | https://tochigi-marche-luxury.pages.dev | takenaka-foodware.jp | ダークな全面写真ヒーロー・六角形ロゴマーク・ピル型CTA/ログインボタン・常時表示スティッキーナビ |
| `v3-mono` | tochigi-marche-mono | https://tochigi-marche-mono.pages.dev | tosou.nishizaki.co.jp | 黒の極太見出しタイポグラフィ・実写のコラージュ風グリッド・モノスペースラベル |
| `v5-organic` | tochigi-marche-organic | https://tochigi-marche-organic.pages.dev | tenten.fun | 縦書き日本語コピー・余白多めのクリーム背景・葉っぱアイコンのアクセント・ハンバーガーメニュー |

ヒーロー写真はWikimedia Commonsの実在するライセンス画像(Alpsdake, CC BY-SA 4.0)を各サイトのトーンに合わせて
トリミング・演出を変えて使用。各サイトの一番上にデザイン案の帯を表示し、本体サイトへのリンクを置いている。

## ページ構成(3案とも同一)

- `index.html` — 農家一覧トップ(市町村タブ絞り込み)
- `farmer.html` — 農家個別ページ(出品・イベント・人手募集・バイト求人)
- `listings.html` / `events.html` / `jobs.html` — 全農家横断の出品/イベント/バイト求人一覧
- `map.html` — 地図から探す
- `post.html` — 農家本人の投稿・編集画面(manage token方式)
- `admin.html` — 運営管理(農家登録・位置修正・削除)
- `seller.html` — 出品者ログイン(PINは仮実装)

v2-luxury / v3-mono は常時表示の上部ナビバー(ハンバーガーなし)、v5-organic はハンバーガードロワーメニュー
(`common.js` の `initNav()`)という、参照元サイトのナビ構成の違いをそのまま踏襲している。

## 1つを選んだ後の片付け方

1. このリポジトリ側: `variants/` の中から、選ばなかった2フォルダを削除してコミット
   (`git rm -r variants/vX-yyy` のような形)。選んだデザインを本体([public/index.html](../public/index.html)・
   [public/styles.css](../public/styles.css))に反映する場合は、該当バリアントの index.html / styles.css の
   中身を public/ 側に移植する。
2. Cloudflare側: 使わないPagesプロジェクトを削除
   ```
   npx wrangler pages project delete <project-name>
   ```
   (例: `npx wrangler pages project delete tochigi-marche-mono`)
   ダッシュボード(Cloudflare > Workers & Pages)から削除してもよい。
