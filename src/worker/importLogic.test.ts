import { describe, expect, it } from 'vitest';
import type { ImportRequest } from '../shared/import';
import { dedupeKeys } from './dedupe';
import { classifyRows, searchRange, validateImport, type ExistingRow } from './importLogic';

const valid: ImportRequest = {
  dryRun: true,
  statement: {
    filename: 'cartola.xls',
    accountType: 'cuenta_vista',
    periodStart: '2026-09-22',
    periodEnd: '2026-09-30',
    closingBalance: 90500,
  },
  transactions: [
    { date: '2026-09-23', originalDescription: 'PAGO:CAFE', description: 'Café', amount: -2500, internal: false, include: true },
  ],
};

describe('validateImport', () => {
  it('acepta un cuerpo válido', () => {
    expect(validateImport(valid)).toBeNull();
  });

  it.each([
    ['sin dryRun', { ...valid, dryRun: undefined }],
    ['cuenta desconocida', { ...valid, statement: { ...valid.statement, accountType: 'otra' } }],
    ['sin movimientos', { ...valid, transactions: [] }],
    ['fecha inválida', { ...valid, transactions: [{ ...valid.transactions[0], date: '23/09/2026' }] }],
    ['monto con decimales', { ...valid, transactions: [{ ...valid.transactions[0], amount: -2.5 }] }],
    ['descripción vacía', { ...valid, transactions: [{ ...valid.transactions[0], description: '  ' }] }],
    ['cuotas raras', { ...valid, transactions: [{ ...valid.transactions[0], installment: 'dos' }] }],
  ])('rechaza: %s', (_name, body) => {
    expect(validateImport(body)).not.toBeNull();
  });
});

describe('classifyRows', () => {
  const rows = [
    { date: '2026-10-09', amount: -3500, originalDescription: 'MERPAGO*TIENDA PRUEBA' },
    { date: '2026-10-15', amount: -3500, originalDescription: 'MERPAGO*TIENDA PRUEBA' },
    { date: '2026-10-16', amount: -9990, originalDescription: 'LIBRERIA FALSA' },
  ];
  const keys = dedupeKeys('tarjeta_credito', rows.map((r) => ({ ...r, description: r.originalDescription })));

  it('marca como duplicada la fila cuya clave ya existe', () => {
    const existing: ExistingRow[] = [{ date: '2026-10-09', amount: -3500, description: 'MERPAGO*TIENDA PRUEBA', dedupe_key: keys[0] }];
    expect(classifyRows(rows, keys, existing)).toEqual(['duplicate', 'new', 'new']);
  });

  it('marca como posible duplicado una compra provisoria cuya descripción cambió', () => {
    const existing: ExistingRow[] = [
      { date: '2026-10-14', amount: -3500, description: 'MERPAGOTIENDAPRUEBA', dedupe_key: 'tarjeta_credito|2026-10-14|-3500|merpagotiendaprueba|1' },
    ];
    expect(classifyRows(rows, keys, existing)).toEqual(['new', 'possible', 'new']);
  });

  it('no confunde dos compras iguales en días distintos del mismo archivo', () => {
    const existing: ExistingRow[] = [{ date: '2026-10-09', amount: -3500, description: 'MERPAGO*TIENDA PRUEBA', dedupe_key: keys[0] }];
    const statuses = classifyRows(rows.slice(0, 2), keys.slice(0, 2), existing);
    expect(statuses).toEqual(['duplicate', 'new']);
  });
});

describe('searchRange', () => {
  it('amplía el rango del archivo en 3 días', () => {
    expect(searchRange(['2026-10-15', '2026-09-30', '2026-10-01'])).toEqual(['2026-09-27', '2026-10-18']);
  });
});
