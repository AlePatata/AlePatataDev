import { describe, expect, it } from 'vitest';
import { dedupeKeys, normalizeDescription } from './dedupe';

describe('normalizeDescription', () => {
  it('ignora mayúsculas, tildes y espacios repetidos', () => {
    expect(normalizeDescription('  PAGO:EL  Café ')).toBe('pago:el cafe');
    expect(normalizeDescription('Pago:el Cafe')).toBe('pago:el cafe');
  });
});

describe('dedupeKeys', () => {
  it('incluye la cuenta, la fecha, el monto y la descripción normalizada', () => {
    expect(dedupeKeys('cuenta_vista', [{ date: '2026-09-23', amount: -2500, description: 'PAGO:CAFE' }])).toEqual([
      'cuenta_vista|2026-09-23|-2500|pago:cafe|1',
    ]);
  });

  it('numera los movimientos idénticos del mismo archivo', () => {
    const t = { date: '2026-10-11', amount: -20000, description: 'CASINO' };
    expect(dedupeKeys('tarjeta_credito', [t, { ...t }])).toEqual([
      'tarjeta_credito|2026-10-11|-20000|casino|1',
      'tarjeta_credito|2026-10-11|-20000|casino|2',
    ]);
  });

  it('distingue la misma compra en distintas cuentas', () => {
    const t = [{ date: '2026-10-01', amount: -3000, description: 'TIENDA' }];
    expect(dedupeKeys('cuenta_vista', t)[0]).not.toBe(dedupeKeys('tarjeta_credito', t)[0]);
  });
});
