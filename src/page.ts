// ページを1枚の HTML に組み立てる。画像・外部CSS・外部JS・Webフォントは使わず、1リクエストで完結させる。
// クライアント側の TypeScript は Node 標準の stripTypeScriptTypes で JS にしてインライン化する（依存ゼロ）。
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { createHash } from "node:crypto";

const REPO = "https://github.com/iswy20091212/fastest-homepage";
const ABE = "http://abehiroshi.la.coocan.jp/";

const features: [string, string][] = [
  ["1リクエストで完結", "CSS と JS は HTML にインライン。favicon も data URI で埋め込み、追加の通信は発生しません。"],
  ["画像ゼロ", "背景のグロウもグリッドも、すべて CSS グラデーションで描いています。"],
  ["Webフォントなし", "OS 標準フォントを使うので、フォントの読み込み待ちがありません。"],
  ["ビルド時に最小化", "TypeScript から HTML・CSS・JS を生成し、空白やコメントを削ってから配信します。"],
  ["CSP で守る", "Content-Security-Policy で、ハッシュが一致するインラインコードだけを実行・適用します。"],
  ["依存パッケージゼロ", "ビルドもサーバーも Node.js の標準機能だけ。npm install は不要です。"],
];

const css = `
:root{--bg:#07070c;--fg:#ececf3;--mut:#9b9bb0;--card:rgba(255,255,255,.035);--line:rgba(255,255,255,.08);--a1:#8b6cff;--a2:#22d3ee;--a3:#ff5c9a;color-scheme:dark}
@media (prefers-color-scheme:light){:root{--bg:#f6f6fa;--fg:#15151d;--mut:#5d5d72;--card:rgba(255,255,255,.65);--line:rgba(20,20,45,.09);color-scheme:light}}
*{box-sizing:border-box;margin:0}
body{min-height:100vh;background:var(--bg);color:var(--fg);font:16px/1.75 system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans JP",Meiryo,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
body:before,body:after{content:"";position:fixed;z-index:-1;pointer-events:none}
body:before{inset:-25vmax;background:radial-gradient(38vmax 38vmax at 25% 15%,rgba(139,108,255,.32),transparent 62%),radial-gradient(32vmax 32vmax at 80% 30%,rgba(34,211,238,.2),transparent 62%),radial-gradient(30vmax 30vmax at 55% 90%,rgba(255,92,154,.16),transparent 62%);animation:f 20s ease-in-out infinite alternate}
body:after{inset:0;background:linear-gradient(var(--line) 1px,transparent 1px) 0 0/56px 56px,linear-gradient(90deg,var(--line) 1px,transparent 1px) 0 0/56px 56px;-webkit-mask-image:radial-gradient(ellipse 80% 60% at 50% 0,#000 20%,transparent 75%);mask-image:radial-gradient(ellipse 80% 60% at 50% 0,#000 20%,transparent 75%)}
@keyframes f{to{transform:translate3d(-5%,4%,0) rotate(10deg)}}
main,footer{max-width:66rem;margin:auto;padding-left:1.25rem;padding-right:1.25rem}
main{padding-top:clamp(3.5rem,12vh,8rem);padding-bottom:4rem}
.b{display:inline-flex;align-items:center;gap:.6em;padding:.3em .9em;border:1px solid var(--line);border-radius:99px;background:var(--card);font-size:.78rem;color:var(--mut);letter-spacing:.02em}
.b i{width:.5em;height:.5em;border-radius:50%;background:#34e3a0;box-shadow:0 0 10px #34e3a0}
h1{margin:1.4rem 0 1.2rem;font-size:clamp(2.5rem,8.5vw,5.8rem);line-height:1.08;letter-spacing:-.045em;font-weight:800}
.x{background:linear-gradient(100deg,var(--a1),var(--a2) 50%,var(--a3));-webkit-background-clip:text;background-clip:text;color:transparent}
.l{max-width:34em;color:var(--mut);font-size:clamp(1rem,2.2vw,1.18rem)}
.m{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,9.5rem),1fr));gap:1px;margin:3.5rem 0 5rem;border:1px solid var(--line);border-radius:22px;overflow:hidden;background:var(--line)}
.m div{padding:clamp(1.1rem,3vw,1.5rem) clamp(1.1rem,3vw,1.6rem);background:color-mix(in srgb,var(--bg) 88%,transparent)}
.m b{display:block;font-size:clamp(1.7rem,4.5vw,2.7rem);line-height:1.2;font-weight:750;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.m small{font-size:.85rem;color:var(--mut)}
.m u{text-decoration:none;font-size:1rem;margin-left:.2em;color:var(--mut);font-weight:500}
h2{font-size:clamp(1.5rem,3.2vw,2rem);letter-spacing:-.025em;margin-bottom:1.6rem}
.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr));gap:1rem;margin-bottom:5rem}
.g article{padding:1.6rem;border:1px solid var(--line);border-radius:18px;background:var(--card);transition:transform .3s,border-color .3s}
.g article:hover{transform:translateY(-4px);border-color:color-mix(in srgb,var(--a1) 55%,transparent)}
.g em{font:600 .8rem ui-monospace,SFMono-Regular,Consolas,monospace;font-style:normal}
.g h3{font-size:1.08rem;margin:.5rem 0 .4rem}
.g p{font-size:.93rem;color:var(--mut)}
.c{padding:clamp(1.8rem,5vw,3rem);border:1px solid var(--line);border-radius:24px;background:linear-gradient(135deg,color-mix(in srgb,var(--a1) 14%,transparent),color-mix(in srgb,var(--a2) 8%,transparent))}
.c p{max-width:38em;color:var(--mut);margin-bottom:1.3rem}
.k{display:inline-block;padding:.65em 1.3em;border-radius:12px;background:var(--fg);color:var(--bg);font-weight:650;text-decoration:none;transition:transform .2s}
.k:hover{transform:translateY(-2px)}
footer{display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;padding-top:2rem;padding-bottom:3rem;border-top:1px solid var(--line);color:var(--mut);font-size:.85rem}
footer a{color:inherit;text-underline-offset:3px}
a:focus-visible{outline:2px solid var(--a2);outline-offset:3px}
@media (prefers-reduced-motion:reduce){*,:before{animation:none!important;transition:none!important}}
`;

