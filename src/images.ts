// images/ の元画像を、低速回線向けに AVIF の2サイズ＋埋め込み用の極小プレースホルダーへ変換する。
// ファイル名に内容のハッシュを入れるので、Service Worker は永久にキャッシュしてよい。
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";

export type Img = {
  src: string;
  srcset: string;
  width: number;
  height: number;
  placeholder: string; // data URI（約100バイト）
  bytes: number[]; // 各サイズの転送量
};

const WIDTHS = [480, 960];

export async function processImages(srcDir: URL, outDir: URL): Promise<Map<string, Img>> {
  const result = new Map<string, Img>();
  let files: string[];
  try {
    files = readdirSync(srcDir).filter((f) => /\.(jpe?g|png|webp|avif|gif|tiff?)$/i.test(f));
  } catch {
    return result;
  }
  mkdirSync(outDir, { recursive: true });

  for (const file of files) {
    const input = readFileSync(new URL(file, srcDir));
    const hash = createHash("sha256").update(input).digest("hex").slice(0, 8);
    const base = file.replace(/\.[^.]+$/, "");
    const { width = 0, height = 0 } = await sharp(input).metadata();

    const variants: { name: string; w: number; size: number }[] = [];
    for (const w of WIDTHS.filter((w) => w < width).concat(width).slice(0, WIDTHS.length)) {
      const buf = await sharp(input).rotate().resize({ width: w }).avif({ quality: 45, effort: 6 }).toBuffer();
      const name = `img/${base}-${hash}-${w}.avif`;
      writeFileSync(new URL(name.slice(4), outDir), buf);
      variants.push({ name, w, size: buf.length });
    }

    const tiny = await sharp(input).rotate().resize({ width: 12 }).webp({ quality: 30 }).toBuffer();
    result.set(file, {
      src: variants[0].name,
      srcset: variants.map((v) => `${v.name} ${v.w}w`).join(","),
      width,
      height,
      placeholder: `data:image/webp;base64,${tiny.toString("base64")}`,
      bytes: variants.map((v) => v.size),
    });
  }
  return result;
}
