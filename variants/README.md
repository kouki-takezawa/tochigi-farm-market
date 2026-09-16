# デザイン比較用バリアント(残り3パターン)

sankoudesign.com/category/stylish/ を参考に作った、トップページのデザイン案。
元は6パターンあったが、editorial(黒背景大胆エディトリアル)・colorblock(原色ポップ)・
tech(ネイビーグラデーション)はNG判定のため削除済み(ローカルフォルダ・Cloudflare Pagesプロジェクトとも削除済み)。

本体サイト([public/](../public/))とは別のCloudflare Pagesプロジェクトとしてデプロイしており、
同じSupabaseバックエンドを見ているので、農家一覧・タブ絞り込み・農家ページへの遷移はすべて本物のデータで動作する。

## 一覧

| フォルダ | プロジェクト名 | URL | イメージ |
|---|---|---|---|
| `v2-luxury` | tochigi-marche-luxury | https://tochigi-marche-luxury.pages.dev | 白基調・細い明朝体のラグジュアリーミニマル |
| `v3-mono` | tochigi-marche-mono | https://tochigi-marche-mono.pages.dev | モノクロ・グリッド罫線の建築的レイアウト |
| `v5-organic` | tochigi-marche-organic | https://tochigi-marche-organic.pages.dev | テラコッタ×クラフト紙の温かみあるオーガニック |

ヒーロー画像は現在、出典未確認の仮素材(ユーザー提供)に差し替え済み。本番公開前に権利関係が明確な画像へ再差し替えが必要。

各サイトの一番上にデザイン案の帯を表示し、本体サイトへのリンクを置いている。
また、農家一覧の各カード・ハンバーガーメニューの「マップ」「出品者ログイン」は本体サイト
(tochigi-farm-market.pages.dev)側のページにリンクしている(このデザイン比較の対象はトップページのみのため)。

## 1つを選んだ後の片付け方

1. このリポジトリ側: `variants/` の中から、選ばなかった2フォルダを削除してコミット
   (`git rm -r variants/vX-yyy` のような形)。選んだデザインを本体([public/index.html](../public/index.html)・
   [public/styles.css](../public/styles.css))に反映する場合は、該当バリアントの index.html / styles.css の
   中身を public/ 側に移植する。
2. Cloudflare側: 使わないPagesプロジェクトを削除
   ```
   npx wrangler pages project delete <project-name>
   ```
   (例: `npx wrangler pages project delete tochigi-marche-editorial`)
   ダッシュボード(Cloudflare > Workers & Pages)から削除してもよい。
