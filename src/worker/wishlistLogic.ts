import type { ItemInput, ProductMeta } from '../shared/wishlist';

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Link `http(s)` a un sitio público: sin IPs, `localhost` ni nombres internos. */
export function isSafePublicUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  if (!host.includes('.') || host.startsWith('[')) return false; // sin dominio o IPv6
  if (/^\d+(\.\d+){3}$/.test(host)) return false; // IPv4
  if (/(^|\.)(localhost|local|internal|lan|home|test|invalid)$/.test(host)) return false;
  return true;
}

const isOptionalUrl = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.length <= 2000 && isSafePublicUrl(v));

/** Valida un item a crear (`partial = false`) o los campos a cambiar. Devuelve el error o `null`. */
export function validateItem(body: unknown, partial: boolean): string | null {
  if (!isObject(body)) return 'Cuerpo inválido';
  const b = body as Partial<ItemInput>;
  const fields = ['name', 'price', 'url', 'imageUrl', 'note', 'status'] as const;
  if (partial && fields.every((k) => b[k] === undefined)) return 'No hay nada que cambiar';
  if ((!partial || b.name !== undefined) && (typeof b.name !== 'string' || !b.name.trim() || b.name.length > 200)) {
    return 'Nombre inválido';
  }
  if ((!partial || b.price !== undefined) && (!Number.isSafeInteger(b.price) || b.price! < 0)) {
    return 'El precio debe ser un número entero en pesos';
  }
  if (!isOptionalUrl(b.url)) return 'El link de la tienda no es válido';
  if (!isOptionalUrl(b.imageUrl)) return 'El link de la imagen no es válido';
  if (b.note !== undefined && b.note !== null && (typeof b.note !== 'string' || b.note.length > 500)) return 'Nota demasiado larga';
  if (b.status !== undefined && b.status !== 'pending' && b.status !== 'bought') return 'Estado inválido';
  return null;
}

/** `{ ids: [3, 1, 2] }`: ids enteros y sin repetir. */
export function validateReorder(body: unknown): string | null {
  if (!isObject(body) || !Array.isArray(body.ids) || body.ids.length === 0) return 'Faltan los ids';
  if (!body.ids.every((id) => Number.isSafeInteger(id))) return 'Ids inválidos';
  if (new Set(body.ids).size !== body.ids.length) return 'Ids repetidos';
  return null;
}

const ENTITIES: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}

/** "19.990", "$ 19.990", "19990", 19990.0, "19,990" → 19990. CLP no usa decimales. */
export function parsePrice(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
  if (typeof value !== 'string') return null;
  const s = value.replace(/[^\d.,]/g, '');
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, ''));
  if (/^\d+([.,]\d{1,2})?$/.test(s)) return Math.round(Number(s.replace(',', '.')));
  return null;
}

const isClp = (currency: unknown) => currency == null || currency === '' || String(currency).toUpperCase() === 'CLP';

function absoluteUrl(value: string | undefined | null, base: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(decodeEntities(value.trim()), base).href;
    return isSafePublicUrl(url) ? url : null;
  } catch {
    return null;
  }
}

/** Busca un `Product` en el JSON-LD (puede venir en un arreglo o en `@graph`). */
function findProduct(node: unknown): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const n of node) {
      const found = findProduct(n);
      if (found) return found;
    }
    return null;
  }
  if (!isObject(node)) return null;
  const type = node['@type'];
  if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) return node;
  return findProduct(node['@graph']);
}

function productFromJsonLd(html: string) {
  for (const m of html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const product = findProduct(JSON.parse(m[1].trim()));
      if (!product) continue;
      const offers = ([] as unknown[]).concat(product.offers ?? []).filter(isObject);
      const offer = offers.find((o) => isClp(o.priceCurrency) && parsePrice(o.price ?? o.lowPrice) != null);
      const image = ([] as unknown[]).concat(product.image ?? [])[0];
      return {
        name: typeof product.name === 'string' ? product.name : null,
        image: typeof image === 'string' ? image : isObject(image) && typeof image.url === 'string' ? image.url : null,
        price: offer ? parsePrice(offer.price ?? offer.lowPrice) : null,
      };
    } catch {
      // JSON-LD mal formado: se ignora
    }
  }
  return null;
}

/**
 * Nombre, imagen y precio (CLP) de la página de un producto, a partir de las etiquetas Open Graph,
 * los metadatos de producto y el JSON-LD. Lo que no encuentra queda en `null`.
 */
export function parseProductMeta(html: string, pageUrl: string): ProductMeta {
  const meta = new Map<string, string>();
  for (const [tag] of html.matchAll(/<meta\s[^>]*>/gi)) {
    const attrs = new Map<string, string>();
    for (const a of tag.matchAll(/([a-zA-Z:_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs.set(a[1].toLowerCase(), a[2] ?? a[3]);
    const key = (attrs.get('property') ?? attrs.get('name') ?? attrs.get('itemprop'))?.toLowerCase();
    const content = attrs.get('content');
    if (key && content != null && !meta.has(key)) meta.set(key, decodeEntities(content).trim());
  }
  const product = productFromJsonLd(html);
  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];

  const title = meta.get('og:title') || meta.get('twitter:title') || product?.name || (titleTag ? decodeEntities(titleTag).trim() : '');

  const image =
    absoluteUrl(meta.get('og:image') ?? meta.get('og:image:secure_url') ?? meta.get('og:image:url'), pageUrl) ??
    absoluteUrl(meta.get('twitter:image') ?? meta.get('twitter:image:src'), pageUrl) ??
    absoluteUrl(product?.image, pageUrl);

  let price: number | null = null;
  for (const [amount, currency] of [
    ['product:price:amount', 'product:price:currency'],
    ['og:price:amount', 'og:price:currency'],
  ]) {
    if (meta.has(amount) && isClp(meta.get(currency))) {
      price = parsePrice(meta.get(amount));
      if (price != null) break;
    }
  }
  price ??= product?.price ?? (isClp(meta.get('pricecurrency')) ? parsePrice(meta.get('price')) : null);

  return { title: title ? title.replace(/\s+/g, ' ').slice(0, 200) : null, imageUrl: image, price };
}
