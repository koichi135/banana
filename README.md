# Banana Game

ブラウザで遊べる落ちものゲームです。

- 3Dチルト演出付きの盤面
- ライムグリーンのグリッド
- フルーツを簡易ポリゴン風に描画

`index.html` をブラウザで開くとプレイできます。

## GitHub Pages 自動公開

このリポジトリには GitHub Actions の `Deploy to GitHub Pages` ワークフローを追加しています。

- `main` または `master` へ push すると自動でデプロイ
- Actions タブから手動実行 (`workflow_dispatch`) も可能

初回のみ、リポジトリの **Settings → Pages** で Build and deployment の Source を **GitHub Actions** にしてください。
