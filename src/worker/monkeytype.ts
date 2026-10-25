import type { MonkeytypeDetail, TypingPb, TypingTest } from '../shared/hobbies';
import type { Secrets } from './auth';
import { bestPbs, lastAverage, toTypingTest, typingDaySummary, type ApiPbs, type ApiResult } from './monkeytypeLogic';

const API = 'https://api.monkeytype.com';

/** Códigos propios de Monkeytype para la ApeKey */
const APE_ERRORS: Record<number, string> = {
  470: 'la ApeKey no es válida',
  471: 'la ApeKey está desactivada (actívala en Account → Ape Keys)',
  472: 'la ApeKey está mal escrita',
  479: 'se pasó el límite de la ApeKey (30 llamadas al día a /results)',
};

async function mtJson<T>(path: string, key: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `ApeKey ${key}`, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Monkeytype respondió ${res.status}: ${APE_ERRORS[res.status] ?? path.split('?')[0]}`);
  const body = await res.json<{ data: T }>();
  return body.data;
}

/** Lo que se guarda en `hobby_snapshots` con la clave 'monkeytype'. */
interface Snapshot {
  pbs: TypingPb[];
  completedTests: number;
  startedTests: number;
  secondsTyping: number;
  streak: { current: number; max: number };
}

/**
 * Trae los tests nuevos (desde el último guardado), los PB, los totales y la racha. `/results` con
 * ApeKey acepta solo 30 llamadas al día: el cron cada 2 horas usa 12.
 */
export async function syncMonkeytype(env: Env & Secrets): Promise<number> {
  const key = env.MONKEYTYPE_APE_KEY;
  if (!key) throw new Error('Falta el secreto MONKEYTYPE_APE_KEY');

  const last = await env.DB.prepare('SELECT MAX(timestamp) AS ts FROM mt_results').first<{ ts: number | null }>();
  const query = last?.ts ? `?onOrAfterTimestamp=${last.ts + 1}` : '?limit=1000';
  const [results, timePbs, wordsPbs, stats, streak] = await Promise.all([
    mtJson<ApiResult[]>(`/results${query}`, key),
    mtJson<ApiPbs>('/users/personalBests?mode=time', key),
    mtJson<ApiPbs>('/users/personalBests?mode=words', key),
    mtJson<{ completedTests: number; startedTests: number; timeTyping: number }>('/users/stats', key),
    mtJson<{ length: number; maxLength: number }>('/users/streak', key),
  ]);

  const tests = results.map(toTypingTest);
  const insert = env.DB.prepare(
    `INSERT OR IGNORE INTO mt_results (id, timestamp, date, wpm, raw, acc, consistency, mode, mode2)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const snapshot: Snapshot = {
    pbs: [...bestPbs('time', timePbs), ...bestPbs('words', wordsPbs)],
    completedTests: stats.completedTests,
    startedTests: stats.startedTests,
    secondsTyping: Math.round(stats.timeTyping),
    streak: { current: streak.length, max: streak.maxLength },
  };
  await env.DB.batch([
    ...tests.map((t) => insert.bind(t.id, t.timestamp, t.date, t.wpm, t.raw, t.acc, t.consistency, t.mode, t.mode2)),
    env.DB.prepare(
      `INSERT INTO hobby_snapshots (key, json, updated_at) VALUES ('monkeytype', ?1, ?2)
       ON CONFLICT(key) DO UPDATE SET json = ?1, updated_at = ?2`,
    ).bind(JSON.stringify(snapshot), new Date().toISOString()),
  ]);

  // Recalcula los días del heatmap que tocaron los tests nuevos
  const dates = [...new Set(tests.map((t) => t.date))];
  if (dates.length) {
    const { results: days } = await env.DB.prepare(
      `SELECT date, COUNT(*) AS count, MAX(wpm) AS max FROM mt_results
       WHERE date IN (${dates.map(() => '?').join(',')}) GROUP BY date`,
    )
      .bind(...dates)
      .all<{ date: string; count: number; max: number }>();
    const activity = env.DB.prepare(
      `INSERT INTO activity (date, source, count, summary) VALUES (?, 'monkeytype', ?, ?)
       ON CONFLICT(date, source) DO UPDATE SET count = excluded.count, summary = excluded.summary`,
    );
    await env.DB.batch(days.map((d) => activity.bind(d.date, d.count, typingDaySummary(d.count, d.max))));
  }
  return tests.length;
}

export async function loadMonkeytype(db: D1Database): Promise<MonkeytypeDetail> {
  const [{ results }, row] = await Promise.all([
    db
      .prepare(
        `SELECT id, timestamp, date, wpm, raw, acc, consistency, mode, mode2
         FROM (SELECT * FROM mt_results ORDER BY timestamp DESC LIMIT 100) ORDER BY timestamp`,
      )
      .all<TypingTest>(),
    db.prepare("SELECT json FROM hobby_snapshots WHERE key = 'monkeytype'").first<{ json: string }>(),
  ]);
  const snapshot: Snapshot = row
    ? JSON.parse(row.json)
    : { pbs: [], completedTests: 0, startedTests: 0, secondsTyping: 0, streak: { current: 0, max: 0 } };
  return { ...snapshot, last10: lastAverage(results), tests: results };
}
