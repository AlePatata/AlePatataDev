import { Hono } from 'hono';
import type { ItemInput, ProductMeta, WishlistItem, WishlistResponse } from '../shared/wishlist';
import type { AppEnv } from './auth';
import { loadSettings } from './db';
import { isSafePublicUrl, parseProductMeta, validateItem, validateReorder } from './wishlistLogic';

export const wishlist = new Hono<AppEnv>();

const COLUMNS = `id, name, price, url, image_url AS imageUrl, note, priority, status, created_by AS createdBy,
  created_at AS createdAt, bought_at AS boughtAt`;

const cleanText = (v: string | null | undefined) => (v == null || !v.trim() ? null : v.trim());

/** Pendientes por prioridad, después los comprados (el más reciente primero). */
wishlist.get('/', async (c) => {
  const [{ results }, settings] = await Promise.all([
    c.env.DB.prepare(
      `SELECT ${COLUMNS} FROM wishlist_items
        ORDER BY status = 'bought', CASE WHEN status = 'pending' THEN priority END, bought_at DESC, id`,
    ).all<WishlistItem>(),
    loadSettings(c.env.DB),
  ]);
  return c.json<WishlistResponse>({ items: results, names: { owner: settings.ownerName, partner: settings.partnerName } });
});

/** Un item nuevo queda al final de los pendientes. Se guarda el rol de quien lo agregó, no su email. */
wishlist.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const error = validateItem(body, false);
  if (error) return c.json({ error }, 400);
  const t = body as ItemInput;
  const row = await c.env.DB.prepare(
    `INSERT INTO wishlist_items (name, price, url, image_url, note, priority, created_by)
     VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(priority), -1) + 1 FROM wishlist_items WHERE status = 'pending'), ?)
     RETURNING id`,
  )
    .bind(t.name.trim(), t.price, cleanText(t.url), cleanText(t.imageUrl), cleanText(t.note), c.get('role'))
    .first<{ id: number }>();
  return c.json({ id: row!.id }, 201);
});

/** Editar campos o marcar como comprado / pendiente (al volver a pendiente queda al final). */
wishlist.patch('/:id{[0-9]+}', async (c) => {
  const body = await c.req.json().catch(() => null);
  const error = validateItem(body, true);
  if (error) return c.json({ error }, 400);
  const t = body as Partial<ItemInput>;

  const sets: string[] = [];
  const params: (string | number | null)[] = [];
  const set = (sql: string, ...values: (string | number | null)[]) => {
    sets.push(sql);
    params.push(...values);
  };
  if (t.name !== undefined) set('name = ?', t.name.trim());
  if (t.price !== undefined) set('price = ?', t.price);
  if (t.url !== undefined) set('url = ?', cleanText(t.url));
  if (t.imageUrl !== undefined) set('image_url = ?', cleanText(t.imageUrl));
  if (t.note !== undefined) set('note = ?', cleanText(t.note));
  if (t.status === 'bought') set("status = 'bought', bought_at = COALESCE(bought_at, datetime('now'))");
  if (t.status === 'pending') {
    set(
      "status = 'pending', bought_at = NULL, priority = (SELECT COALESCE(MAX(priority), -1) + 1 FROM wishlist_items WHERE status = 'pending')",
    );
  }

  const res = await c.env.DB.prepare(`UPDATE wishlist_items SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...params, Number(c.req.param('id')))
    .run();
  if (!res.meta.changes) return c.json({ error: 'not_found' }, 404);
  return c.json({ ok: true });
});

wishlist.delete('/:id{[0-9]+}', async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM wishlist_items WHERE id = ?').bind(Number(c.req.param('id'))).run();
  if (!res.meta.changes) return c.json({ error: 'not_found' }, 404);
  return c.json({ ok: true });
});

/** `{ ids }` en el orden nuevo: la prioridad pasa a ser la posición. */
wishlist.post('/reorder', async (c) => {
  const body = await c.req.json().catch(() => null);
  const error = validateReorder(body);
  if (error) return c.json({ error }, 400);
  const update = c.env.DB.prepare('UPDATE wishlist_items SET priority = ? WHERE id = ?');
  await c.env.DB.batch((body as { ids: number[] }).ids.map((id, i) => update.bind(i, id)));
  return c.json({ ok: true });
});

const MAX_PAGE_BYTES = 1_000_000;
const EMPTY: ProductMeta = { title: null, imageUrl: null, price: null };

/** Descarga una página pública siguiendo redirecciones, revisando cada destino. */
async function fetchPage(start: string): Promise<{ html: string; url: string } | null> {
  let url = start;
  for (let hop = 0; hop < 5; hop++) {
    if (!isSafePublicUrl(url)) return null;
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; alepatata-wishlist/1.0; +https://alepatata.dev)',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'es-CL,es;q=0.9',
      },
    });
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url).href;
      continue;
    }
    if (!res.ok || !res.body || !(res.headers.get('content-type') ?? '').includes('html')) return null;

    // Lee como máximo ~1 MB: los metadatos están en el <head>
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_PAGE_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.byteLength;
    }
    await reader.cancel().catch(() => {});
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk.subarray(0, Math.min(chunk.byteLength, size - offset)), offset);
      offset += chunk.byteLength;
    }
    return { html: new TextDecoder().decode(bytes), url };
  }
  return null;
}

/** Nombre, imagen y precio desde el link de una tienda. Siempre responde 200: lo que no encuentra va en null. */
wishlist.post('/preview', async (c) => {
  const body = await c.req.json().catch(() => null);
  const url = typeof body?.url === 'string' ? body.url.trim() : '';
  if (!isSafePublicUrl(url)) return c.json({ error: 'El link no es válido' }, 400);
  try {
    const page = await fetchPage(url);
    return c.json<ProductMeta>(page ? parseProductMeta(page.html, page.url) : EMPTY);
  } catch {
    return c.json<ProductMeta>(EMPTY);
  }
});
