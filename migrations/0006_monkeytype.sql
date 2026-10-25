-- Ver plan/13-hobbies.md#monkeytype.
-- Cada test de Monkeytype (sin el uid de la cuenta).
CREATE TABLE mt_results (
  id TEXT PRIMARY KEY,          -- _id de Monkeytype
  timestamp INTEGER NOT NULL,   -- ms
  date TEXT NOT NULL,           -- yyyy-mm-dd, hora de Chile
  wpm REAL NOT NULL,
  raw REAL NOT NULL,
  acc REAL NOT NULL,
  consistency REAL NOT NULL,
  mode TEXT NOT NULL,
  mode2 TEXT NOT NULL
);
CREATE INDEX idx_mt_results_timestamp ON mt_results(timestamp);

-- Lo último que dijo cada API que no es una lista (PB, totales, racha…), como JSON
CREATE TABLE hobby_snapshots (
  key TEXT PRIMARY KEY,         -- 'monkeytype'
  json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
