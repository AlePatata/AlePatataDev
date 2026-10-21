import { Hono } from 'hono';
import type { ActivityDay, HobbiesResponse } from '../shared/hobbies';
import type { AppEnv } from './auth';
import { todayInChile } from './db';
import { rangeStart } from './hobbiesLogic';

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
  return c.json<HobbiesResponse>({ from, to, days: results });
});
