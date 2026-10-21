-- Ver plan/14-gatitos-imagenes.md.
-- Cómo se ve cada emoción de los gatitos. Sin fila (o sin cuadros) = el dibujo de siempre.
CREATE TABLE cat_looks (
  emotion  TEXT PRIMARY KEY,
  frame_ms INTEGER NOT NULL DEFAULT 500,
  messages TEXT              -- JSON con las frases; NULL = las de siempre
);

-- Las imágenes de cada emoción, en orden. Son públicas (salen en el portafolio).
CREATE TABLE cat_frames (
  id       TEXT PRIMARY KEY, -- uuid, nunca se reutiliza: la imagen se cachea para siempre
  emotion  TEXT NOT NULL,
  position INTEGER NOT NULL,
  mime     TEXT NOT NULL,
  data     BLOB NOT NULL
);

CREATE INDEX idx_cat_frames_emotion ON cat_frames(emotion, position);
