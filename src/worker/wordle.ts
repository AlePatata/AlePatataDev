import type { WordleDay } from '../shared/hobbies';
import type { Secrets } from './auth';
import { rangeStart } from './hobbiesLogic';
import { toWordleDay, wordleSummary, type NytWordlePuzzle, type NytWordleState } from './wordleLogic';

const NYT = 'https://www.nytimes.com';
const HEADERS = { 'User-Agent': 'alepatata.dev (sitio personal)', Accept: 'application/json' };

async function nytJson<T>(path: string, cookie?: string): Promise<T> {
  const res = await fetch(`${NYT}${path}`, { headers: cookie ? { ...HEADERS, Cookie: cookie } : HEADERS });
  if (res.status === 401 || res.status === 403) {
    throw new Error(cookie ? `La NYT rechazó la cookie (${res.status}): hay que renovar NYT_COOKIE` : `La NYT respondió ${res.status}`);
  }
  if (!res.ok) throw new Error(`La NYT respondió ${res.status} en ${path.split('?')[0]}`);
  return res.json<T>();
}

/**
 * Trae mis partidas de los últimos `days` días (por fecha de Chile) y las guarda solo con colores. Las
 * partidas sin terminar se ignoran: el cron las vuelve a pedir en la siguiente pasada.
 */
export async function syncWordle(env: Env & Secrets, today: string, days = 3): Promise<number> {
  if (!env.NYT_COOKIE) throw new Error('Falta el secreto NYT_COOKIE');
  // Hoy, ayer, anteayer…
  const dates = Array.from({ length: days }, (_, i) => rangeStart(today, i + 1));

  const puzzles = await Promise.all(dates.map((d) => nytJson<NytWordlePuzzle>(`/svc/wordle/v2/${d}.json`)));
  const ids = puzzles.map((p) => p.id).join(',');
  const { states = [] } = await nytJson<{ states?: NytWordleState[] }>(
    `/svc/games/state/wordleV2/latests?puzzle_ids=${ids}`,
    env.NYT_COOKIE,
  );

  const played = puzzles.flatMap((p) => {
    const state = states.find((s) => String(s.puzzle_id) === String(p.id));
    const day = state && toWordleDay(p, state);
    return day ? [day] : [];
  });
  if (played.length) await saveWordles(env.DB, played);
  return played.length;
}

export async function saveWordles(db: D1Database, days: WordleDay[]): Promise<void> {
  const wordle = db.prepare(
    `INSERT INTO wordles (number, date, result, hard_mode, rows) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(number) DO UPDATE SET date = excluded.date, result = excluded.result,
       hard_mode = excluded.hard_mode, rows = excluded.rows`,
  );
  const activity = db.prepare(
    `INSERT INTO activity (date, source, count, summary) VALUES (?, 'wordle', 1, ?)
     ON CONFLICT(date, source) DO UPDATE SET count = excluded.count, summary = excluded.summary`,
  );
  await db.batch(
    days.flatMap((d) => [
      wordle.bind(d.number, d.date, d.result, d.hardMode ? 1 : 0, d.rows.join('/')),
      activity.bind(d.date, wordleSummary(d)),
    ]),
  );
}

interface WordleRecord {
  number: number;
  date: string;
  result: number | null;
  hard_mode: number;
  rows: string;
}

export async function loadWordles(db: D1Database): Promise<WordleDay[]> {
  const { results } = await db
    .prepare('SELECT number, date, result, hard_mode, rows FROM wordles ORDER BY number DESC')
    .all<WordleRecord>();
  return results.map((r) => ({
    number: r.number,
    date: r.date,
    result: r.result,
    hardMode: r.hard_mode === 1,
    rows: r.rows.split('/'),
  }));
}
