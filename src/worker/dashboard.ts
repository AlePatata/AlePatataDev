import { Hono } from 'hono';
import type { MonthSummary, Settings, TrendPoint } from '../shared/summary';
import type { AppEnv } from './auth';
import { validateSettings } from './catalogLogic';
import { loadCategories, loadSettings, saveSettings, todayInChile } from './db';
import { lastMonths, monthSummary, trend, type SummaryRow } from './summary';
import { monthRange } from './transactionsLogic';

interface Row {
  date: string;
  amount: number;
  internal: number;
  categoryId: number | null;
}

async function loadRows(db: D1Database, from: string, to: string): Promise<SummaryRow[]> {
  const { results } = await db
    .prepare('SELECT date, amount, internal, category_id AS categoryId FROM transactions WHERE date >= ? AND date < ?')
    .bind(from, to)
    .all<Row>();
  return results.map((r) => ({ ...r, internal: r.internal === 1 }));
}

export const settings = new Hono<AppEnv>();

settings.get('/', async (c) => c.json<Settings>(await loadSettings(c.env.DB)));

settings.put('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const error = validateSettings(body);
  if (error) return c.json({ error }, 400);
  await saveSettings(c.env.DB, body as Partial<Settings>);
  return c.json(await loadSettings(c.env.DB));
});

export const summary = new Hono<AppEnv>();

/** `GET /api/summary?month=aaaa-mm` (por defecto, el mes en curso) */
summary.get('/', async (c) => {
  const today = todayInChile();
  const month = c.req.query('month') ?? today.slice(0, 7);
  const range = monthRange(month);
  if (!range) return c.json({ error: 'Mes inválido (aaaa-mm)' }, 400);
  const [rows, cats, conf] = await Promise.all([
    loadRows(c.env.DB, ...range),
    loadCategories(c.env.DB),
    loadSettings(c.env.DB),
  ]);
  return c.json<MonthSummary>(monthSummary(rows, cats, conf, month, today));
});

export const trends = new Hono<AppEnv>();

/** `GET /api/trends?months=6` — los últimos meses hasta el actual (máximo 24). */
trends.get('/', async (c) => {
  const count = Math.min(Math.max(Number(c.req.query('months') ?? 6) || 6, 1), 24);
  const months = lastMonths(todayInChile().slice(0, 7), count);
  const from = monthRange(months[0])![0];
  const to = monthRange(months[months.length - 1])![1];
  const [rows, cats] = await Promise.all([loadRows(c.env.DB, from, to), loadCategories(c.env.DB)]);
  return c.json<TrendPoint[]>(trend(rows, cats, months));
});
