// Tipos de la API de importación, compartidos entre la app y el Worker.

export type AccountType = 'cuenta_vista' | 'cuenta_corriente' | 'tarjeta_credito';

export interface ImportTransaction {
  date: string; // ISO yyyy-mm-dd
  /** Descripción tal como vino en la cartola: con ella se calcula la dedupe_key */
  originalDescription: string;
  /** Descripción a guardar (se puede editar en la vista previa) */
  description: string;
  amount: number; // CLP; negativo = gasto
  installment?: string;
  internal: boolean;
  /** Si se guarda. Se mandan todas las filas para que el n° de ocurrencia no cambie al excluir una */
  include: boolean;
}

export interface ImportRequest {
  dryRun: boolean;
  statement: {
    filename: string;
    accountType: AccountType;
    periodStart: string | null;
    periodEnd: string | null;
    closingBalance: number | null;
  };
  transactions: ImportTransaction[];
}

/** `duplicate`: ya está guardada. `possible`: parecida a una guardada (movimiento provisorio de la tarjeta). */
export type RowStatus = 'new' | 'duplicate' | 'possible';

export interface ImportResponse {
  statuses: RowStatus[];
  inserted: number;
  skipped: number;
}
