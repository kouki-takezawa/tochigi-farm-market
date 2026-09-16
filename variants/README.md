# デザイン比較用バリアント(6パターン)

sankoudesign.com/category/stylish/ を参考に作った、トップページの6つのデザイン案。
本体サイト([public/](../public/))とは別のCloudflare Pagesプロジェクトとしてデプロイしており、
同じSupabaseバックエンドを見ているので、農家一覧・タブ絞り込み・農家ページへの遷移はすべて本物のデータで動作する。

## 一覧

| フォルダ | プロジェクト名 | URL | イメージ |
|---|---|---|---|
| `v1-editorial` | tochigi-marche-editorial | https://tochigi-marche-editorial.pages.dev | 黒背景・極太タイポの大胆エディトリアル |
| `v2-luxury` | tochigi-marche-luxury | https://tochigi-marche-luxury.pages.dev | 白基調・細い明朝体のラグジュアリーミニマル |
| `v3-mono` | tochigi-marche-mono | https://tochigi-marche-mono.pages.dev | モノクロ・グリッド罫線の建築的レイアウト |
| `v4-colorblock` | tochigi-marche-colorblock | https://tochigi-marche-colorblock.pages.dev | 原色・丸ゴシックのポップなカラーブロック |
| `v5-organic` | tochigi-marche-organic | https://tochigi-marche-organic.pages.dev | テラコッタ×クラフト紙の温かみあるオーガニック |
| `v6-tech` | tochigi-marche-tech | https://tochigi-marche-tech.pages.dev | ネイビー×グラデーションのテックモダン |

各サイトの一番上に「デザイン案 n / 6」の帯を表示し、本体サイトへのリンクを置いている。
また、農家一覧の各カード・ハンバーガーメニューの「マップ」「出品者ログイン」は本体サイト
(tochigi-farm-market.pages.dev)側のページにリンクしている(このデザイン比較の対象はトップページのみのため)。

## 1つを選んだ後の片付け方

1. このリポジトリ側: `variants/` の中から、選ばなかった5フォルダを削除してコミット
   (`git rm -r variants/vX-yyy` のような形)。選んだデザインを本体([public/index.html](../public/index.html)・
   [public/styles.css](../public/styles.css))に反映する場合は、該当バリアントの index.html / styles.css の
   中身を public/ 側に移植する。
2. Cloudflare側: 使わないPagesプロジェクトを削除
   ```
   npx wrangler pages project delete <project-name>
   ```
   (例: `npx wrangler pages project delete tochigi-marche-editorial`)
   ダッシュボード(Cloudflare > Workers & Pages)から削除してもよい。
