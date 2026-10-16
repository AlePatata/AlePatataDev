import { normalizeDescription } from '../shared/text';

export { normalizeDescription };

/** Lo mínimo de una transacción para calcular su `dedupe_key`. */
export interface DedupeInput {
  date: string;
  amount: number;
  description: string;
}

/**
 * `cuenta | fecha | monto | descripción normalizada | n° de ocurrencia`. El n° cuenta los movimientos
 * idénticos del mismo archivo, así que dos compras iguales el mismo día no se pisan, y no depende del
 * orden en que vengan.
 */
export function dedupeKeys(account: string, transactions: DedupeInput[]): string[] {
  const seen = new Map<string, number>();
  return transactions.map((t) => {
    const base = `${account}|${t.date}|${t.amount}|${normalizeDescription(t.description)}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return `${base}|${n}`;
  });
}
