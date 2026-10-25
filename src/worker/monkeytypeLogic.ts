import type { TypingPb, TypingTest } from '../shared/hobbies';

/** Fecha en Chile de un instante en ms. */
export const dateInChile = (ms: number) => new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'America/Santiago' });

/** Resultado tal como lo entrega `GET /results`. */
export interface ApiResult {
  _id: string;
  uid?: string;
  wpm: number;
  rawWpm: number;
  acc: number;
  consistency?: number;
  mode: string;
  mode2: string;
  timestamp: number;
}

/** Se queda con lo que se muestra; el uid de la cuenta no se guarda. */
export const toTypingTest = (r: ApiResult): TypingTest => ({
  id: r._id,
  timestamp: r.timestamp,
  date: dateInChile(r.timestamp),
  wpm: r.wpm,
  raw: r.rawWpm,
  acc: r.acc,
  consistency: r.consistency ?? 0,
  mode: r.mode,
  mode2: r.mode2,
});

const oneDecimal = (n: number) => Math.round(n * 10) / 10;
const formatWpm = (n: number) => oneDecimal(n).toLocaleString('es-CL');

/** Un día del heatmap: "18 tests, máx 55,6 wpm". */
export function typingDaySummary(count: number, maxWpm: number): string {
  return `${count} ${count === 1 ? 'test' : 'tests'}, máx ${formatWpm(maxWpm)} wpm`;
}

/** Promedio de los últimos `n` tests (los recibe en orden cronológico). */
export function lastAverage(tests: TypingTest[], n = 10): { wpm: number; acc: number } | null {
  const last = tests.slice(-n);
  if (!last.length) return null;
  const avg = (f: (t: TypingTest) => number) => oneDecimal(last.reduce((s, t) => s + f(t), 0) / last.length);
  return { wpm: avg((t) => t.wpm), acc: avg((t) => t.acc) };
}

/** PB como los entrega `GET /users/personalBests?mode=…`: una lista por duración/cantidad. */
export type ApiPbs = Record<string, { wpm: number; acc: number; timestamp: number }[]>;

/** El mejor PB de cada duración o cantidad (hay uno por idioma, puntuación, etc.), ordenados. */
export function bestPbs(mode: TypingPb['mode'], pbs: ApiPbs | null | undefined): TypingPb[] {
  return Object.entries(pbs ?? {})
    .flatMap(([mode2, list]) => {
      const best = [...list].sort((a, b) => b.wpm - a.wpm)[0];
      return best ? [{ mode, mode2, wpm: oneDecimal(best.wpm), acc: oneDecimal(best.acc), date: dateInChile(best.timestamp) }] : [];
    })
    .sort((a, b) => Number(a.mode2) - Number(b.mode2));
}
