import type { CfContest, CodeforcesDetail } from '../shared/hobbies';
import { todayInChile } from './db';
import {
  codeforcesDays,
  codeforcesDetail,
  toContest,
  toSubmissionRow,
  type ApiRatingChange,
  type ApiSubmission,
  type SubmissionRow,
} from './codeforcesLogic';

/** Mi handle; es público (sale en el link del perfil). */
export const CF_HANDLE = 'AlePatata92';

const API = 'https://codeforces.com/api';

/** Codeforces pide no más de una llamada cada 2 s. */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function cfJson<T>(method: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(`${API}/${method}?${new URLSearchParams(params)}`, { headers: { Accept: 'application/json' } });
  const body = await res.json<{ status: 'OK'; result: T } | { status: 'FAILED'; comment: string }>().catch(() => null);
  if (!body) throw new Error(`Codeforces respondió ${res.status} en ${method}`);
  if (body.status !== 'OK') throw new Error(`Codeforces: ${body.comment}`);
  return body.result;
}

/**
 * Trae los concursos (siempre todos: son pocos) y los envíos nuevos. La primera vez trae todos los
 * envíos; después los últimos 100, y si todos son nuevos, todos de nuevo. Nunca usa `user.info`, que
 * puede traer el email.
 */
export async function syncCodeforces(env: Env): Promise<number> {
  const known = await env.DB.prepare('SELECT COUNT(*) AS n FROM cf_submissions').first<{ n: number }>();
  const ratings = await cfJson<ApiRatingChange[]>('user.rating', { handle: CF_HANDLE });
  await wait(2000);
  let submissions = await cfJson<ApiSubmission[]>('user.status', {
    handle: CF_HANDLE,
    ...(known?.n ? { from: '1', count: '100' } : {}),
  });
  if (known?.n && submissions.length === 100) {
    const ids = submissions.map((s) => s.id);
    const { results } = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM cf_submissions WHERE id IN (${ids.map(() => '?').join(',')})`,
    )
      .bind(...ids)
      .all<{ n: number }>();
    if (!results[0]?.n) {
      await wait(2000);
      submissions = await cfJson<ApiSubmission[]>('user.status', { handle: CF_HANDLE });
    }
  }

  const rows = submissions.map(toSubmissionRow);
  // Un envío puede cambiar (en evaluación → veredicto), así que se reemplaza
  await env.DB.batch([
    env.DB.prepare(
      `INSERT OR REPLACE INTO cf_submissions
         (id, timestamp, date, contest_id, problem_index, problem_name, rating, tags, verdict, participant_type)
       SELECT json_extract(value, '$.id'), json_extract(value, '$.timestamp'), json_extract(value, '$.date'),
              json_extract(value, '$.contestId'), json_extract(value, '$.index'), json_extract(value, '$.name'),
              json_extract(value, '$.rating'), json_extract(value, '$.tags'), json_extract(value, '$.verdict'),
              json_extract(value, '$.participantType')
       FROM json_each(?)`,
    ).bind(JSON.stringify(rows.map((r) => ({ ...r, tags: JSON.stringify(r.tags) })))),
    env.DB.prepare(
      `INSERT OR REPLACE INTO cf_contests (contest_id, name, timestamp, date, rank, old_rating, new_rating)
       SELECT json_extract(value, '$.contestId'), json_extract(value, '$.name'), json_extract(value, '$.timestamp'),
              json_extract(value, '$.date'), json_extract(value, '$.rank'), json_extract(value, '$.oldRating'),
              json_extract(value, '$.newRating')
       FROM json_each(?)`,
    ).bind(JSON.stringify(ratings.map(toContest))),
  ]);

  // Recalcula los días del heatmap que tocaron los envíos traídos
  const dates = [...new Set(rows.map((r) => r.date))];
  if (dates.length) {
    const all = await loadSubmissions(env.DB, dates);
    await env.DB.prepare(
      `INSERT INTO activity (date, source, count, summary)
       SELECT json_extract(value, '$.date'), 'codeforces', json_extract(value, '$.count'), json_extract(value, '$.summary')
       FROM json_each(?) WHERE true
       ON CONFLICT(date, source) DO UPDATE SET count = excluded.count, summary = excluded.summary`,
    )
      .bind(JSON.stringify(codeforcesDays(all)))
      .run();
  }
  return rows.length;
}

/** Los envíos guardados; con `dates`, solo los de esos días. */
async function loadSubmissions(db: D1Database, dates?: string[]): Promise<SubmissionRow[]> {
  const where = dates ? `WHERE date IN (SELECT value FROM json_each(?))` : '';
  const stmt = db.prepare(
    `SELECT id, timestamp, date, contest_id AS contestId, problem_index AS "index", problem_name AS name, rating,
            tags, verdict, participant_type AS participantType
     FROM cf_submissions ${where}`,
  );
  const { results } = await (dates ? stmt.bind(JSON.stringify(dates)) : stmt).all<Omit<SubmissionRow, 'tags'> & { tags: string }>();
  return results.map((r) => ({ ...r, tags: JSON.parse(r.tags) as string[] }));
}

export async function loadCodeforces(db: D1Database): Promise<CodeforcesDetail> {
  const [submissions, { results: contests }] = await Promise.all([
    loadSubmissions(db),
    db
      .prepare(
        `SELECT contest_id AS contestId, name, date, rank, old_rating AS oldRating, new_rating AS newRating
         FROM cf_contests`,
      )
      .all<CfContest>(),
  ]);
  return codeforcesDetail(CF_HANDLE, submissions, contests, todayInChile());
}
