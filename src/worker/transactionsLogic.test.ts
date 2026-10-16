import { describe, expect, it } from 'vitest';
import { monthRange, monthTotals, validateTransaction } from './transactionsLogic';

describe('monthRange', () => {
  it('devuelve el primer día del mes y del siguiente', () => {
    expect(monthRange('2026-10')).toEqual(['2026-10-01', '2026-11-01']);
    expect(monthRange('2026-12')).toEqual(['2026-12-01', '2027-01-01']);
  });

  it('rechaza meses inválidos', () => {
    expect(monthRange('2026-13')).toBeNull();
    expect(monthRange('10-2026')).toBeNull();
    expect(monthRange('')).toBeNull();
  });
});

describe('validateTransaction', () => {
  const ok = { date: '2026-10-05', description: 'Feria', amount: -4500 };

  it('acepta un movimiento completo', () => {
    expect(validateTransaction(ok, false)).toBeNull();
    expect(validateTransaction({ ...ok, internal: true }, false)).toBeNull();
  });

  it('exige todos los campos al crear', () => {
    expect(validateTransaction({ description: 'Feria', amount: -4500 }, false)).toBe('Fecha inválida');
    expect(validateTransaction({ ...ok, amount: 0 }, false)).not.toBeNull();
    expect(validateTransaction({ ...ok, amount: -45.5 }, false)).not.toBeNull();
    expect(validateTransaction({ ...ok, description: ' ' }, false)).not.toBeNull();
  });

  it('al editar solo valida los campos que vienen', () => {
    expect(validateTransaction({ internal: true }, true)).toBeNull();
    expect(validateTransaction({ description: 'Nuevo nombre' }, true)).toBeNull();
    expect(validateTransaction({ amount: 'mucho' }, true)).not.toBeNull();
    expect(validateTransaction({}, true)).toBe('No hay nada que cambiar');
  });
});

describe('monthTotals', () => {
  it('suma gastos y abonos sin contar los internos', () => {
    expect(
      monthTotals([
        { amount: -5000, internal: false },
        { amount: -2500, internal: false },
        { amount: 10000, internal: false },
        { amount: -80000, internal: true },
        { amount: 80000, internal: true },
      ]),
    ).toEqual({ spent: -7500, received: 10000, net: 2500, internalCount: 2 });
  });
});
