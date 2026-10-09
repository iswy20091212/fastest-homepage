# fastest-homepage

阿部寛のホームページより速いサイトを目指した、TypeScript 製の静的サイト。
低速・高遅延・パケット損失のある回線（衛星直接通信など）でも使えることを目標にしている。

- HTML 1枚・1リクエスト。CSS/JS はインラインで、gzip 後 2KB 以内（超えるとビルドが失敗する）
- Service Worker により、2回目以降はキャッシュから即表示（圏外でも表示できる）
- 画像は AVIF の2サイズに自動変換し、本文の表示後に遅延読み込み。届くまでは埋め込みのぼかし画像を表示
- インラインの CSS/JS は CSP のハッシュで許可

## 使い方（Node.js 24 以上）

```bash
npm install
npm run build        # dist/ を生成
npm start            # http://localhost:8080/ でプレビュー
npm run bench -- https://iswy20091212.github.io/fastest-homepage/   # 阿部寛のHPと速度比較
```

## 画像を貼る

1. 元画像（JPEG/PNG など、大きいままでよい）を `images/` に置く
2. `src/page.ts` で `picture(images, "ファイル名.jpg", "代替テキスト", "i1")` を呼んでタグを入れる

`main` に push すると GitHub Actions がビルドして GitHub Pages に公開する。
