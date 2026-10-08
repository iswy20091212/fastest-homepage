// GitHub Pages 用に dist/index.html を書き出す。
import { mkdirSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { renderPage } from "./page.ts";

const out = new URL("../dist/", import.meta.url);
const html = renderPage();
mkdirSync(out, { recursive: true });
writeFileSync(new URL("index.html", out), html);
console.log(`dist/index.html  ${Buffer.byteLength(html)} B (gzip ${gzipSync(html, { level: 9 }).length} B)`);
