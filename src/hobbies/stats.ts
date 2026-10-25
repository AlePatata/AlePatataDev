/** Media móvil de `n` (los primeros puntos promedian lo que hay hasta ahí). */
export function movingAverage(values: number[], n = 10): number[] {
  return values.map((_, i) => {
    const window = values.slice(Math.max(0, i - n + 1), i + 1);
    return window.reduce((s, v) => s + v, 0) / window.length;
  });
}
