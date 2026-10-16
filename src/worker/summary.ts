import type { Category, CategoryTotal, MonthSummary, Settings, TrendPoint } from '../shared/summary';

export interface SummaryRow {
  date: string;
  amount: number;
  internal: boolean;
  categoryId: number | null;
}

interface Totals {
  spentNet: number;
  refunds: number;
  incomeActual: number;
  byCategory: Map<number | null, CategoryTotal>;
  uncategorizedCredits: { count: number; amount: number };
  internalCount: number;
}

/**
 * Cómo cuenta cada movimiento (sin los internos):
 * - gasto (monto negativo) → suma a su categoría, o a "sin categoría";
 * - abono en categoría de reembolso → resta del gasto total;
 * - abono en categoría de gasto (devolución de una compra) → resta de esa categoría;
 * - abono en categoría de ingreso → ingreso real;
 * - abono sin categoría → no cuenta hasta que se clasifique.
 */
function totals(rows: SummaryRow[], categories: Category[]): Totals {
  const kind = new Map(categories.map((c) => [c.id, c.kind]));
  const t: Totals = {
    spentNet: 0,
    refunds: 0,
    incomeActual: 0,
    byCategory: new Map(),
    uncategorizedCredits: { count: 0, amount: 0 },
    internalCount: 0,
  };
  const addToCategory = (categoryId: number | null, amount: number) => {
    const entry = t.byCategory.get(categoryId) ?? { categoryId, amount: 0, count: 0 };
    entry.amount += amount;
    entry.count++;
    t.byCategory.set(categoryId, entry);
  };

  for (const r of rows) {
    if (r.internal) {
      t.internalCount++;
      continue;
    }
    // Una categoría borrada o desconocida cuenta como sin categoría
    const categoryId = r.categoryId != null && kind.has(r.categoryId) ? r.categoryId : null;
    const k = categoryId == null ? null : kind.get(categoryId);
    if (r.amount < 0) addToCategory(categoryId, -r.amount);
    else if (k === 'refund') t.refunds += r.amount;
    else if (k === 'income') t.incomeActual += r.amount;
    else if (k === 'expense') addToCategory(categoryId, -r.amount);
    else {
      t.uncategorizedCredits.count++;
      t.uncategorizedCredits.amount += r.amount;
    }
  }

  const spentGross = [...t.byCategory.values()].reduce((sum, c) => sum + c.amount, 0);
  t.spentNet = spentGross - t.refunds;
  return t;
}

const daysInMonth = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

/** Resumen del mes `aaaa-mm`. `today` (aaaa-mm-dd) define si es el mes en curso, para el ritmo diario. */
export function monthSummary(
  rows: SummaryRow[],
  categories: Category[],
  settings: Settings,
  month: string,
  today: string,
): MonthSummary {
  const t = totals(rows, categories);
  const budget = settings.monthlyBudget ?? settings.monthlyIncome;
  const remaining = budget == null ? null : budget - t.spentNet;
  const daysLeft = today.startsWith(month) ? daysInMonth(month) - Number(today.slice(8, 10)) + 1 : null;

  return {
    month,
    spentNet: t.spentNet,
    refunds: t.refunds,
    byCategory: [...t.byCategory.values()].filter((c) => c.amount !== 0).sort((a, b) => b.amount - a.amount),
    incomeActual: t.incomeActual,
    incomeFixed: settings.monthlyIncome,
    budget,
    remaining,
    daysLeft,
    dailyPace: remaining == null || daysLeft == null ? null : Math.floor(remaining / daysLeft),
    uncategorizedCount: t.byCategory.get(null)?.count ?? 0,
    uncategorizedCredits: t.uncategorizedCredits,
    internalCount: t.internalCount,
  };
}

/** Los `count` meses que terminan en `lastMonth`, del más antiguo al más reciente. */
export function lastMonths(lastMonth: string, count: number): string[] {
  const [y, m] = lastMonth.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
}

/** Gastado neto e ingresos reales de cada mes (meses sin movimientos quedan en 0). */
export function trend(rows: SummaryRow[], categories: Category[], months: string[]): TrendPoint[] {
  const byMonth = new Map<string, SummaryRow[]>(months.map((m) => [m, []]));
  for (const r of rows) byMonth.get(r.date.slice(0, 7))?.push(r);
  return months.map((month) => {
    const t = totals(byMonth.get(month)!, categories);
    return { month, spentNet: t.spentNet, incomeActual: t.incomeActual };
  });
}
