import type { ImportRequest, RowStatus } from '../shared/import';
import { normalizeDescription } from '../shared/text';

const ACCOUNT_TYPES = ['cuenta_vista', 'cuenta_corriente', 'tarjeta_credito'];
const MAX_ROWS = 1000;

const isIsoDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const isText = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim() !== '' && v.length <= max;
const isOptionalDate = (v: unknown) => v === null || isIsoDate(v);

/** Valida el cuerpo de `POST /api/statements/commit`. Devuelve el error o `null`. */
export function validateImport(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return 'Cuerpo inválido';
  const b = body as Partial<ImportRequest>;
  if (typeof b.dryRun !== 'boolean') return 'Falta dryRun';

  const s = b.statement;
  if (!s || typeof s !== 'object') return 'Falta statement';
  if (!isText(s.filename, 200)) return 'Nombre de archivo inválido';
  if (!ACCOUNT_TYPES.includes(s.accountType)) return 'Tipo de cuenta inválido';
  if (!isOptionalDate(s.periodStart) || !isOptionalDate(s.periodEnd)) return 'Período inválido';
  if (s.closingBalance !== null && !Number.isSafeInteger(s.closingBalance)) return 'Saldo inválido';

  if (!Array.isArray(b.transactions) || b.transactions.length === 0) return 'No hay movimientos';
  if (b.transactions.length > MAX_ROWS) return `Máximo ${MAX_ROWS} movimientos por archivo`;
  for (const [i, t] of b.transactions.entries()) {
    const row = `Fila ${i + 1}`;
    if (!t || typeof t !== 'object') return `${row}: inválida`;
    if (!isIsoDate(t.date)) return `${row}: fecha inválida`;
    if (!isText(t.originalDescription, 300) || !isText(t.description, 300)) return `${row}: descripción inválida`;
    if (!Number.isSafeInteger(t.amount) || t.amount === 0) return `${row}: monto inválido`;
    if (t.installment !== undefined && !/^\d{1,3}\/\d{1,3}$/.test(t.installment)) return `${row}: cuotas inválidas`;
    if (typeof t.internal !== 'boolean' || typeof t.include !== 'boolean') return `${row}: campos inválidos`;
  }
  return null;
}

export interface ExistingRow {
  date: string;
  amount: number;
  description: string;
  dedupe_key: string | null;
}

/** Solo letras y números: `MERPAGOTIENDA` y `MERPAGO*TIENDA COMPRAS` quedan comparables. */
const compact = (s: string) => normalizeDescription(s).replace(/[^a-z0-9]/g, '').replace(/compras$/, '');
const daysBetween = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) / 86_400_000;

/**
 * Estado de cada fila: `duplicate` si su dedupe_key ya existe; `possible` si se parece a una ya guardada
 * con otra clave (mismo monto, ±3 días y una descripción contiene a la otra), como pasa cuando el banco
 * cambia la descripción de una compra provisoria de la tarjeta.
 */
export function classifyRows(
  rows: { date: string; amount: number; originalDescription: string }[],
  keys: string[],
  existing: ExistingRow[],
): RowStatus[] {
  const existingKeys = new Set(existing.map((e) => e.dedupe_key));
  const batchKeys = new Set(keys);
  const others = existing.filter((e) => !e.dedupe_key || !batchKeys.has(e.dedupe_key));

  return rows.map((row, i) => {
    if (existingKeys.has(keys[i])) return 'duplicate';
    const desc = compact(row.originalDescription);
    const similar = others.some((e) => {
      if (e.amount !== row.amount || daysBetween(e.date, row.date) > 3) return false;
      const other = compact(e.description);
      return other !== '' && desc !== '' && (other.includes(desc) || desc.includes(other));
    });
    return similar ? 'possible' : 'new';
  });
}

/** Rango de fechas a revisar en la base: el del archivo ±3 días. */
export function searchRange(dates: string[]): [string, string] {
  const sorted = [...dates].sort();
  const shift = (iso: string, days: number) => new Date(Date.parse(iso) + days * 86_400_000).toISOString().slice(0, 10);
  return [shift(sorted[0], -3), shift(sorted[sorted.length - 1], 3)];
}
