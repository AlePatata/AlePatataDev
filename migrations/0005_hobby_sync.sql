-- Ver plan/13-hobbies.md.
-- Cada Wordle jugado, solo con colores: ni mis intentos ni la solución se guardan.
CREATE TABLE wordles (
  number INTEGER PRIMARY KEY,   -- 1949; el 0 fue el 2021-06-19
  date TEXT NOT NULL,           -- yyyy-mm-dd
  result INTEGER,               -- intentos; NULL = perdido
  hard_mode INTEGER NOT NULL DEFAULT 0,
  rows TEXT NOT NULL            -- "BYBBB/BBGYB/GGGGG": G verde, Y amarillo, B gris
);

-- Cómo le fue a la última sincronización de cada fuente (se ve en Ajustes)
CREATE TABLE sync_status (
  source TEXT PRIMARY KEY,
  last_sync TEXT,               -- ISO, última vez que funcionó
  last_error TEXT,              -- NULL si la última vez funcionó
  updated_at TEXT
);
