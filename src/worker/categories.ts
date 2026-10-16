import { Hono } from 'hono';
import type { Category, RuleInfo } from '../shared/summary';
import type { AppEnv } from './auth';
import { validateCategory, validateRule } from './catalogLogic';
import { applyRulesToUncategorized, loadCategories, loadRules } from './db';

export const categories = new Hono<AppEnv>();

categories.get('/', async (c) => c.json(await loadCategories(c.env.DB)));

categories.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const error = validateCategory(body, false);
  if (error) return c.json({ error }, 400);
  const { name, color, kind } = body as Category;
  const row = await c.env.DB.prepare('INSERT INTO categories (name, color, kind) VALUES (?, ?, ?) ON CONFLICT(name) DO NOTHING RETURNING id')
    .bind(name.trim(), color, kind)
    .first<{ id: number }>();
  if (!row) return c.json({ error: 'Ya existe una categoría con ese nombre' }, 409);
  return c.json({ id: row.id }, 201);
});

categories.patch('/:id{[0-9]+}', async (c) => {
  const body = await c.req.json().catch(() => null);
  const error = validateCategory(body, true);
  if (error) return c.json({ error }, 400);
  const b = body as Partial<Category>;
  const changed = Object.entries({ name: b.name?.trim(), color: b.color, kind: b.kind }).filter(([, v]) => v !== undefined);
  try {
    const res = await c.env.DB.prepare(`UPDATE categories SET ${changed.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ?`)
      .bind(...changed.map(([, v]) => v as string), Number(c.req.param('id')))
      .run();
    if (!res.meta.changes) return c.json({ error: 'not_found' }, 404);
  } catch {
    return c.json({ error: 'Ya existe una categoría con ese nombre' }, 409);
  }
  return c.json({ ok: true });
});

/** Sus movimientos quedan sin categoría y sus reglas se borran. */
categories.delete('/:id{[0-9]+}', async (c) => {
  const id = Number(c.req.param('id'));
  const [, , res] = await c.env.DB.batch([
    c.env.DB.prepare('UPDATE transactions SET category_id = NULL WHERE category_id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM category_rules WHERE category_id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id),
  ]);
  if (!res.meta.changes) return c.json({ error: 'not_found' }, 404);
  return c.json({ ok: true });
});

export const rules = new Hono<AppEnv>();

rules.get('/', async (c) => c.json<RuleInfo[]>(await loadRules(c.env.DB)));

rules.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const error = validateRule(body);
  if (error) return c.json({ error }, 400);
  const { pattern, categoryId } = body as RuleInfo;
  const exists = await c.env.DB.prepare('SELECT 1 FROM categories WHERE id = ?').bind(categoryId).first();
  if (!exists) return c.json({ error: 'La categoría no existe' }, 400);
  const row = await c.env.DB.prepare('INSERT INTO category_rules (pattern, category_id) VALUES (?, ?) RETURNING id')
    .bind(pattern.trim().toLowerCase(), categoryId)
    .first<{ id: number }>();
  return c.json({ id: row!.id }, 201);
});

rules.delete('/:id{[0-9]+}', async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM category_rules WHERE id = ?').bind(Number(c.req.param('id'))).run();
  if (!res.meta.changes) return c.json({ error: 'not_found' }, 404);
  return c.json({ ok: true });
});

/** Aplica las reglas a los movimientos sin categoría. */
rules.post('/apply', async (c) => c.json({ categorized: await applyRulesToUncategorized(c.env.DB) }));
