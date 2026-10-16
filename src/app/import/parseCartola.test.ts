import { describe, expect, it } from 'vitest';
import { dedupeKeys } from '../../worker/dedupe';
import { CartolaError, parseCartola, type Cell } from './parseCartola';

// Fixtures inventados con la misma estructura que los Excel del banco (nombres y montos falsos).
const _ = null;

const encabezadoCuenta: Cell[][] = [
  ['Sr(a): ', 'Persona de Prueba', _, _, _, _],
  ['Rut:', '11.111.111-1', _, _, _, _],
  ['Cuenta:', '00-000-00000-00', _, _, _, _],
  ['Moneda:', 'Pesos Chilenos (CLP)', _, _, _, _],
  [],
];

function historica(emision: string, movimientos: Cell[][], saldoContable: number): Cell[][] {
  return [
    ...encabezadoCuenta,
    ['Detalle Cartola Histórica', _, 'Fecha de Emisión', ` ${emision}`, _, _],
    [],
    ['Folio Cartola', 'Saldo Contable', 'Retenciones 24 Hrs.', 'Retenciones 48 Hrs.', _, _],
    ['7', saldoContable, 0, 0, _, _],
    [],
    ['Fecha', 'Descripción', 'Canal o Sucursal', 'Cargos (PESOS)', 'Abonos (PESOS)', 'Saldo (PESOS)'],
    ...movimientos,
    [],
    ['Infórmate sobre la garantía estatal de los depósitos...', _, _, _, _, _],
  ];
}

const HISTORICA = historica(
  '30/09/2026',
  [
    ['22/09', 'SALDO INICIAL', _, _, _, 100000],
    ['23/09', 'TRASPASO A:Amiga Inventada', 'INTERNET', 5000, _, _],
    ['23/09', 'PAGO:CAFE DE PRUEBA', 'CENTRAL', 2500, _, 92500],
    ['25/09', 'TRASPASO DE:Amigo Ficticio', 'INTERNET', _, 8000, _],
    ['25/09', 'GIRO CAJERO AUTOMATICO      *', 'CENTRAL', 10000, _, 90500],
    ['30/09', 'SALDO FINAL', _, _, _, 90500],
  ],
  90500,
);

const MOVIMIENTOS: Cell[][] = [
  ...encabezadoCuenta,
  ['Saldos al 02/10/2026 10:00 Hrs.', _, _, _, _, _],
  [],
  ['Saldo Disponible', 'Saldo Contable', 'Retenciones 24 Hrs.', 'Retenciones 48 Hrs.', _, _],
  [140500, 140500, 0, 0, _, _],
  [],
  ['Movimientos al 02/10/2026', _, _, _, _, _],
  ['Fecha', 'Descripción', 'Canal o Sucursal', 'Cargos (CLP)', 'Abonos (CLP)', 'Saldo (CLP)'],
  ['01/10/2026', 'Traspaso De Cuenta:000000000000', 'Internet', _, 100000, 140500],
  ['01/10/2026', 'Cargo Por Pago Tc', 'Internet', 50000, _, 40500],
  ['25/09/2026', 'Giro Cajero Automatico             *', 'Oficina Central', 10000, _, 90500],
  ['25/09/2026', 'Traspaso De:Amigo Ficticio', 'Internet', _, 8000, 100500],
  ['23/09/2026', 'Pago:cafe de Prueba', 'Oficina Central', 2500, _, 92500],
  ['23/09/2026', 'Traspaso A:Amiga Inventada', 'Internet', 5000, _, 95000],
];

// Igual que en el banco: los encabezados no calzan con los datos (el monto está 2 columnas más allá)
const NO_FACTURADO: Cell[][] = [
  [],
  [_, 'Sr(a).: ', 'Persona de Prueba', _, _, _, _, _, _, _, _],
  [_, 'Tipo de Tarjeta:', 'Titular Visa ********0000', _, _, _, _, _, _, _, _],
  [_, 'Saldos y Movimientos No Facturados ', _, _, _, 'al 16/10/2026', _, _, _, _, _],
  [_, 'Cupo Disponible', _, _, 'Cupo Utilizado', _, _, 'Cupo Total', _, _, _],
  [_, 400000, _, _, 100000, _, _, 500000, _, _, _],
  [_, 'Movimientos Nacionales', _, _, _, _, _, _, _, _, _],
  [_, 'Fecha', 'Tipo de Tarjeta ', _, 'Descripción', _, 'Ciudad', 'Cuotas', 'Monto ($)', _, _],
  [_, '15/10/2026', 'Titular********0000', _, 'MERPAGOTIENDAPRUEBA', _, _, '01/01', '1 / 0', _, 3000],
  [_, '12/10/2026', 'Titular********0000', _, 'LIBRERIA FALSA COMPRAS', _, 'SANTIAGO', '01/01', '1 / 0', _, 12000],
  [_, '10/10/2026', 'Titular********0000', _, 'COMERCIO CON NOMBRE LARGOCOMPRAS', _, 'SANTIAGO', '01/01', '1 / 0', _, 4500],
  [_, '05/10/2026', 'Titular********0000', _, 'TIENDA EN CUOTAS COMPRAS', _, 'SANTIAGO', '02/06', '1 / 0', _, 15000],
  [_, '30/09/2026', 'Titular********0000', _, 'PAGO PESOS TEF PAGO NORMAL', _, _, '01/01', '1 / 0', _, -80000],
];