const minifyCss = (s: string): string =>
  s.replace(/\s+/g, " ").replace(/\s*([{};,>])\s*/g, "$1").replace(/;}/g, "}").trim();

// 型を消した JS から空行・行頭空白・行コメントだけを落とす（改行は残すので ASI を壊さない）
const minifyJs = (s: string): string =>
  s.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("//")).join("\n");

const sha256 = (s: string): string => `'sha256-${createHash("sha256").update(s).digest("base64")}'`;

function html(style: string, script: string, htmlBytes: number): string {
  const csp = [
    "default-src 'none'",
    `style-src ${sha256(style)}`,
    `script-src ${sha256(script)}`,
    "img-src data:",
    "base-uri 'none'",
    "form-action 'none'",
  ].join(";");
  const cards = features
    .map(([t, d], i) => `<article><em class=x>0${i + 1}</em><h3>${t}</h3><p>${d}</article>`)
    .join("");
  return `<!doctype html>
<html lang=ja>
<meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<meta http-equiv=Content-Security-Policy content="${csp}">
<meta name=referrer content=no-referrer>
<meta name=description content="画像なし・外部ファイルなし・1リクエスト。TypeScript で作った、阿部寛のホームページより速いサイト。">
<meta name=theme-color content=#07070c>
<link rel=icon href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ctext y='14' font-size='14'%3E⚡%3C/text%3E%3C/svg%3E">
<title>阿部寛のHPより速いサイト</title>
<style>@STYLE@</style>
<main>
  <span class=b><i></i>1 request · 0 images · 0 dependencies</span>
  <h1>阿部寛のHPより、<br><span class=x>速く。</span></h1>
  <p class=l>画像なし、外部ファイルなし、Webフォントなし。HTML 1枚・1リクエストで表示が完結する、TypeScript 製の静的サイトです。</p>
  <section class=m aria-label="このページの実測値">
    <div><b><span id=t>—</span><u>ms</u></b><small>表示完了までの時間</small></div>
    <div><b><span id=s>—</span><u>B</u></b><small>転送量</small></div>
    <div><b id=r>—</b><small>リクエスト数</small></div>
    <div><b>${htmlBytes.toLocaleString()}<u>B</u></b><small>HTML 全体（圧縮前）</small></div>
  </section>
  <h2>速さの理由</h2>
  <section class=g>${cards}</section>
  <section class=c>
    <h2>目標にしたサイト</h2>
    <p>フレームとテキストと画像だけで作られた、驚くほど軽いことで有名なホームページです。上の数字は、いま開いているこのページをあなたのブラウザで実測した値です。</p>
    <a class=k href="${ABE}" rel="noopener noreferrer">阿部寛のホームページを見る →</a>
  </section>
</main>
<footer>
  <span>© 2026 · Built with TypeScript</span>
  <a href="${REPO}" rel="noopener noreferrer">ソースコード (GitHub)</a>
</footer>
<script>@SCRIPT@</script>`
    .replace(/\n\s*/g, "")
    .replace(/>\s+</g, "><")
    // CSS/JS は空白処理の後に差し込む（JS の改行を消すと ASI が壊れ、CSP ハッシュもずれる）
    .replace("@STYLE@", () => style)
    .replace("@SCRIPT@", () => script);
}

export function renderPage(): string {
  const style = minifyCss(css);
  const ts = readFileSync(new URL("./client.ts", import.meta.url), "utf8");
  const script = minifyJs(stripTypeScriptTypes(ts));
  // 表示する HTML サイズは自分自身を含むので、桁数が落ち着くまで作り直す
  let size = 0;
  let out = "";
  for (let i = 0; i < 5; i++) {
    out = html(style, script, size);
    const next = Buffer.byteLength(out);
    if (next === size) break;
    size = next;
  }
  return out;
}
