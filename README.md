# fastest-homepage

阿部寛のホームページより速いサイトを目指した、TypeScript 製の静的サイト。

- 画像・外部CSS・外部JS・Webフォントなし。HTML 1枚・1リクエストで表示が完結
- ビルドもサーバーも Node.js 標準機能のみ（実行時の依存パッケージゼロ）
- インラインの CSS/JS は CSP のハッシュで許可

## 使い方（Node.js 24 以上）

```bash
node src/build.ts    # dist/index.html を生成
node src/server.ts   # http://localhost:8080/ でプレビュー（brotli/gzip 配信）
node src/bench.ts https://iswy20091212.github.io/fastest-homepage/   # 阿部寛のHPと速度比較
```

`main` に push すると GitHub Actions がビルドして GitHub Pages に公開します。
