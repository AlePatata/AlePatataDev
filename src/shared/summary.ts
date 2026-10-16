// Tipos de categorías, reglas, ajustes y resumen del mes, compartidos entre la app y el Worker.

export type CategoryKind = 'expense' | 'refund' | 'income';

export interface Category {
  id: number;
  name: string;
  color: string;
  kind: CategoryKind;
}

export interface RuleInfo {
  id: number;
  pattern: string;
  categoryId: number;
}

export interface Settings {
  monthlyIncome: number | null;
  monthlyBudget: number | null;
  ownerName: string | null; // para "Agregado por …" en la wishlist
  partnerName: string | null;
}

export interface CategoryTotal {
  categoryId: number | null; // null = sin categoría
  amount: number; // gasto neto de la categoría, en positivo
  count: number;
}

/** Resumen de un mes. Montos en positivo; los movimientos internos no cuentan. */
export interface MonthSummary {
  month: string;
  spentNet: number; // gastos − devoluciones − reembolsos
  refunds: number; // abonos en categorías de tipo reembolso
  byCategory: CategoryTotal[]; // de mayor a menor
  incomeActual: number; // abonos en categorías de tipo ingreso
  incomeFixed: number | null; // de Ajustes
  budget: number | null; // presupuesto de Ajustes, o el ingreso fijo si no hay
  remaining: number | null; // presupuesto − gastado neto
  daysLeft: number | null; // solo en el mes en curso, contando hoy
  dailyPace: number | null; // queda / días que faltan
  uncategorizedCount: number; // gastos sin categoría
  uncategorizedCredits: { count: number; amount: number }; // abonos sin categoría (no cuentan)
  internalCount: number;
}

export interface TrendPoint {
  month: string;
  spentNet: number;
  incomeActual: number;
}
