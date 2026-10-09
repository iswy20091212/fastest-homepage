// ブラウザで実測した読み込み性能を表示する。計測値はどこにも送信しない。
const $ = (id: string): HTMLElement => document.getElementById(id)!;

addEventListener("load", () => {
  // loadEventEnd は load ハンドラが終わってから確定するので次のタスクで読む
  setTimeout(() => {
    const n = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    $("t").textContent = String(Math.round(n.loadEventEnd - n.startTime));
    $("s").textContent = String(n.transferSize);
    $("r").textContent = String(n.transferSize ? 1 + performance.getEntriesByType("resource").length : 0);
  });
  // 表示が終わってから登録し、初回の帯域を奪わない
  navigator.serviceWorker?.register("sw.js");
});
