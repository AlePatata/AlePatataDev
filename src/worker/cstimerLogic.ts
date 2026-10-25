import { formatTime, type CubeAverage, type CubePuzzle, type CubeSolve } from '../shared/hobbies';
import { dateInChile } from './monkeytypeLogic';

/** Un tiempo tal como lo guarda csTimer: `[[penalización, ms, …fases], scramble, comentario, fecha en s]`. */
export type CsTime = [number[], string, string, number, ...unknown[]];

/** Una sesión del respaldo: de dónde sacar sus tiempos y qué puzzle es. */
export interface CsSession {
  key: string; // 'session1'
  name: string;
  puzzle: string; // scrType; sin él, csTimer usa 3x3
  slices: string[]; // hashes de tandas de 1000 tiempos ('slice' + hash en el servidor)
  inline: CsTime[]; // respaldos viejos traen los tiempos directo
}

interface SessionData {
  name?: string | number;
  opt?: { scrType?: string };
}

/** Lee el objeto principal (ya descomprimido): sus sesiones y las tandas que hay que pedir. */
export function parseBackup(backup: Record<string, unknown>): CsSession[] {
  const props = (backup.properties ?? {}) as { sessionData?: string | Record<string, SessionData> };
  const raw = props.sessionData ?? {};
  const sessionData: Record<string, SessionData> = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return Object.entries(backup)
    .filter(([key, value]) => /^session\d+$/.test(key) && Array.isArray(value) && value.length > 0)
    .map(([key, value]) => {
      const list = value as unknown[];
      const data = sessionData[key.slice('session'.length)] ?? {};
      const isInline = Array.isArray(list[0]);
      return {
        key,
        name: String(data.name ?? key.slice('session'.length)),
        puzzle: data.opt?.scrType || '333',
        slices: isInline ? [] : (list as string[]),
        inline: isInline ? (list as CsTime[]) : [],
      };
    });
}

/** Penalización de csTimer: 0 nada, 2000 = +2 (se suma al tiempo), -1 = DNF. */
export function toSolve(t: CsTime): CubeSolve {
  const [penalty, ms] = t[0];
  return {
    timestamp: t[3],
    date: dateInChile(t[3] * 1000),
    ms: penalty > 0 ? ms + penalty : ms,
    penalty: penalty === -1 ? 2 : penalty > 0 ? 1 : 0,
  };
}

const value = (s: CubeSolve) => (s.penalty === 2 ? Infinity : s.ms);
const toAverage = (v: number): CubeAverage => (v === Infinity ? 'DNF' : Math.round(v));

/**
 * Media según la WCA de `solves` (todas): se saca el 5 % más rápido y el más lento (redondeado hacia
 * arriba, así ao5 y ao12 sacan uno de cada lado). Un DNF cuenta como el peor; si quedan DNF, es DNF.
 */
function wcaMean(values: number[]): number {
  const trim = Math.ceil(values.length * 0.05);
  const kept = [...values].sort((a, b) => a - b).slice(trim, values.length - trim);
  return kept.reduce((s, v) => s + v, 0) / kept.length;
}

/** Media de las últimas `n` resoluciones (en orden cronológico), o null si no alcanzan. */
export function currentAverage(solves: CubeSolve[], n: number): CubeAverage {
  if (solves.length < n) return null;
  return toAverage(wcaMean(solves.slice(-n).map(value)));
}

/** La mejor media de `n` seguidas de toda la historia, o null si no alcanzan. */
export function bestAverage(solves: CubeSolve[], n: number): CubeAverage {
  if (solves.length < n) return null;
  const values = solves.map(value);
  let best = Infinity;
  for (let i = n; i <= values.length; i++) best = Math.min(best, wcaMean(values.slice(i - n, i)));
  return toAverage(best);
}

const LABELS: Record<string, string> = {
  '333': '3x3',
  '222so': '2x2',
  '444wca': '4x4',
  '555wca': '5x5',
  '666wca': '6x6',
  '777wca': '7x7',
  '333oh': '3x3 una mano',
  '333ni': '3x3 a ciegas',
  pyrso: 'Pyraminx',
  skbso: 'Skewb',
  mgmp: 'Megaminx',
  clkwca: 'Clock',
  sqrs: 'Square-1',
};

export const puzzleLabel = (puzzle: string, sessionName?: string) => LABELS[puzzle] ?? sessionName ?? puzzle;

/** Estadísticas de cada puzzle, el más resuelto primero. `sessions` van con sus tiempos ya leídos. */
export function buildPuzzles(sessions: { puzzle: string; name: string; solves: CubeSolve[] }[]): CubePuzzle[] {
  const byPuzzle = new Map<string, { name: string; solves: CubeSolve[] }>();
  for (const s of sessions) {
    const entry = byPuzzle.get(s.puzzle) ?? { name: s.name, solves: [] };
    entry.solves.push(...s.solves);
    byPuzzle.set(s.puzzle, entry);
  }
  return [...byPuzzle.entries()]
    .filter(([, { solves }]) => solves.length > 0)
    .map(([puzzle, { name, solves: unsorted }]) => {
      const solves = [...unsorted].sort((a, b) => a.timestamp - b.timestamp);
      const valid = solves.filter((s) => s.penalty !== 2);
      return {
        puzzle,
        label: puzzleLabel(puzzle, name),
        count: solves.length,
        dnfs: solves.length - valid.length,
        best: valid.length ? Math.min(...valid.map((s) => s.ms)) : null,
        current: { ao5: currentAverage(solves, 5), ao12: currentAverage(solves, 12), ao100: currentAverage(solves, 100) },
        bests: { ao5: bestAverage(solves, 5), ao12: bestAverage(solves, 12), ao100: bestAverage(solves, 100) },
        solves: solves.slice(-100),
      };
    })
    .sort((a, b) => b.count - a.count);
}

/** Un día del heatmap por fecha: "15 de 3x3, mejor 55,31 s" o "20 resoluciones (3x3, 2x2)". */
export function cubeDays(solves: (CubeSolve & { label: string })[]): { date: string; count: number; summary: string }[] {
  const byDate = new Map<string, (CubeSolve & { label: string })[]>();
  for (const s of solves) {
    const day = byDate.get(s.date) ?? [];
    day.push(s);
    byDate.set(s.date, day);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, day]) => {
      const labels = [...new Set(day.map((s) => s.label))];
      if (labels.length > 1) return { date, count: day.length, summary: `${day.length} resoluciones (${labels.join(', ')})` };
      const valid = day.filter((s) => s.penalty !== 2);
      const best = valid.length ? `, mejor ${formatTime(Math.min(...valid.map((s) => s.ms)))} s` : '';
      return { date, count: day.length, summary: `${day.length} de ${labels[0]}${best}` };
    });
}
