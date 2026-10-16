import { describe, expect, it } from 'vitest';
import type { Category } from '../shared/summary';
import { lastMonths, monthSummary, trend, type SummaryRow } from './summary';

const categories: Category[] = [
  { id: 1, name: 'Comida', color: '#000', kind: 'expense' },
  { id: 2, name: 'Compras', color: '#000', kind: 'expense' },
  { id: 3, name: 'Reembolso', color: '#000', kind: 'refund' },
  { id: 4, name: 'Ingreso', color: '#000', kind: 'income' },
];

const row = (amount: number, categoryId: number | null, extra: Partial<SummaryRow> = {}): SummaryRow => ({
  date: '2026-10-05',
  amount,
  internal: false,
  categoryId,
  ...extra,
});

const rows: SummaryRow[] = [
  row(-20000, 1), // comida
  row(-5000, 1),
  row(-30000, 2), // compras
  row(4000, 2), // devolución de una compra
  row(-8000, null), // sin categoría
  row(10000, 3), // reembolso de un amigo
  row(200000, 4), // ingreso
  row(6000, null), // abono sin clasificar
  row(-80000, null, { internal: true }), // pago de la tarjeta
  row(80000, null, { internal: true }),
];

describe('monthSummary', () => {
  const s = monthSummary(rows, categories, { monthlyIncome: 250000, monthlyBudget: 150000, ownerName: null, partnerName: null }, '2026-10', '2026-10-16');

  it('resta los reembolsos y las devoluciones, y deja fuera los internos', () => {
    // gastos 20000 + 5000 + 30000 − 4000 + 8000 = 59000; menos reembolso 10000
    expect(s.spentNet).toBe(49000);
    expect(s.refunds).toBe(10000);
    expect(s.internalCount).toBe(2);
  });

  it('agrupa por categoría de mayor a menor', () => {
    expect(s.byCategory).toEqual([
      { categoryId: 2, amount: 26000, count: 2 },
      { categoryId: 1, amount: 25000, count: 2 },
      { categoryId: null, amount: 8000, count: 1 },
    ]);
    expect(s.uncategorizedCount).toBe(1);
  });

  it('separa ingresos reales y abonos sin clasificar', () => {
    expect(s.incomeActual).toBe(200000);
    expect(s.incomeFixed).toBe(250000);
    expect(s.uncategorizedCredits).toEqual({ count: 1, amount: 6000 });
  });

  it('calcula cuánto queda y el ritmo diario del mes en curso', () => {
    expect(s.budget).toBe(150000);
    expect(s.remaining).toBe(101000);
    expect(s.daysLeft).toBe(16); // del 16 al 31, contando hoy
    expect(s.dailyPace).toBe(6312);
  });

  it('sin presupuesto usa el ingreso fijo', () => {
    const t = monthSummary(rows, categories, { monthlyIncome: 250000, monthlyBudget: null, ownerName: null, partnerName: null }, '2026-10', '2026-10-31');
    expect(t.budget).toBe(250000);
    expect(t.daysLeft).toBe(1);
    expect(t.dailyPace).toBe(201000);
  });

  it('en un mes pasado o sin ajustes no hay ritmo diario', () => {
    const t = monthSummary(rows, categories, { monthlyIncome: null, monthlyBudget: null, ownerName: null, partnerName: null }, '2026-10', '2026-11-02');
    expect(t.remaining).toBeNull();
    expect(t.daysLeft).toBeNull();
    expect(t.dailyPace).toBeNull();
  });

  it('una categoría desconocida cuenta como sin categoría', () => {
    const t = monthSummary([row(-1000, 99)], categories, { monthlyIncome: null, monthlyBudget: null, ownerName: null, partnerName: null }, '2026-10', '2026-10-01');
    expect(t.byCategory).toEqual([{ categoryId: null, amount: 1000, count: 1 }]);
  });
});

describe('lastMonths y trend', () => {
  it('lista los meses hacia atrás cruzando el año', () => {
    expect(lastMonths('2027-02', 4)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
  });

  it('suma por mes y deja en 0 los meses sin movimientos', () => {
    const t = trend(
      [row(-5000, 1, { date: '2026-09-10' }), row(-3000, 1), row(100000, 4)],
      categories,
      ['2026-08', '2026-09', '2026-10'],
    );
    expect(t).toEqual([
      { month: '2026-08', spentNet: 0, incomeActual: 0 },
      { month: '2026-09', spentNet: 5000, incomeActual: 0 },
      { month: '2026-10', spentNet: 3000, incomeActual: 100000 },
    ]);
  });
});
