import { Hono } from 'hono';
import { HOBBY_SOURCES, type ActivityDay, type HobbiesResponse, type HobbySource, type WordleDetail } from '../shared/hobbies';
import type { AppEnv } from './auth';
import { todayInChile } from './db';
import { rangeStart } from './hobbiesLogic';
import { loadSyncStatus, runSync, syncableSources } from './sync';
import { loadWordles } from './wordle';
import { wordleNumber, wordleStats } from './wordleLogic';

/**
 * Lectura pública para /hobbies. Se monta antes de `requireAuth` y Access la deja pasar con una
 * política Bypass en `/api/public/*`: nunca devuelve nada de la app de finanzas.
 */
export const publicHobbies = new Hono<AppEnv>();

publicHobbies.get('/', async (c) => {
  const to = todayInChile();
  const from = rangeStart(to);
  const { results } = await c.env.DB.prepare(
    'SELECT date, source, count, summary FROM activity WHERE date >= ? AND date <= ? ORDER BY date',
  )
    .bind(from, to)
    .all<ActivityDay>();
  c.header('Cache-Control', 'public, max-age=300');
  return c.json<HobbiesResponse>({ from, to, days: results, connected: syncableSources() });
});

/** Detalle de Wordle: el de hoy, los últimos y las estadísticas. Solo colores, nunca letras. */
publicHobbies.get('/wordle', async (c) => {
  const todayNumber = wordleNumber(todayInChile());
  const days = await loadWordles(c.env.DB);
  c.header('Cache-Control', 'public, max-age=120');
  return c.json<WordleDetail>({
    todayNumber,
    today: days.find((d) => d.number === todayNumber) ?? null,
    recent: days.filter((d) => d.number < todayNumber).slice(0, 7),
    stats: wordleStats(days, todayNumber),
  });
});

/** Privado (solo dueña): estado de las sincronizaciones y "Sincronizar ahora". */
export const hobbiesAdmin = new Hono<AppEnv>();

hobbiesAdmin.get('/sync', async (c) => c.json(await loadSyncStatus(c.env.DB)));

/** `POST /api/hobbies/sync?source=wordle` (sin `source`, todas) */
hobbiesAdmin.post('/sync', async (c) => {
  const source = c.req.query('source');
  if (source && !(HOBBY_SOURCES as readonly string[]).includes(source)) return c.json({ error: 'Fuente desconocida' }, 400);
  const sources = source ? [source as HobbySource] : syncableSources();
  return c.json(await runSync(c.env, sources));
});
