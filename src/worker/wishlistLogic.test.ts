import { describe, expect, it } from 'vitest';
import { isSafePublicUrl, parsePrice, parseProductMeta, validateItem, validateReorder } from './wishlistLogic';

describe('isSafePublicUrl', () => {
  it('acepta links públicos http(s)', () => {
    expect(isSafePublicUrl('https://www.tienda.cl/producto/123?color=rosa')).toBe(true);
    expect(isSafePublicUrl('http://tienda.com')).toBe(true);
  });

  it('rechaza otros protocolos, IPs y nombres internos', () => {
    for (const url of [
      'javascript:alert(1)',
      'ftp://tienda.cl',
      'http://localhost:8787',
      'http://127.0.0.1/admin',
      'http://[::1]/',
      'http://intranet/',
      'http://nas.local/',
      'https://user:pass@tienda.cl',
      'no es un link',
    ]) {
      expect(isSafePublicUrl(url), url).toBe(false);
    }
  });
});

describe('validateItem', () => {
  const ok = { name: 'Audífonos', price: 49990, url: 'https://tienda.cl/audifonos', imageUrl: null, note: 'Los rosados' };

  it('acepta un item completo o un cambio parcial', () => {
    expect(validateItem(ok, false)).toBeNull();
    expect(validateItem({ name: 'Viaje', price: 0 }, false)).toBeNull();
    expect(validateItem({ status: 'bought' }, true)).toBeNull();
  });

  it('rechaza datos inválidos', () => {
    expect(validateItem({ ...ok, name: ' ' }, false)).toBe('Nombre inválido');
    expect(validateItem({ ...ok, price: 499.9 }, false)).not.toBeNull();
    expect(validateItem({ name: 'Algo' }, false)).not.toBeNull(); // sin precio
    expect(validateItem({ ...ok, url: 'javascript:alert(1)' }, false)).toBe('El link de la tienda no es válido');
    expect(validateItem({ ...ok, imageUrl: 'http://localhost/x.png' }, false)).toBe('El link de la imagen no es válido');
    expect(validateItem({ status: 'regalado' }, true)).toBe('Estado inválido');
    expect(validateItem({}, true)).toBe('No hay nada que cambiar');
  });
});

describe('validateReorder', () => {
  it('exige ids enteros sin repetir', () => {
    expect(validateReorder({ ids: [3, 1, 2] })).toBeNull();
    expect(validateReorder({ ids: [] })).not.toBeNull();
    expect(validateReorder({ ids: [1, 1] })).toBe('Ids repetidos');
    expect(validateReorder({ ids: ['1'] })).toBe('Ids inválidos');
  });
});

describe('parsePrice', () => {
  it('entiende los formatos comunes en Chile', () => {
    expect(parsePrice('19.990')).toBe(19990);
    expect(parsePrice('$ 1.299.990')).toBe(1299990);
    expect(parsePrice('19990')).toBe(19990);
    expect(parsePrice('19990.00')).toBe(19990);
    expect(parsePrice(19990)).toBe(19990);
    expect(parsePrice('gratis')).toBeNull();
    expect(parsePrice(null)).toBeNull();
  });
});

describe('parseProductMeta', () => {
  const url = 'https://www.tienda.cl/p/audifonos-123';

  it('lee Open Graph y los metadatos de producto, en cualquier orden de atributos', () => {
    const html = `<html><head>
      <title>Audífonos | Tienda</title>
      <meta content="Audífonos Rosados &amp; Bluetooth" property="og:title">
      <meta property='og:image' content='/img/audifonos.jpg'>
      <meta property="product:price:amount" content="49.990">
      <meta property="product:price:currency" content="CLP">
    </head></html>`;
    expect(parseProductMeta(html, url)).toEqual({
      title: 'Audífonos Rosados & Bluetooth',
      imageUrl: 'https://www.tienda.cl/img/audifonos.jpg',
      price: 49990,
    });
  });

  it('usa el JSON-LD de Product (offers como lista, dentro de @graph)', () => {
    const html = `<head><title>Lámpara</title>
      <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebPage"},
        {"@type":"Product","name":"Lámpara de escritorio","image":["https://cdn.tienda.cl/lampara.webp"],
         "offers":[{"@type":"Offer","price":"24990","priceCurrency":"CLP"}]}]}</script></head>`;
    // El nombre del producto le gana al <title>, que suele traer el nombre de la tienda
    expect(parseProductMeta(html, url)).toEqual({
      title: 'Lámpara de escritorio',
      imageUrl: 'https://cdn.tienda.cl/lampara.webp',
      price: 24990,
    });
  });

  it('ignora precios en otra moneda y JSON-LD mal formado', () => {
    const html = `<meta property="og:title" content="Libro">
      <meta property="og:price:amount" content="15.00"><meta property="og:price:currency" content="USD">
      <script type="application/ld+json">{ esto no es json </script>`;
    expect(parseProductMeta(html, url)).toEqual({ title: 'Libro', imageUrl: null, price: null });
  });

  it('cae al <title> y descarta imágenes con links no públicos', () => {
    const html = `<title>  Mochila
      verde </title><meta name="twitter:image" content="http://localhost/x.png">`;
    expect(parseProductMeta(html, url)).toEqual({ title: 'Mochila verde', imageUrl: null, price: null });
  });

  it('devuelve todo en null si la página no trae nada', () => {
    expect(parseProductMeta('<div id="app"></div>', url)).toEqual({ title: null, imageUrl: null, price: null });
  });
});
