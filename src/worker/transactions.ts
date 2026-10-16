import { Hono } from 'hono';
import type { AccountFilter, Transaction, TransactionInput, TransactionsResponse } from '../shared/transactions';
import type { AppEnv } from './auth';
import { ACCOUNT_FILTERS, monthRange, monthTotals, validateTransaction } from './transactionsLogic';

export const transactions = new Hono<AppEnv>();

interface Row extends Omit<Transaction, 'internal'> {
  internal: number;
}

const toTransaction = (r: Row): Transaction => ({ ...r, internal: r.internal === 1 });

async function categoryExists(db: D1Database, id: number | null | undefined) {
  return id == null || (await db.prepare('SELECT 1 FROM categories WHERE id = ?').bind(id).first()) !== null;
}

/** `GET /api/transactions?month=aaaa-mm&q=texto&account=tarjeta_credito&category=3|none` */
transactions.get('/', async (c) => {
  const range = monthRange(c.req.query('month') ?? '');
  if (!range) return c.json({ error: 'Mes inválido (aaaa-mm)' }, 400);
  const q = c.req.query('q')?.trim();
  const account = c.req.query('account') as AccountFilter | undefined;
  if (account && !ACCOUNT_FILTERS.includes(account)) return c.json({ error: 'Cuenta inválida' }, 400);
  const category = c.req.query('category');
  if (category && category !== 'none' && !/^\d+$/.test(category)) return c.json({ error: 'Categoría inválida' }, 400);

  const where = ['t.date >= ?', 't.date < ?'];
  const params: (string | number)[] = [...range];
  if (q) {
    where.push("t.description LIKE ? ESCAPE '\\'");
    params.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`);
  }
  // Los internos no se categorizan: no cuentan como "sin categoría"
  if (category === 'none') where.push('t.category_id IS NULL AND t.internal = 0');
  else if (category) {
    where.push('t.category_id = ?');
    params.push(Number(category));
  }
  if (account === 'manual') where.push("t.source = 'manual'");
  else if (account) {
    where.push('s.account_type = ?');
    params.push(account);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT t.id, t.date, t.description, t.amount, t.installment, t.internal, t.source, s.account_type AS account,
            t.category_id AS categoryId
       FROM transactions t LEFT JOIN statements s ON s.id = t.statement_id
      WHERE ${where.join(' AND ')}
      ORDER BY t.date DESC, t.id DESC`,
  )
    .bind(...params)
    .all<Row>();

  const list = results.map(toTransaction);
  return c.json<TransactionsResponse>({ transactions: list, totals: monthTotals(list) });
});

/** Movimiento a mano (por ejemplo, un gasto en efectivo). */
transactions.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const error = validateTransaction(body, false);
  if (error) return c.json({ error }, 400);
  const t = body as TransactionInput;
  if (!(await categoryExists(c.env.DB, t.categoryId))) return c.json({ error: 'La categoría no existe' }, 400);
  const row = await c.env.DB.prepare(
    `INSERT INTO transactions (date, description, amount, source, internal, category_id) VALUES (?, ?, ?, 'manual', ?, ?)
     RETURNING id`,
  )
    .bind(t.date, t.description.trim(), t.amount, t.internal ? 1 : 0, t.categoryId ?? null)
    .first<{ id: number }>();
  return c.json({ id: row!.id }, 201);
});

/** Editar fecha, descripción, monto, categoría o "interno". La `dedupe_key` no cambia: sigue reconociendo la cartola. */
transactions.patch('/:id{[0-9]+}', async (c) => {
  const body = await c.req.json().catch(() => null);
  const error = validateTransaction(body, true);
  if (error) return c.json({ error }, 400);
  const t = body as Partial<TransactionInput>;
  if (!(await categoryExists(c.env.DB, t.categoryId))) return c.json({ error: 'La categoría no existe' }, 400);

  const fields = {
    date: t.date,
    description: t.description?.trim(),
    amount: t.amount,
    internal: t.internal === undefined ? undefined : t.internal ? 1 : 0,
    category_id: t.categoryId,
  };
  const changed = Object.entries(fields).filter(([, v]) => v !== undefined) as [string, string | number | null][];
  const sets = changed.map(([column]) => `${column} = ?`);
  const params = changed.map(([, v]) => v);

  const res = await c.env.DB.prepare(`UPDATE transactions SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...params, Number(c.req.param('id')))
    .run();
  if (!res.meta.changes) return c.json({ error: 'not_found' }, 404);
  return c.json({ ok: true });
});

transactions.delete('/:id{[0-9]+}', async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM transactions WHERE id = ?').bind(Number(c.req.param('id'))).run();
  if (!res.meta.changes) return c.json({ error: 'not_found' }, 404);
  return c.json({ ok: true });
});
