// GitHub Pages 用に dist/ を書き出す（index.html・sw.js・img/）。
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { processImages } from "./images.ts";
import { renderPage, compileTs } from "./page.ts";

// 回線が細くても最初の数パケットで HTML が届くように、圧縮後サイズの上限を決めておく
const BUDGET = 2048;

const out = new URL("../dist/", import.meta.url);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const images = await processImages(new URL("../images/", import.meta.url), new URL("img/", out));
const html = renderPage(images);
writeFileSync(new URL("index.html", out), html);
writeFileSync(new URL("sw.js", out), compileTs("./sw.ts"));

const gz = gzipSync(html, { level: 9 }).length;
console.log(`index.html  ${Buffer.byteLength(html)} B (gzip ${gz} B / 予算 ${BUDGET} B)`);
for (const [name, img] of images) console.log(`${name}  AVIF ${img.bytes.join(" B / ")} B`);
if (gz > BUDGET) {
  console.error(`HTML が予算を ${gz - BUDGET} B 超えています`);
  process.exit(1);
}
