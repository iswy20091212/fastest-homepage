// 依存ゼロのプレビュー用 HTTP サーバー。dist/ の中身を起動時に読み込んで圧縮しておき、
// リクエスト時はヘッダーを見てメモリ上のバッファを返すだけにする。先に node src/build.ts を実行すること。
import { createServer } from "node:http";
import { readdirSync, readFileSync } from "node:fs";
import { brotliCompressSync, gzipSync, constants } from "node:zlib";
import { createHash } from "node:crypto";

const PORT = Number(process.env.PORT ?? 8080);
const root = new URL("../dist/", import.meta.url);
const types: Record<string, string> = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  avif: "image/avif",
};

type Entry = { type: string; etag: string; raw: Buffer; br?: Buffer; gz?: Buffer };
const files = new Map<string, Entry>();

for (const rel of readdirSync(root, { recursive: true, encoding: "utf8" })) {
  const ext = rel.split(".").pop() ?? "";
  if (!(ext in types)) continue;
  const raw = readFileSync(new URL(rel, root));
  const entry: Entry = { type: types[ext], etag: `"${createHash("sha1").update(raw).digest("base64url").slice(0, 16)}"`, raw };
  if (ext !== "avif") {
    entry.br = brotliCompressSync(raw, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } });
    entry.gz = gzipSync(raw, { level: 9 });
  }
  files.set("/" + rel.replaceAll("\\", "/"), entry);
}
files.set("/", files.get("/index.html")!);

const server = createServer((req, res) => {
  const f = files.get((req.url ?? "/").split("?")[0]);
  if (!f) {
    res.writeHead(404, { "content-length": 0 }).end();
    return;
  }
  const headers: Record<string, string | number> = { "content-type": f.type, etag: f.etag, vary: "accept-encoding" };
  if (req.headers["if-none-match"] === f.etag) {
    res.writeHead(304, headers).end();
    return;
  }
  const ae = req.headers["accept-encoding"] ?? "";
  let body = f.raw;
  if (f.br && ae.includes("br")) [body, headers["content-encoding"]] = [f.br, "br"];
  else if (f.gz && ae.includes("gzip")) [body, headers["content-encoding"]] = [f.gz, "gzip"];
  headers["content-length"] = body.length;
  res.writeHead(200, headers).end(req.method === "HEAD" ? undefined : body);
});

server.keepAliveTimeout = 65_000;
server.listen(PORT, () => console.log(`http://localhost:${PORT}/`));
