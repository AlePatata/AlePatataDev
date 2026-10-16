/**
 * Lee las cartolas en Excel del Banco de Chile. Recibe las filas de la hoja como arreglo de arreglos
 * (lo que entrega SheetJS con `header: 1`) y no depende de la posición exacta de las celdas.
 * Formatos documentados en plan/07-fase-1.md.
 */

export type Cell = string | number | boolean | Date | null | undefined;

export type CartolaFormat = 'historica' | 'movimientos' | 'no_facturado';
export type AccountType = 'cuenta_vista' | 'tarjeta_credito';

export interface ParsedTransaction {
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number; // CLP; negativo = gasto
  installment?: string; // '3/12', solo si es en cuotas
  internal: boolean;
}

export interface ParsedCartola {
  format: CartolaFormat;
  accountType: AccountType;
  periodStart: string | null;
  periodEnd: string | null;
  closingBalance: number | null;
  transactions: ParsedTransaction[];
  warnings: string[];
}

export class CartolaError extends Error {}

const text = (c: Cell) => (c == null ? '' : String(c).trim());
const isNum = (c: Cell): c is number => typeof c === 'number' && Number.isFinite(c);
const cleanSpaces = (s: string) => s.replace(/\s+/g, ' ').trim();

function findCell(rows: Cell[][], match: (s: string) => boolean): [number, number] | null {
  for (let r = 0; r < rows.length; r++) {
    const c = (rows[r] ?? []).findIndex((cell) => match(text(cell)));
    if (c !== -1) return [r, c];
  }
  return null;
}

/** Primer número bajo una etiqueta (los resúmenes ponen el valor en la fila siguiente). */
function valueBelow(rows: Cell[][], label: string): number | null {
  const pos = findCell(rows, (s) => s === label);
  if (!pos) return null;
  for (let r = pos[0] + 1; r <= pos[0] + 3 && r < rows.length; r++) {
    const v = rows[r]?.[pos[1]];
    if (isNum(v)) return v;
  }
  return null;
}

/** Fila de encabezados de la tabla de movimientos y el índice de cada columna por nombre. */
function findHeader(rows: Cell[][]) {
  const r = rows.findIndex((row) => {
    const cells = (row ?? []).map(text);
    return cells.includes('Fecha') && cells.includes('Descripción');
  });
  if (r === -1) throw new CartolaError('No se encontró la tabla de movimientos.');
  const cells = rows[r].map(text);
  const col = (prefix: string) => cells.findIndex((s) => s.startsWith(prefix));
  return { row: r, col };
}

const fullDate = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const shortDate = /^(\d{2})\/(\d{2})$/;

