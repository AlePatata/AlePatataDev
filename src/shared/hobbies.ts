// Tipos de la API pública de hobbies, compartidos entre la página y el Worker.

export const HOBBY_SOURCES = ['codeforces', 'monkeytype', 'trakt', 'wordle', 'cube', 'claude'] as const;

export type HobbySource = (typeof HOBBY_SOURCES)[number];

export interface ActivityDay {
  date: string; // yyyy-mm-dd, hora de Chile
  source: HobbySource;
  count: number;
  summary: string | null;
}

/** `GET /api/public/hobbies` */
export interface HobbiesResponse {
  from: string; // primer día incluido
  to: string; // hoy
  days: ActivityDay[];
  connected: HobbySource[]; // las que ya traen datos; las demás muestran "Pronto"
}

/** Color de cada letra: G = en su lugar, Y = está en otro lugar, B = no está. */
export type WordleRow = string; // ej. "GYBBB"

/** Un Wordle jugado. Nunca trae letras: ni mis intentos ni la solución. */
export interface WordleDay {
  number: number; // 1949
  date: string; // yyyy-mm-dd
  result: number | null; // intentos; null = perdido
  hardMode: boolean;
  rows: WordleRow[];
}

export interface WordleStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[]; // victorias en 1…6 intentos (índice 0 = 1 intento)
}

/** `GET /api/public/hobbies/wordle` */
export interface WordleDetail {
  todayNumber: number;
  today: WordleDay | null; // null si todavía no lo juego (o no se ha sincronizado)
  recent: WordleDay[]; // los últimos días jugados, el más reciente primero (sin hoy)
  stats: WordleStats;
}

/** Estado de la sincronización de una fuente, para Ajustes. */
export interface SyncStatus {
  source: HobbySource;
  lastSync: string | null; // ISO, última vez que funcionó
  lastError: string | null; // null si la última vez funcionó
  updatedAt: string | null;
}

/** Un test de Monkeytype (sin el uid de la cuenta). */
export interface TypingTest {
  id: string;
  timestamp: number; // ms
  date: string; // yyyy-mm-dd, hora de Chile
  wpm: number;
  raw: number;
  acc: number; // %
  consistency: number; // %
  mode: string; // time, words, quote…
  mode2: string; // 30, 50…
}

export interface TypingPb {
  mode: 'time' | 'words';
  mode2: string; // "30" (segundos) o "50" (palabras)
  wpm: number;
  acc: number;
  date: string;
}

/** `GET /api/public/hobbies/monkeytype` */
export interface MonkeytypeDetail {
  pbs: TypingPb[];
  completedTests: number;
  startedTests: number;
  secondsTyping: number;
  streak: { current: number; max: number };
  last10: { wpm: number; acc: number } | null; // promedio de los últimos 10 tests
  tests: TypingTest[]; // los últimos 100, del más antiguo al más reciente
}

/** Una media: ms, 'DNF', o null si todavía no hay suficientes resoluciones. */
export type CubeAverage = number | 'DNF' | null;

/** Una resolución de csTimer (sin scramble ni comentario). */
export interface CubeSolve {
  timestamp: number; // s
  date: string; // yyyy-mm-dd, hora de Chile
  ms: number; // ya incluye el +2
  penalty: 0 | 1 | 2; // 0 nada, 1 +2, 2 DNF
}

/** Estadísticas de un puzzle (todas sus sesiones juntas). */
export interface CubePuzzle {
  puzzle: string; // scrType de csTimer: '333', '222so'…
  label: string; // "3x3"
  count: number;
  dnfs: number;
  best: number | null; // mejor single
  current: { ao5: CubeAverage; ao12: CubeAverage; ao100: CubeAverage };
  bests: { ao5: CubeAverage; ao12: CubeAverage; ao100: CubeAverage };
  solves: CubeSolve[]; // los últimos 100, del más antiguo al más reciente
}

/** `GET /api/public/hobbies/cube` */
export interface CubeDetail {
  puzzles: CubePuzzle[]; // el más resuelto primero
}

/** Una feature: un merge a main y los commits que trajo. */
export interface VibeFeature {
  branch: string; // "cstimer"
  date: string; // yyyy-mm-dd, hora de Chile
  sha: string; // del merge
  commits: string[]; // primera línea de cada commit, del más antiguo al más reciente
}

/** `GET /api/public/hobbies/claude` */
export interface VibeDetail {
  totals: { commits: number; withClaude: number; features: number; days: number; since: string | null };
  features: VibeFeature[]; // las últimas 12, la más reciente primero
  recent: { sha: string; date: string; subject: string }[]; // los últimos 10 commits con Claude
}

/** Tiempo para leer: "55,31" o "1:02,34". */
export function formatTime(ms: number): string {
  const cs = Math.round(ms / 10);
  const seconds = (cs % 6000) / 100;
  const minutes = Math.floor(cs / 6000);
  const s = seconds.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return minutes ? `${minutes}:${seconds < 10 ? '0' : ''}${s}` : s;
}
