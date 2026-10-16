import type { AccountFilter, MonthTotals, TransactionInput } from '../shared/transactions';

export const ACCOUNT_FILTERS: AccountFilter[] = ['cuenta_vista', 'cuenta_corriente', 'tarjeta_credito', 'manual'];

/** '2026-10' → ['2026-10-01', '2026-11-01'] (rango semiabierto); `null` si el mes no es válido. */
export function monthRange(month: string): [string, string] | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const year = Number(m[1]);
  const mon = Number(m[2]);
  if (mon < 1 || mon > 12) return null;
  const next = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, '0')}`;
  return [`${month}-01`, `${next}-01`];
}

const isIsoDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/**
 * Valida un movimiento a crear (`partial = false`) o los campos a cambiar (`partial = true`).
 * Devuelve el error o `null`.
 */
export function validateTransaction(body: unknown, partial: boolean): string | null {
  if (typeof body !== 'object' || body === null) return 'Cuerpo inválido';
  const b = body as Partial<TransactionInput>;
  const has = (k: keyof TransactionInput) => b[k] !== undefined;

  if (partial && !['date', 'description', 'amount', 'internal'].some((k) => has(k as keyof TransactionInput))) {
    return 'No hay nada que cambiar';
  }
  if ((!partial || has('date')) && !isIsoDate(b.date)) return 'Fecha inválida';
  if ((!partial || has('description')) && (typeof b.description !== 'string' || !b.description.trim() || b.description.length > 300)) {
    return 'Descripción inválida';
  }
  if ((!partial || has('amount')) && (!Number.isSafeInteger(b.amount) || b.amount === 0)) {
    return 'El monto debe ser un número entero distinto de cero';
  }
  if (has('internal') && typeof b.internal !== 'boolean') return 'Campo "interno" inválido';
  return null;
}

/** Totales del mes: los movimientos internos no cuentan. */
export function monthTotals(rows: { amount: number; internal: boolean }[]): MonthTotals {
  let spent = 0;
  let received = 0;
  let internalCount = 0;
  for (const r of rows) {
    if (r.internal) internalCount++;
    else if (r.amount < 0) spent += r.amount;
    else received += r.amount;
  }
  return { spent, received, net: spent + received, internalCount };
}
