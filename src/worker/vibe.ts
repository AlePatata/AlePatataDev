import type { VibeDetail } from '../shared/hobbies';
import type { Secrets } from './auth';
import { vibeDays, vibeDetail, findFeatures, type GhCommit } from './vibeLogic';

const REPO = 'AlePatata/AlePatataDev';
const MAX_PAGES = 10;

/** Lo que se guarda en `hobby_snapshots` con la clave 'claude'. */
interface Snapshot {
  etag: string | null; // de la primera página: si GitHub responde 304, no cambió nada
  detail: VibeDetail;
}

const loadSnapshot = async (db: D1Database) => {
  const row = await db.prepare("SELECT json FROM hobby_snapshots WHERE key = 'claude'").first<{ json: string }>();
  return row ? (JSON.parse(row.json) as Snapshot) : null;
};

/**
 * Lee los commits de `main` de este repo y recalcula las features y los días con Claude. Un `304`
 * (nada nuevo desde la última vez) no gasta del límite de 60 pedidos por hora de GitHub.
 */
export async function syncVibe(env: Env & Secrets): Promise<number> {
  const previous = await loadSnapshot(env.DB);
  const headers: Record<string, string> = {
    'User-Agent': 'alepatata.dev (sitio personal)',
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;

  const commits: GhCommit[] = [];
  let etag: string | null = null;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const pageHeaders: Record<string, string> = { ...headers };
    if (page === 1 && previous?.etag) pageHeaders['If-None-Match'] = previous.etag;
    const res = await fetch(`https://api.github.com/repos/${REPO}/commits?sha=main&per_page=100&page=${page}`, { headers: pageHeaders });
    if (res.status === 304) return 0;
    if (res.status === 403 || res.status === 429) throw new Error(`GitHub respondió ${res.status}: se pasó el límite de pedidos (sirve un GITHUB_TOKEN)`);
    if (!res.ok) throw new Error(`GitHub respondió ${res.status}`);
    if (page === 1) etag = res.headers.get('ETag');
    const batch = await res.json<GhCommit[]>();
    commits.push(...batch);
    if (batch.length < 100) break;
  }

  const snapshot: Snapshot = { etag, detail: vibeDetail(commits) };
  const days = vibeDays(commits, findFeatures(commits));
  await env.DB.batch([
    env.DB.prepare("DELETE FROM activity WHERE source = 'claude'"),
    env.DB.prepare(
      `INSERT INTO activity (date, source, count, summary)
       SELECT json_extract(value, '$.date'), 'claude', json_extract(value, '$.count'), json_extract(value, '$.summary')
       FROM json_each(?)`,
    ).bind(JSON.stringify(days)),
    env.DB.prepare(
      `INSERT INTO hobby_snapshots (key, json, updated_at) VALUES ('claude', ?1, ?2)
       ON CONFLICT(key) DO UPDATE SET json = ?1, updated_at = ?2`,
    ).bind(JSON.stringify(snapshot), new Date().toISOString()),
  ]);
  return commits.length;
}

export async function loadVibe(db: D1Database): Promise<VibeDetail> {
  return (await loadSnapshot(db))?.detail ?? { totals: { commits: 0, withClaude: 0, features: 0, days: 0, since: null }, features: [], recent: [] };
}
