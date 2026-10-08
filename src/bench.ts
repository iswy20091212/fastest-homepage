// 自作サイトと阿部寛のホームページを同じ条件（fetch, br/gzip 許可）で計測して比べる。
// 使い方: node src/bench.ts [自サイトURL] [回数]
const mine = process.argv[2] ?? "http://localhost:8080/";
const runs = Number(process.argv[3] ?? 20);
const abe = "http://abehiroshi.la.coocan.jp/";

async function measure(url: string): Promise<{ ms: number; bytes: number }> {
  const t0 = performance.now();
  const res = await fetch(url, { headers: { "accept-encoding": "br, gzip" }, cache: "no-store" });
  const body = await res.arrayBuffer();
  return { ms: performance.now() - t0, bytes: body.byteLength };
}

async function bench(label: string, url: string): Promise<void> {
  await measure(url); // ウォームアップ（DNS・TLS・接続確立）
  const times: number[] = [];
  let bytes = 0;
  for (let i = 0; i < runs; i++) {
    const r = await measure(url);
    times.push(r.ms);
    bytes = r.bytes;
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  console.log(`${label.padEnd(10)} median ${median.toFixed(2)} ms  min ${times[0].toFixed(2)} ms  HTML ${bytes} B`);
}

await bench("自作", mine);
await bench("阿部寛", abe);
