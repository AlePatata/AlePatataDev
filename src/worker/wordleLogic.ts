import type { WordleDay, WordleRow, WordleStats } from '../shared/hobbies';

/** El Wordle 0 fue el 2021-06-19. */
const EPOCH = Date.UTC(2021, 5, 19);
const DAY_MS = 86_400_000;

export const wordleNumber = (date: string) => Math.round((Date.parse(`${date}T00:00:00Z`) - EPOCH) / DAY_MS);
export const wordleDate = (number: number) => new Date(EPOCH + number * DAY_MS).toISOString().slice(0, 10);

/**
 * Colores de un intento, como los pinta Wordle: primero los verdes y después los amarillos, gastando
 * cada letra de la solución una sola vez (así una letra repetida no se pinta de más).
 */
export function scoreGuess(guess: string, solution: string): WordleRow {
  const g = guess.toLowerCase();
  const left: (string | null)[] = [...solution.toLowerCase()];
  const colors = [...g].map((c, i) => {
    if (c === left[i]) {
      left[i] = null;
      return 'G';
    }
    return null;
  });
  return colors
    .map((color, i) => {
      if (color) return color;
      const j = left.indexOf(g[i]);
      if (j === -1) return 'B';
      left[j] = null;
      return 'Y';
    })
    .join('');
}

/** Partida guardada de la NYT (`/svc/games/state/wordleV2/latests`). */
export interface NytWordleState {
  puzzle_id: string | number;
  game_data?: {
    boardState?: string[];
    currentRowIndex?: number | null;
    hardMode?: boolean | null;
    status?: string;
  };
}

/** Puzzle del día de la NYT (`/svc/wordle/v2/aaaa-mm-dd.json`). */
export interface NytWordlePuzzle {
  id: number;
  solution: string;
  print_date: string;
  days_since_launch: number;
}

/** Convierte la partida en un Wordle con solo colores; `null` si no está terminada. */
export function toWordleDay(puzzle: NytWordlePuzzle, state: NytWordleState): WordleDay | null {
  const game = state.game_data;
  if (!game || (game.status !== 'WIN' && game.status !== 'FAIL')) return null;
  const guesses = (game.boardState ?? []).filter((w) => w && w.length === puzzle.solution.length);
  if (!guesses.length) return null;
  return {
    number: puzzle.days_since_launch,
    date: puzzle.print_date,
    result: game.status === 'WIN' ? guesses.length : null,
    hardMode: !!game.hardMode,
    rows: guesses.map((g) => scoreGuess(g, puzzle.solution)),
  };
}

/** Texto para el heatmap: "4/6", "X/6", con "*" en modo difícil como al compartir. */
export const wordleSummary = (day: WordleDay) => `${day.result ?? 'X'}/6${day.hardMode ? '*' : ''}`;

/**
 * Estadísticas como las de Wordle. La racha actual cuenta victorias seguidas que terminan hoy, o ayer
 * si hoy todavía no lo juego; un día sin jugar o perdido la corta.
 */
export function wordleStats(days: WordleDay[], todayNumber: number): WordleStats {
  const byNumber = new Map(days.map((d) => [d.number, d]));
  const won = (n: number) => byNumber.get(n)?.result != null;

  let maxStreak = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of [...days].sort((a, b) => a.number - b.number)) {
    run = d.result != null ? (prev === d.number - 1 ? run + 1 : 1) : 0;
    prev = d.result != null ? d.number : null;
    maxStreak = Math.max(maxStreak, run);
  }

  let currentStreak = 0;
  for (let n = byNumber.has(todayNumber) ? todayNumber : todayNumber - 1; won(n); n--) currentStreak++;

  const distribution = [0, 0, 0, 0, 0, 0];
  for (const d of days) if (d.result != null && d.result >= 1 && d.result <= 6) distribution[d.result - 1]++;

  return {
    played: days.length,
    won: days.filter((d) => d.result != null).length,
    currentStreak,
    maxStreak,
    distribution,
  };
}
