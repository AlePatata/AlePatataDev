import type { HobbySource, SyncStatus } from '../shared/hobbies';
import type { Secrets } from './auth';
import { syncCube } from './cstimer';
import { todayInChile } from './db';
import { syncMonkeytype } from './monkeytype';
import { syncVibe } from './vibe';
import { syncWordle } from './wordle';

type Adapter = (env: Env & Secrets, today: string) => Promise<unknown>;

/** Fuentes que se sincronizan solas. Las demás se agregan aquí a medida que existan. */
const adapters: Partial<Record<HobbySource, Adapter>> = {
  monkeytype: (env) => syncMonkeytype(env),
  wordle: (env, today) => syncWordle(env, today),
  cube: (env) => syncCube(env),
  claude: (env) => syncVibe(env),
};

export const syncableSources = () => Object.keys(adapters) as HobbySource[];

/** Sincroniza las fuentes pedidas (todas por defecto). Si una falla, las otras siguen. */
export async function runSync(env: Env & Secrets, sources = syncableSources()): Promise<SyncStatus[]> {
  const today = todayInChile();
  const upsert = env.DB.prepare(
    `INSERT INTO sync_status (source, last_sync, last_error, updated_at) VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(source) DO UPDATE SET last_sync = COALESCE(?2, last_sync), last_error = ?3, updated_at = ?4`,
  );
  for (const source of sources) {
    const adapter = adapters[source];
    if (!adapter) continue;
    const now = new Date().toISOString();
    try {
      await adapter(env, today);
      await upsert.bind(source, now, null, now).run();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`Sincronización de ${source} falló: ${message}`);
      await upsert.bind(source, null, message, now).run();
    }
  }
  return loadSyncStatus(env.DB);
}

export async function loadSyncStatus(db: D1Database): Promise<SyncStatus[]> {
  const { results } = await db
    .prepare('SELECT source, last_sync AS lastSync, last_error AS lastError, updated_at AS updatedAt FROM sync_status')
    .all<SyncStatus>();
  return syncableSources().map(
    (source) => results.find((r) => r.source === source) ?? { source, lastSync: null, lastError: null, updatedAt: null },
  );
}
