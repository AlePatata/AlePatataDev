-- Ver plan/13-hobbies.md#codeforces. Todo esto ya es público en codeforces.com/profile.
-- Cada envío (de user.status), sin el código ni el email.
CREATE TABLE cf_submissions (
  id INTEGER PRIMARY KEY,       -- id del envío en Codeforces
  timestamp INTEGER NOT NULL,   -- s
  date TEXT NOT NULL,           -- yyyy-mm-dd, hora de Chile
  contest_id INTEGER,           -- NULL en problemas sin concurso (gym raros)
  problem_index TEXT NOT NULL,  -- 'A', 'D1'…
  problem_name TEXT NOT NULL,
  rating INTEGER,               -- dificultad; NULL si Codeforces no la tiene
  tags TEXT NOT NULL,           -- JSON con los tags
  verdict TEXT,                 -- 'OK' = AC; NULL mientras se evalúa
  participant_type TEXT NOT NULL -- CONTESTANT, PRACTICE, VIRTUAL…
);
CREATE INDEX idx_cf_submissions_date ON cf_submissions(date);

-- Un concurso con rating (de user.rating)
CREATE TABLE cf_contests (
  contest_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  timestamp INTEGER NOT NULL,   -- s, cuándo se actualizó el rating
  date TEXT NOT NULL,
  rank INTEGER NOT NULL,
  old_rating INTEGER NOT NULL,
  new_rating INTEGER NOT NULL
);
