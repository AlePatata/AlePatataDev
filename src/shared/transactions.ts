// Tipos de la API de transacciones, compartidos entre la app y el Worker.
import type { AccountType } from './import';

/** Cuenta de la que viene un movimiento; `manual` = agregado a mano (por ejemplo, efectivo). */
export type AccountFilter = AccountType | 'manual';

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  installment: string | null;
  internal: boolean;
  source: 'import' | 'manual';
  account: AccountType | null;
}

/** Totales del mes sin los movimientos internos. */
export interface MonthTotals {
  spent: number; // suma de los gastos (negativa)
  received: number; // suma de los abonos
  net: number;
  internalCount: number;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  totals: MonthTotals;
}

export interface TransactionInput {
  date: string;
  description: string;
  amount: number;
  internal?: boolean;
}