describe('parseCartola: cartola histórica', () => {
  const p = parseCartola(HISTORICA);

  it('reconoce el formato, el período y el saldo', () => {
    expect(p.format).toBe('historica');
    expect(p.accountType).toBe('cuenta_vista');
    expect(p.periodStart).toBe('2026-09-22');
    expect(p.periodEnd).toBe('2026-09-30');
    expect(p.closingBalance).toBe(90500);
  });

  it('lee los movimientos con año, signo y espacios limpios, sin las filas de saldo', () => {
    expect(p.transactions).toEqual([
      { date: '2026-09-23', description: 'TRASPASO A:Amiga Inventada', amount: -5000, internal: false },
      { date: '2026-09-23', description: 'PAGO:CAFE DE PRUEBA', amount: -2500, internal: false },
      { date: '2026-09-25', description: 'TRASPASO DE:Amigo Ficticio', amount: 8000, internal: false },
      { date: '2026-09-25', description: 'GIRO CAJERO AUTOMATICO *', amount: -10000, internal: false },
    ]);
    expect(p.warnings).toEqual([]);
  });

  it('usa el año anterior para movimientos de diciembre en una cartola emitida en enero', () => {
    const q = parseCartola(
      historica('05/01/2027', [['30/12', 'PAGO:FIN DE ANO', 'CENTRAL', 1000, _, 9000], ['02/01', 'PAGO:ANO NUEVO', 'CENTRAL', 1000, _, 8000]], 8000),
    );
    expect(q.transactions.map((t) => t.date)).toEqual(['2026-12-30', '2027-01-02']);
  });

  it('avisa si un saldo no cuadra', () => {
    const q = parseCartola(
      historica('30/09/2026', [['22/09', 'SALDO INICIAL', _, _, _, 10000], ['23/09', 'PAGO:ALGO', 'CENTRAL', 1000, _, 8500]], 8500),
    );
    expect(q.warnings).toHaveLength(1);
    expect(q.warnings[0]).toContain('se esperaba 9000');
  });
});

describe('parseCartola: movimientos de la cuenta', () => {
  const p = parseCartola(MOVIMIENTOS);

  it('reconoce el formato y ordena del más antiguo al más reciente', () => {
    expect(p.format).toBe('movimientos');
    expect(p.periodStart).toBe('2026-09-23');
    expect(p.periodEnd).toBe('2026-10-02');
    expect(p.closingBalance).toBe(140500);
    expect(p.transactions.map((t) => t.date)).toEqual([
      '2026-09-23', '2026-09-23', '2026-09-25', '2026-09-25', '2026-10-01', '2026-10-01',
    ]);
    expect(p.warnings).toEqual([]);
  });

  it('marca como internos el pago de la tarjeta y los traspasos desde otra cuenta propia', () => {
    const internos = p.transactions.filter((t) => t.internal).map((t) => t.description);
    expect(internos).toEqual(['Cargo Por Pago Tc', 'Traspaso De Cuenta:000000000000']);
  });

  it('da las mismas dedupe_key que la cartola histórica para los mismos movimientos', () => {
    const h = parseCartola(HISTORICA);
    const keysH = dedupeKeys(h.accountType, h.transactions);
    const keysM = new Set(dedupeKeys(p.accountType, p.transactions));
    expect(keysH.every((k) => keysM.has(k))).toBe(true);
  });
});

describe('parseCartola: tarjeta, movimientos no facturados', () => {
  const p = parseCartola(NO_FACTURADO);

  it('reconoce el formato, el período y la deuda', () => {
    expect(p.format).toBe('no_facturado');
    expect(p.accountType).toBe('tarjeta_credito');
    expect(p.periodStart).toBe('2026-09-30');
    expect(p.periodEnd).toBe('2026-10-16');
    expect(p.closingBalance).toBe(-100000);
  });

  it('toma el monto aunque las columnas estén desalineadas, quita "COMPRAS" y lee las cuotas', () => {
    expect(p.transactions).toEqual([
      { date: '2026-09-30', description: 'PAGO PESOS TEF PAGO NORMAL', amount: 80000, internal: true },
      { date: '2026-10-05', description: 'TIENDA EN CUOTAS', amount: -15000, installment: '2/6', internal: false },
      { date: '2026-10-10', description: 'COMERCIO CON NOMBRE LARGO', amount: -4500, internal: false },
      { date: '2026-10-12', description: 'LIBRERIA FALSA', amount: -12000, internal: false },
      { date: '2026-10-15', description: 'MERPAGOTIENDAPRUEBA', amount: -3000, internal: false },
    ]);
  });
});

describe('parseCartola: archivo irreconocible', () => {
  it('lanza un error claro', () => {
    expect(() => parseCartola([['Nombre', 'Monto'], ['algo', 1]])).toThrow(CartolaError);
    expect(() => parseCartola([])).toThrow('no parece una cartola');
  });
});
