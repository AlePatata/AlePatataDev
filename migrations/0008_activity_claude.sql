-- Ver plan/13-hobbies.md#vibe-coding-este-repo-en-github.
-- Suma 'claude' a las fuentes del heatmap. SQLite no deja cambiar un CHECK: se rehace la tabla.
CREATE TABLE activity_new (
  date TEXT NOT NULL,       -- yyyy-mm-dd, hora de Chile
  source TEXT NOT NULL CHECK (source IN ('codeforces', 'monkeytype', 'trakt', 'wordle', 'cube', 'claude')),
  count INTEGER NOT NULL,   -- envíos, tests, episodios/películas, 1 por wordle, resoluciones, commits
  summary TEXT,             -- "3 AC, máx 1600", "4/6", "2 episodios de Severance"
  PRIMARY KEY (date, source)
);
INSERT INTO activity_new (date, source, count, summary) SELECT date, source, count, summary FROM activity;
DROP TABLE activity;
ALTER TABLE activity_new RENAME TO activity;
