-- Ver plan/07-fase-1.md, paso 1. Ambas tablas estaban vacías al crear esta migración.
-- SQLite no permite cambiar una CHECK, así que se recrean:
-- - statements: acepta 'cuenta_vista' y guarda el saldo final.
-- - transactions: source 'import' (desde la cartola, en cualquier formato) en vez de 'pdf',
--   y la marca de movimiento interno.
PRAGMA defer_foreign_keys = true;

DROP TABLE transactions;
DROP TABLE statements;

CREATE TABLE statements (
  id INTEGER PRIMARY KEY,
  filename TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('cuenta_vista', 'cuenta_corriente', 'tarjeta_credito')),
  period_start TEXT,
  period_end TEXT,
  closing_balance INTEGER,                  -- saldo final (cuenta) o −cupo utilizado (tarjeta)
  imported_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,                       -- ISO yyyy-mm-dd
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,                  -- CLP; negativo = gasto, positivo = ingreso/abono
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (source IN ('import', 'manual')),
  statement_id INTEGER REFERENCES statements(id) ON DELETE SET NULL,
  dedupe_key TEXT UNIQUE,                   -- cuenta | fecha | monto | descripción normalizada | n° ocurrencia
  installment TEXT,                         -- ej. '3/12' si es compra en cuotas
  internal INTEGER NOT NULL DEFAULT 0 CHECK (internal IN (0, 1))  -- pago de tarjeta, traspaso entre cuentas propias
);

CREATE INDEX idx_transactions_date ON transactions(date);
