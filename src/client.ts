// ブラウザで実測した読み込み性能を表示する。計測値はどこにも送信しない。
const el = (id: string): HTMLElement => document.getElementById(id)!;

function countUp(id: string, value: number): void {
  const start = performance.now();
  const tick = (now: number): void => {
    const p = Math.min((now - start) / 700, 1);
    el(id).textContent = Math.round(value * (1 - (1 - p) ** 3)).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

addEventListener("load", () => {
  // loadEventEnd は load ハンドラが終わってから確定するので次のタスクで読む
  setTimeout(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return;
    countUp("t", nav.loadEventEnd - nav.startTime);
    // キャッシュから読んだ場合 transferSize は 0 になるので本文サイズを出す
    countUp("s", nav.transferSize || nav.encodedBodySize);
    countUp("r", 1 + performance.getEntriesByType("resource").length);
  });
});
