import { Hono } from 'hono';
import type { ImportRequest, ImportResponse } from '../shared/import';
import type { AppEnv } from './auth';
import { categorizeWithClaude } from './categorize';
import { dedupeKeys } from './dedupe';
import { loadRules } from './db';
import { classifyRows, searchRange, validateImport, type ExistingRow } from './importLogic';
import { matchCategory } from './rules';

export const statements = new Hono<AppEnv>();

/**
 * Importa una cartola ya leída en el navegador. Con `dryRun` solo dice qué filas son nuevas;
 * sin `dryRun` guarda la cartola y las filas incluidas que no estén repetidas.
 */
statements.post('/commit', async (c) => {
  const body = await c.req.json().catch(() => null);
  const error = validateImport(body);
  if (error) return c.json({ error }, 400);
  const { dryRun, statement: s, transactions } = body as ImportRequest;

  const keys = dedupeKeys(
    s.accountType,
    transactions.map((t) => ({ date: t.date, amount: t.amount, description: t.originalDescription })),
  );

  const [from, to] = searchRange(transactions.map((t) => t.date));
  const { results: existing } = await c.env.DB.prepare(
    `SELECT t.date, t.amount, t.description, t.dedupe_key
       FROM transactions t JOIN statements s ON s.id = t.statement_id
      WHERE s.account_type = ? AND t.date BETWEEN ? AND ?`,
  )
    .bind(s.accountType, from, to)
    .all<ExistingRow>();

  const statuses = classifyRows(transactions, keys, existing);
  const toInsert = transactions.map((t, i) => ({ ...t, key: keys[i] })).filter((t, i) => t.include && statuses[i] !== 'duplicate');
  const skipped = transactions.filter((t, i) => t.include && statuses[i] === 'duplicate').length;

  if (dryRun || toInsert.length === 0) {
    return c.json<ImportResponse>({ statuses, inserted: 0, skipped });
  }

  const rules = await loadRules(c.env.DB);
  // Id explícito para insertar la cartola y sus movimientos en un solo batch (todo o nada)
  const next = await c.env.DB.prepare('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM statements').first<{ id: number }>();
  const statementId = next!.id;
  const insertTx = c.env.DB.prepare(
    `INSERT INTO transactions (date, description, amount, source, statement_id, dedupe_key, installment, internal, category_id)
     VALUES (?, ?, ?, 'import', ?, ?, ?, ?, ?)
     ON CONFLICT(dedupe_key) DO NOTHING`,
  );
  const results = await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO statements (id, filename, account_type, period_start, period_end, closing_balance)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(statementId, s.filename, s.accountType, s.periodStart, s.periodEnd, s.closingBalance),
    ...toInsert.map((t) =>
      insertTx.bind(
        t.date,
        t.description.trim(),
        t.amount,
        statementId,
        t.key,
        t.installment ?? null,
        t.internal ? 1 : 0,
        // Los internos no se categorizan: no cuentan en los totales
        t.internal ? null : matchCategory(t.originalDescription, rules),
      ),
    ),
  ]);

  const inserted = results.slice(1).reduce((n, r) => n + (r.meta.changes ?? 0), 0);
  // Lo que las reglas no reconocieron lo intenta Claude, sin hacer esperar la respuesta
  if (inserted && c.env.ANTHROPIC_API_KEY) {
    c.executionCtx.waitUntil(categorizeWithClaude(c.env).catch((e) => console.error(`Categorizar con Claude falló: ${e}`)));
  }
  return c.json<ImportResponse>({ statuses, inserted, skipped: skipped + toInsert.length - inserted });
});
