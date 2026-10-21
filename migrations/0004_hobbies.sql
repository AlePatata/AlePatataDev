-- Ver plan/13-hobbies.md#modelo-de-datos.
-- Un día por hobby, para el heatmap de /hobbies. Cada adaptador recalcula sus días al sincronizar.
CREATE TABLE activity (
  date TEXT NOT NULL,       -- yyyy-mm-dd, hora de Chile
  source TEXT NOT NULL CHECK (source IN ('codeforces', 'monkeytype', 'trakt', 'wordle', 'cube')),
  count INTEGER NOT NULL,   -- envíos, tests, episodios/películas, 1 por wordle, resoluciones
  summary TEXT,             -- "3 AC, máx 1600", "4/6", "2 episodios de Severance"
  PRIMARY KEY (date, source)
);
