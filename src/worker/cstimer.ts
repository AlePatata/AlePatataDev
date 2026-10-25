import LZString from 'lz-string';
import type { CubeDetail } from '../shared/hobbies';
import type { Secrets } from './auth';
import { buildPuzzles, cubeDays, parseBackup, puzzleLabel, toSolve, type CsTime } from './cstimerLogic';

const API = 'https://cstimer.net/userdata2.php';

const RETCODES: Record<number, string> = {
  400: 'el ID no es válido (solo letras y números)',
  404: 'no hay nada exportado con ese ID (en csTimer: Exportar → Exportar al servidor)',
};

/** API no oficial de csTimer (la misma que usa "Importar del servidor"). Ver plan/13-hobbies.md. */
async function csPost<T extends { retcode: number }>(id: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ id, ...params }),
  });
  if (!res.ok) throw new Error(`csTimer respondió ${res.status}`);
  const body = await res.json<T>();
  if (body.retcode !== 0) throw new Error(`csTimer respondió ${body.retcode}: ${RETCODES[body.retcode] ?? 'error'}`);
  return body;
}

const unpack = <T>(data: string): T => {
  const json = LZString.decompressFromEncodedURIComponent(data);
  if (!json) throw new Error('csTimer devolvió datos que no se pudieron descomprimir');
  return JSON.parse(json) as T;
};

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Lo que se guarda en `hobby_snapshots` con la clave 'cube'. */
interface Snapshot {
  hash: string; // SHA-256 del respaldo, para no rehacer nada si no cambió
  detail: CubeDetail;
}

/**
 * Trae lo último que csTimer exportó con mi ID. Si cambió, recalcula las estadísticas y reemplaza los
 * días del heatmap (así también desaparecen los tiempos que borré en csTimer).
 */
export async function syncCube(env: Env & Secrets): Promise<number> {
  const id = env.CSTIMER_ID;
  if (!id) throw new Error('Falta el secreto CSTIMER_ID');

  const { data } = await csPost<{ retcode: number; data: string }>(id, { offset: '0' });
  const hash = await sha256(data);
  const previous = await env.DB.prepare("SELECT json FROM hobby_snapshots WHERE key = 'cube'").first<{ json: string }>();
  if (previous && (JSON.parse(previous.json) as Snapshot).hash === hash) return 0;

  const sessions = parseBackup(unpack(data));
  const keys = sessions.flatMap((s) => s.slices.map((h) => `slice${h}`));
  const slices = keys.length
    ? (await csPost<{ retcode: number; datas: Record<string, string> }>(id, { ids: keys.join(',') })).datas
    : {};
  const read = sessions.map((s) => {
    const times = [
      ...s.inline,
      ...s.slices.flatMap((h) => {
        const slice = slices[`slice${h}`];
        if (!slice) throw new Error(`csTimer no devolvió una tanda de ${s.name}`);
        return unpack<CsTime[]>(slice);
      }),
    ];
    return { puzzle: s.puzzle, name: s.name, solves: times.map(toSolve) };
  });

  const detail: CubeDetail = { puzzles: buildPuzzles(read) };
  const days = cubeDays(read.flatMap((s) => s.solves.map((solve) => ({ ...solve, label: puzzleLabel(s.puzzle, s.name) }))));
  const snapshot: Snapshot = { hash, detail };
  await env.DB.batch([
    env.DB.prepare("DELETE FROM activity WHERE source = 'cube'"),
    env.DB.prepare(
      `INSERT INTO activity (date, source, count, summary)
       SELECT json_extract(value, '$.date'), 'cube', json_extract(value, '$.count'), json_extract(value, '$.summary')
       FROM json_each(?)`,
    ).bind(JSON.stringify(days)),
    env.DB.prepare(
      `INSERT INTO hobby_snapshots (key, json, updated_at) VALUES ('cube', ?1, ?2)
       ON CONFLICT(key) DO UPDATE SET json = ?1, updated_at = ?2`,
    ).bind(JSON.stringify(snapshot), new Date().toISOString()),
  ]);
  return read.reduce((n, s) => n + s.solves.length, 0);
}

export async function loadCube(db: D1Database): Promise<CubeDetail> {
  const row = await db.prepare("SELECT json FROM hobby_snapshots WHERE key = 'cube'").first<{ json: string }>();
  return row ? (JSON.parse(row.json) as Snapshot).detail : { puzzles: [] };
}
