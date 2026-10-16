import { describe, expect, it } from 'vitest';
import { validateCategory, validateRule, validateSettings } from './catalogLogic';

describe('validateCategory', () => {
  const ok = { name: 'Mascotas', color: '#ec4899', kind: 'expense' };

  it('acepta una categoría completa o un cambio parcial', () => {
    expect(validateCategory(ok, false)).toBeNull();
    expect(validateCategory({ kind: 'refund' }, true)).toBeNull();
  });

  it('rechaza datos inválidos', () => {
    expect(validateCategory({ ...ok, name: ' ' }, false)).toBe('Nombre inválido');
    expect(validateCategory({ ...ok, color: 'rosa' }, false)).toBe('Color inválido');
    expect(validateCategory({ ...ok, kind: 'ahorro' }, false)).toBe('Tipo inválido');
    expect(validateCategory({}, true)).toBe('No hay nada que cambiar');
  });
});

describe('validateRule', () => {
  it('exige patrón y categoría', () => {
    expect(validateRule({ pattern: 'uber', categoryId: 3 })).toBeNull();
    expect(validateRule({ pattern: '   ', categoryId: 3 })).toBe('Patrón inválido');
    expect(validateRule({ pattern: 'uber', categoryId: '3' })).toBe('Categoría inválida');
  });
});

describe('validateSettings', () => {
  it('acepta montos enteros, null o ausentes', () => {
    expect(validateSettings({ monthlyIncome: 300000, monthlyBudget: null })).toBeNull();
    expect(validateSettings({})).toBeNull();
    expect(validateSettings({ monthlyIncome: -1 })).not.toBeNull();
    expect(validateSettings({ monthlyBudget: 10.5 })).not.toBeNull();
  });
});
