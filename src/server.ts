// 依存ゼロの HTTP サーバー。HTML は起動時に一度だけ生成・圧縮してメモリに置き、
// リクエスト時はヘッダーを見てバッファを返すだけにする。
import { createServer } from "node:http";
import { brotliCompressSync, gzipSync, constants } from "node:zlib";
import { createHash } from "node:crypto";
import { renderPage } from "./page.ts";

const PORT = Number(process.env.PORT ?? 8080);

const raw = Buffer.from(renderPage());
const br = brotliCompressSync(raw, {
  params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: raw.length },
});
const gz = gzipSync(raw, { level: 9 });
const etag = `"${createHash("sha1").update(raw).digest("base64url").slice(0, 16)}"`;

const baseHeaders = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "public, max-age=300, stale-while-revalidate=86400",
  etag,
  vary: "accept-encoding",
};
const variants = {
  br: { ...baseHeaders, "content-encoding": "br", "content-length": br.length },
  gzip: { ...baseHeaders, "content-encoding": "gzip", "content-length": gz.length },
  identity: { ...baseHeaders, "content-length": raw.length },
};

const server = createServer((req, res) => {
  if (req.url !== "/" && req.url !== "/index.html") {
    res.writeHead(404, { "content-length": 0 }).end();
    return;
  }
  if (req.headers["if-none-match"] === etag) {
    res.writeHead(304, { etag, "cache-control": baseHeaders["cache-control"] }).end();
    return;
  }
  const ae = req.headers["accept-encoding"] ?? "";
  if (ae.includes("br")) res.writeHead(200, variants.br).end(req.method === "HEAD" ? undefined : br);
  else if (ae.includes("gzip")) res.writeHead(200, variants.gzip).end(req.method === "HEAD" ? undefined : gz);
  else res.writeHead(200, variants.identity).end(req.method === "HEAD" ? undefined : raw);
});

server.keepAliveTimeout = 65_000;
server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}/  (raw ${raw.length} B / gzip ${gz.length} B / br ${br.length} B)`);
});
