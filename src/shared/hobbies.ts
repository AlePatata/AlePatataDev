// Tipos de la API pública de hobbies, compartidos entre la página y el Worker.

export const HOBBY_SOURCES = ['codeforces', 'monkeytype', 'trakt', 'wordle', 'cube'] as const;

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
