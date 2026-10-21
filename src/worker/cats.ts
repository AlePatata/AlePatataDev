import { Hono } from 'hono';
import { CAT_LIMITS, isEmotion, type CatLooks } from '../shared/cats';
import type { AppEnv } from './auth';
import { cleanMessages, sniffImage, validateLookChange } from './catsLogic';

/** Cómo se ve cada emoción configurada (sin los bytes de las imágenes). */
async function loadLooks(db: D1Database): Promise<CatLooks> {
  const [looks, frames] = await db.batch<Record<string, unknown>>([
    db.prepare('SELECT emotion, frame_ms AS frameMs, messages FROM cat_looks'),
    db.prepare('SELECT id, emotion FROM cat_frames ORDER BY emotion, position'),
  ]);
  const result: CatLooks = {};
  const lookFor = (emotion: unknown) => {
    if (!isEmotion(emotion)) return undefined;
    return (result[emotion] ??= { frames: [], frameMs: CAT_LIMITS.defaultFrameMs, messages: [] });
  };
  for (const row of looks.results as { emotion: string; frameMs: number; messages: string | null }[]) {
    const look = lookFor(row.emotion);
    if (!look) continue;
    look.frameMs = row.frameMs;
    look.messages = row.messages ? (JSON.parse(row.messages) as string[]) : [];
  }
  for (const row of frames.results as { id: string; emotion: string }[]) lookFor(row.emotion)?.frames.push(row.id);
  return result;
}

const frameIdsOf = async (db: D1Database, emotion: string) =>
  (await db.prepare('SELECT id FROM cat_frames WHERE emotion = ? ORDER BY position').bind(emotion).all<{ id: string }>()).results.map(
    (r) => r.id,
  );

const ensureLook = (db: D1Database, emotion: string) =>
  db.prepare('INSERT INTO cat_looks (emotion) VALUES (?) ON CONFLICT(emotion) DO NOTHING').bind(emotion);

/** Lectura pública: los gatitos salen también en el portafolio (Access tiene Bypass para /api/public/*). */
export const publicCats = new Hono<AppEnv>();

publicCats.get('/', async (c) => {
  c.header('Cache-Control', 'public, max-age=60');
  return c.json(await loadLooks(c.env.DB));
});

publicCats.get('/frames/:id{[0-9a-f-]{36}}', async (c) => {
  const row = await c.env.DB.prepare('SELECT mime, data FROM cat_frames WHERE id = ?')
    .bind(c.req.param('id'))
    .first<{ mime: string; data: ArrayBuffer | number[] }>();
  if (!row) return c.json({ error: 'not_found' }, 404);
  return c.body(new Uint8Array(row.data), 200, {
    'Content-Type': row.mime,
    // Cada imagen subida tiene un id nuevo, así que no cambia nunca
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  });
});

/** Escritura: solo la dueña (el pololo no pasa `canAccess`). */
export const cats = new Hono<AppEnv>();

cats.get('/', async (c) => c.json(await loadLooks(c.env.DB)));

/** `POST /api/cats/:emotion/frames` con el archivo tal cual en el body: se agrega al final. */
cats.post('/:emotion/frames', async (c) => {
  const emotion = c.req.param('emotion');
  if (!isEmotion(emotion)) return c.json({ error: 'not_found' }, 404);
  const tooBig = { error: `La imagen puede pesar hasta ${CAT_LIMITS.maxImageBytes / 1024 / 1024} MB` };
  if (Number(c.req.header('content-length') ?? 0) > CAT_LIMITS.maxImageBytes) return c.json(tooBig, 413);
  const data = await c.req.arrayBuffer();
  if (data.byteLength > CAT_LIMITS.maxImageBytes) return c.json(tooBig, 413);
  const mime = sniffImage(new Uint8Array(data));
  if (!mime) return c.json({ error: 'Solo PNG, JPEG, GIF o WebP' }, 415);

  const { count, last } = (await c.env.DB.prepare('SELECT COUNT(*) AS count, MAX(position) AS last FROM cat_frames WHERE emotion = ?')
    .bind(emotion)
    .first<{ count: number; last: number | null }>())!;
  if (count >= CAT_LIMITS.maxFrames) return c.json({ error: `Cada gatito puede tener hasta ${CAT_LIMITS.maxFrames} imágenes` }, 409);

  await c.env.DB.batch([
    ensureLook(c.env.DB, emotion),
    c.env.DB.prepare('INSERT INTO cat_frames (id, emotion, position, mime, data) VALUES (?, ?, ?, ?, ?)').bind(
      crypto.randomUUID(),
      emotion,
      (last ?? -1) + 1,
      mime,
      data,
    ),
  ]);
  return c.json(await loadLooks(c.env.DB), 201);
});

/** `PUT /api/cats/:emotion` con `{ frameIds?, frameMs?, messages? }`: orden, velocidad y frases. */
cats.put('/:emotion', async (c) => {
  const emotion = c.req.param('emotion');
  if (!isEmotion(emotion)) return c.json({ error: 'not_found' }, 404);
  const body = await c.req.json().catch(() => null);
  const error = validateLookChange(body, await frameIdsOf(c.env.DB, emotion));
  if (error) return c.json({ error }, 400);

  const { frameIds, frameMs, messages } = body as { frameIds?: string[]; frameMs?: number; messages?: string[] };
  const db = c.env.DB;
  const changes = [ensureLook(db, emotion)];
  if (frameMs !== undefined) changes.push(db.prepare('UPDATE cat_looks SET frame_ms = ? WHERE emotion = ?').bind(frameMs, emotion));
  if (messages !== undefined) {
    const kept = cleanMessages(messages);
    changes.push(db.prepare('UPDATE cat_looks SET messages = ? WHERE emotion = ?').bind(kept && JSON.stringify(kept), emotion));
  }
  frameIds?.forEach((id, position) => changes.push(db.prepare('UPDATE cat_frames SET position = ? WHERE id = ?').bind(position, id)));
  await db.batch(changes);
  return c.json(await loadLooks(db));
});

cats.delete('/frames/:id', async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM cat_frames WHERE id = ?').bind(c.req.param('id')).run();
  if (!res.meta.changes) return c.json({ error: 'not_found' }, 404);
  return c.json(await loadLooks(c.env.DB));
});