function isoFromFull(s: string): string | null {
  const m = fullDate.exec(s.trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/** "al 16/10/2026", "Movimientos al 16/10/2026" → 2026-10-16 */
function isoAfterAl(s: string): string | null {
  const m = /al (\d{2}\/\d{2}\/\d{4})/.exec(s);
  return m ? isoFromFull(m[1]) : null;
}

export function parseCartola(rows: Cell[][]): ParsedCartola {
  if (findCell(rows, (s) => s.startsWith('Saldos y Movimientos No Facturados'))) return parseNoFacturado(rows);
  if (findCell(rows, (s) => s === 'Detalle Cartola Histórica')) return parseCuenta(rows, 'historica');
  if (findCell(rows, (s) => s.startsWith('Movimientos al '))) return parseCuenta(rows, 'movimientos');
  throw new CartolaError('El archivo no parece una cartola del Banco de Chile.');
}

const CUENTA_INTERNAL = [/^cargo por pago tc\b/i, /^traspaso de cuenta:/i];

function parseCuenta(rows: Cell[][], format: 'historica' | 'movimientos'): ParsedCartola {
  const { row: headerRow, col } = findHeader(rows);
  const iDate = col('Fecha');
  const iDesc = col('Descripción');
  const iCargo = col('Cargos');
  const iAbono = col('Abonos');
  const iSaldo = col('Saldo');
  if ([iDate, iDesc, iCargo, iAbono, iSaldo].includes(-1)) {
    throw new CartolaError('Faltan columnas en la tabla de movimientos.');
  }

  // La cartola histórica trae fechas sin año: sale de la fecha de emisión
  let emission: { year: number; month: number } | null = null;
  let asOf: string | null = null;
  if (format === 'historica') {
    const pos = findCell(rows, (s) => s === 'Fecha de Emisión');
    const value = pos && rows[pos[0]].slice(pos[1] + 1).map(text).find((s) => s);
    const iso = value ? isoFromFull(value) : null;
    if (!iso) throw new CartolaError('No se encontró la fecha de emisión de la cartola.');
    emission = { year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) };
  } else {
    const pos = findCell(rows, (s) => s.startsWith('Movimientos al '));
    asOf = pos ? isoAfterAl(text(rows[pos[0]][pos[1]])) : null;
  }

  const toIso = (s: string): string | null => {
    const full = isoFromFull(s);
    if (full) return full;
    const m = shortDate.exec(s);
    if (!m || !emission) return null;
    const month = Number(m[2]);
    // Movimiento de diciembre en una cartola emitida en enero → año anterior
    const year = month > emission.month ? emission.year - 1 : emission.year;
    return `${year}-${m[2]}-${m[1]}`;
  };

  const rowsOut: { tx: ParsedTransaction; balance: number | null }[] = [];
  const warnings: string[] = [];
  let openingBalance: number | null = null;
  let periodStart: string | null = null;
  let periodEnd: string | null = asOf;

  for (const row of rows.slice(headerRow + 1)) {
    if (!row) continue;
    const date = toIso(text(row[iDate]));
    if (!date) continue; // filas vacías y pie de página
    const description = cleanSpaces(text(row[iDesc]));
    const balance = isNum(row[iSaldo]) ? row[iSaldo] : null;

    if (/^saldo inicial$/i.test(description)) {
      openingBalance = balance;
      periodStart = date;
      continue;
    }
    if (/^saldo final$/i.test(description)) {
      periodEnd = date;
      continue;
    }

    const cargo = isNum(row[iCargo]) ? row[iCargo] : 0;
    const abono = isNum(row[iAbono]) ? row[iAbono] : 0;
    if (!cargo && !abono) {
      warnings.push(`Movimiento sin monto el ${date}: "${description}". Se omitió.`);
      continue;
    }
    rowsOut.push({
      tx: {
        date,
        description,
        amount: Math.round(abono - cargo),
        internal: CUENTA_INTERNAL.some((re) => re.test(description)),
      },
      balance,
    });
  }

  // "Movimientos" viene del más reciente al más antiguo
  if (format === 'movimientos') rowsOut.reverse();

  // Cuadrar saldos: el saldo de cada fila debe ser el anterior + el monto
  let running = openingBalance ?? (rowsOut[0]?.balance != null ? rowsOut[0].balance - rowsOut[0].tx.amount : null);
  for (const { tx, balance } of rowsOut) {
    if (running != null) running += tx.amount;
    if (balance != null) {
      if (running != null && running !== balance) {
        warnings.push(
          `El saldo no cuadra el ${tx.date} ("${tx.description}"): se esperaba ${running} y la cartola dice ${balance}.`,
        );
      }
      running = balance;
    }
  }

  const transactions = rowsOut.map((r) => r.tx);
  periodStart ??= transactions[0]?.date ?? null;
  periodEnd ??= transactions.at(-1)?.date ?? null;

  return {
    format,
    accountType: 'cuenta_vista',
    periodStart,
    periodEnd,
    closingBalance: valueBelow(rows, 'Saldo Contable'),
    transactions,
    warnings,
  };
}

function parseNoFacturado(rows: Cell[][]): ParsedCartola {
  const { row: headerRow, col } = findHeader(rows);
  const iDate = col('Fecha');
  const iDesc = col('Descripción');
  if (iDate === -1 || iDesc === -1) throw new CartolaError('Faltan columnas en la tabla de movimientos.');

  const asOfPos = findCell(rows, (s) => /^al \d{2}\/\d{2}\/\d{4}$/.test(s));
  const asOf = asOfPos ? isoAfterAl(text(rows[asOfPos[0]][asOfPos[1]])) : null;

  const transactions: ParsedTransaction[] = [];
  const warnings: string[] = [];

  for (const row of rows.slice(headerRow + 1)) {
    if (!row) continue;
    const date = isoFromFull(text(row[iDate]));
    if (!date) continue;
    // El banco pega "COMPRAS" al final, a veces sin espacio
    const description = cleanSpaces(text(row[iDesc]).replace(/\s*COMPRAS$/i, ''));
    // Los encabezados no calzan con los datos (celdas combinadas): el monto es el último número de la fila
    const amount = [...row].reverse().find(isNum);
    if (amount === undefined || amount === 0) {
      warnings.push(`Movimiento sin monto el ${date}: "${description}". Se omitió.`);
      continue;
    }
    const cuotas = row.map(text).find((s) => /^\d{2}\/\d{2}$/.test(s));
    const [current, total] = cuotas ? cuotas.split('/').map(Number) : [1, 1];

    transactions.push({
      date,
      description,
      amount: -Math.round(amount), // en la tarjeta, positivo = compra
      ...(total > 1 ? { installment: `${current}/${total}` } : {}),
      internal: amount < 0 && /^pago\b/i.test(description),
    });
  }

  transactions.reverse(); // viene del más reciente al más antiguo
  const used = valueBelow(rows, 'Cupo Utilizado');

  return {
    format: 'no_facturado',
    accountType: 'tarjeta_credito',
    periodStart: transactions[0]?.date ?? null,
    periodEnd: asOf ?? transactions.at(-1)?.date ?? null,
    closingBalance: used == null ? null : -used,
    transactions,
    warnings,
  };
}
