-- Esquema inicial. Ver plan/02-arquitectura.md#modelo-de-datos-d1

-- Cada PDF importado
CREATE TABLE statements (
  id INTEGER PRIMARY KEY,
  filename TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('cuenta_corriente', 'tarjeta_credito')),
  period_start TEXT,
  period_end TEXT,
  imported_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT
);

-- "Si la descripción contiene X → categoría Y"
CREATE TABLE category_rules (
  id INTEGER PRIMARY KEY,
  pattern TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,                       -- ISO yyyy-mm-dd
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,                  -- CLP; negativo = gasto, positivo = ingreso/abono
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (source IN ('pdf', 'manual')),
  statement_id INTEGER REFERENCES statements(id) ON DELETE SET NULL,
  dedupe_key TEXT UNIQUE,                   -- hash(fecha, monto, descripción normalizada, n° ocurrencia)
  installment TEXT                          -- ej. '3/12' si es compra en cuotas
);

CREATE INDEX idx_transactions_date ON transactions(date);

-- Presupuesto mensual, ingreso mensual, meses para el promedio
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE wishlist_items (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,                   -- CLP
  url TEXT,
  image_url TEXT,
  note TEXT,
  priority INTEGER NOT NULL DEFAULT 0,      -- orden; menor = antes
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'bought')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  bought_at TEXT
);
