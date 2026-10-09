// ページを1枚の HTML に組み立てる。低速・高遅延・パケット損失のある回線でも最初の数パケットで届くよう、
// gzip 後 2KB 前後に収める。CSS/JS はインライン、画像は遅延読み込みで本文の表示を待たせない。
// クライアント側の TypeScript は Node 標準の stripTypeScriptTypes で JS にする。
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import type { Img } from "./images.ts";

const REPO = "https://github.com/iswy20091212/fastest-homepage";
const ABE = "http://abehiroshi.la.coocan.jp/";

const features: [string, string][] = [
  ["1リクエスト", "CSS・JS は HTML に内蔵。追加の通信なし。"],
  ["圏外でも表示", "2回目からは保存済みの版を通信ゼロで表示。"],
  ["画像は後から", "AVIF で本文の後に読み込み。届くまではぼかし。"],
];

const css = `
*{box-sizing:border-box;margin:0}
body{max-width:66rem;margin:auto;padding:12vh 1.25rem 2rem;background:radial-gradient(50vmax 35vmax at 10% 0,#8b6cff45,#0000 70%),radial-gradient(40vmax 30vmax at 95% 20%,#22d3ee26,#0000 70%) #07070c no-repeat;color:#ececf3;font:16px/1.7 system-ui,sans-serif}
h1{margin:1rem 0;font-size:clamp(2.5rem,8.5vw,5.5rem);line-height:1.1;letter-spacing:-.04em}
.x{background:linear-gradient(90deg,#8b6cff,#22d3ee,#ff5c9a);-webkit-background-clip:text;background-clip:text;color:#0000}
p,small,footer{color:#9b9bb0}
.m,.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(9rem,1fr));gap:1px;margin:3rem 0;border-radius:20px;overflow:hidden;background:#ffffff17;border:1px solid #ffffff17}
.g{grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))}
.m div,.g div{padding:1.2rem 1.4rem;background:#0b0b12}
b{display:block;font-size:1.1rem}
.m b{font-size:clamp(1.7rem,4.5vw,2.5rem)}
img{display:block;width:100%;height:auto;border-radius:20px;background-size:cover}
a{color:inherit}
footer{display:flex;flex-wrap:wrap;justify-content:space-between;margin-top:3rem;font-size:.85rem}
`;

const minifyCss = (s: string): string =>
  s.replace(/\s+/g, " ").replace(/\s*([{};,>])\s*/g, "$1").replace(/;}/g, "}").trim();

// 型を消した JS から空行・行頭空白・行コメントだけを落とす（改行は残すので ASI を壊さない）
export const minifyJs = (s: string): string =>
  s.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("//")).join("\n");

export const compileTs = (file: string): string =>
  minifyJs(stripTypeScriptTypes(readFileSync(new URL(file, import.meta.url), "utf8")));

const sha256 = (s: string): string => `'sha256-${createHash("sha256").update(s).digest("base64")}'`;

// 画像タグ。プレースホルダーは CSP で許可した <style> 側に置く（style 属性は CSP で禁止しているため）
function picture(images: Map<string, Img>, file: string, alt: string, cls: string): { tag: string; css: string } {
  const img = images.get(file);
  if (!img) throw new Error(`images/${file} が見つかりません`);
  return {
    tag: `<img class=${cls} src=${img.src} srcset="${img.srcset}" width=${img.width} height=${img.height} alt="${alt}" loading=lazy decoding=async>`,
    css: `.${cls}{background-image:url(${img.placeholder})}`,
  };
}

function html(style: string, script: string, hero: string, gzBytes: number): string {
  const csp = [
    "default-src 'none'",
    `style-src ${sha256(style)}`,
    `script-src ${sha256(script)}`,
    "img-src 'self' data:",
    "worker-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join(";");
  const cards = features.map(([t, d]) => `<div><b>${t}</b><small>${d}</small></div>`).join("");
  return `<!doctype html>
<html lang=ja>
<meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<meta http-equiv=Content-Security-Policy content="${csp}">
<meta name=description content="阿部寛のホームページより速いサイト">
<link rel=icon href=data:,>
<title>阿部寛のHPより速いサイト</title>
<style>@STYLE@</style>
<h1>阿部寛のHPより、<br><span class=x>速く。</span></h1>
<p>HTML 1枚・1リクエスト。2回目からは圏外でも通信ゼロで表示します。</p>
<section class=m>
  <div><b id=t>-</b><small>表示時間 ms</small></div>
  <div><b id=s>-</b><small>転送量 B</small></div>
  <div><b id=r>-</b><small>通信回数</small></div>
  <div><b>${gzBytes}</b><small>HTML 圧縮後 B</small></div>
</section>
<section class=g>${cards}</section>
${hero}
<footer>
  <a href="${ABE}" rel="noopener noreferrer">目標：阿部寛のホームページ</a>
  <a href="${REPO}" rel="noopener noreferrer">ソースコード</a>
</footer>
<script>@SCRIPT@</script>`
    .replace(/\n\s*/g, "")
    .replace(/>\s+</g, "><")
    // CSS/JS は空白処理の後に差し込む（JS の改行を消すと ASI が壊れ、CSP ハッシュもずれる）
    .replace("@STYLE@", () => style)
    .replace("@SCRIPT@", () => script);
}

export function renderPage(images: Map<string, Img>): string {
  const hero = picture(images, "sample.jpg", "サンプル画像（抽象画）", "i0");
  const style = minifyCss(css) + hero.css;
  const script = compileTs("./client.ts");
  // 表示する圧縮後サイズは自分自身を含むので、値が落ち着くまで作り直す
  let size = 0;
  let out = "";
  for (let i = 0; i < 8; i++) {
    out = html(style, script, hero.tag, size);
    const next = gzipSync(out, { level: 9 }).length;
    if (next === size) break;
    size = next;
  }
  return out;
}
