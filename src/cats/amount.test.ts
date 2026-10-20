import { describe, expect, it } from 'vitest';
import { catAmountLevel, catChance, DEFAULT_CAT_AMOUNT, maxCats, parseCatAmount } from './amount';

describe('parseCatAmount', () => {
  it('usa el valor por defecto si no hay nada guardado o es basura', () => {
    expect(parseCatAmount(null)).toBe(DEFAULT_CAT_AMOUNT);
    expect(parseCatAmount('')).toBe(DEFAULT_CAT_AMOUNT);
    expect(parseCatAmount('muchos')).toBe(DEFAULT_CAT_AMOUNT);
  });

  it('respeta el 0 guardado', () => {
    expect(parseCatAmount('0')).toBe(0);
  });

  it('redondea al paso y se queda entre 0 y 100', () => {
    expect(parseCatAmount('73')).toBe(70);
    expect(parseCatAmount('250')).toBe(100);
    expect(parseCatAmount('-5')).toBe(0);
  });
});

describe('catChance y maxCats', () => {
  it('sin gatitos no sale ninguno', () => {
    expect(catChance(0)).toBe(0);
    expect(maxCats(0)).toBe(0);
  });

  it('más gatito, más seguido y más a la vez', () => {
    expect(catChance(30)).toBeCloseTo(0.3);
    expect(catChance(100)).toBe(1);
    expect([10, 40, 50, 80, 90, 100].map(maxCats)).toEqual([1, 1, 2, 2, 3, 3]);
  });
});

describe('catAmountLevel', () => {
  it('cada extremo tiene su nombre', () => {
    expect(catAmountLevel(0).label).toBe('Sin gatitos');
    expect(catAmountLevel(100).label).toBe('Invasión gatuna total');
  });
});
