# 09 — Fase 3 en detalle: wishlist compartida

Planificada el 2026-10-16. Objetivo y criterio de "listo" en [03-roadmap.md](03-roadmap.md#fase-3--wishlist-compartida).
Se trabaja en la rama `fase-3`: un commit por paso, con build, lint y tests limpios.

## Decisiones (2026-10-16)

- **Es una lista de los dos**: cosas que queremos comprar juntos. Cómo entra en la proyección de mi
  ahorro (qué parte pago yo) se decide en la Fase 4 (decisión 12).
- **Mi pololo solo ve y agrega.** Editar, reordenar, marcar como comprado y borrar quedan para mí.
- **La imagen sale sola desde el link** de la tienda; si la página no la entrega, se puede pegar el link
  de una imagen o dejarla sin imagen.

## Diseño

### Permisos por método

Hoy el Worker deja al pololo usar cualquier método en `/api/wishlist*`. Pasa a ser:

| Pololo | Dueña |
|---|---|
| `GET /api/me`, `GET /api/wishlist`, `POST /api/wishlist` (agregar), `POST /api/wishlist/preview` (leer un link) | todo |

`canAccess(role, method, path)` sigue siendo una función pura, con tests. Cualquier otra cosa → `403`.

### Items

Se usa la tabla `wishlist_items` que ya existe (sin migración):

- `name`, `price` (CLP, entero), `url` (link de la tienda), `image_url`, `note`.
- `priority`: orden de la lista (menor = antes). Un item nuevo queda al final.
- `status`: `pending` / `bought`, con `bought_at`. Los comprados pasan a un historial.
- `created_by`: se guarda el **rol** (`owner` / `partner`), no el email. Así no se exponen emails y no
  depende de los secretos. La app muestra el nombre configurado en Ajustes ("Agregado por …").

### Leer un link (`POST /api/wishlist/preview`)

- El Worker descarga la página (solo `http`/`https`, sin IPs ni `localhost`, máximo ~1 MB y 5 s) y busca:
  - nombre: `og:title`, si no `<title>`;
  - imagen: `og:image` o `twitter:image` (convertida a URL absoluta);
  - precio: `product:price:amount` / `og:price:amount`, o el `offers.price` de un `Product` en JSON-LD,
    solo si la moneda es CLP o no viene.
- El análisis del HTML es una función pura (`parseProductMeta(html, url)`) con tests sobre páginas de ejemplo.
- Es "mejor esfuerzo": muchas tiendas arman la página con JavaScript o bloquean robots. Si no se obtiene
  nada, el formulario queda para completar a mano. Nunca bloquea agregar el item.
- Las imágenes se muestran desde la tienda con `referrerPolicy="no-referrer"`; si no cargan, se ve un ícono.

### Nombres

En Ajustes: "Tu nombre" y "Nombre de tu pololo" (`settings`: `owner_name`, `partner_name`). `GET /api/wishlist`
devuelve los nombres junto con los items, porque el pololo no tiene acceso a Ajustes.

## Paso 1 — Permisos por método (commit 1)

- `canAccess(role, method, path)` en `src/worker/roles.ts` y el middleware usa el método.
- Tests: el pololo puede `GET`/`POST` en `/api/wishlist`, `POST` en `/api/wishlist/preview`; no puede
  `PATCH`/`DELETE` ni `POST /api/wishlist/reorder`, ni nada fuera de la wishlist.

## Paso 2 — Lógica pura y tests (commit 2)

- `validateItem(body, partial)`: nombre, precio entero ≥ 0, links `http(s)` válidos, nota corta.
- `parseProductMeta(html, url)`: título, imagen absoluta, precio CLP; tests con HTML de ejemplo
  (meta en distinto orden, JSON-LD con `offers` como objeto o lista, precio con puntos, moneda USD ignorada).
- `isSafePublicUrl(url)`: rechaza otros protocolos, IPs y `localhost`.

## Paso 3 — API (commit 3)

- `GET /api/wishlist` → `{ items, names }` (pendientes por prioridad; comprados por fecha de compra).
- `POST /api/wishlist` (ambos), `PATCH /api/wishlist/:id` y `DELETE` (dueña),
  `POST /api/wishlist/reorder` con `{ ids }` (dueña), `POST /api/wishlist/preview` (ambos).
- Marcar como comprado = `PATCH` con `status: 'bought'` (guarda `bought_at`); se puede deshacer.
- `PUT /api/settings` acepta `ownerName` y `partnerName`.

## Paso 4 — Página Wishlist (commit 4)

- Pensada primero para el celular.
- Tarjetas con imagen, nombre, precio, nota, link a la tienda y "Agregado por …".
- Total de los pendientes.
- **Agregar** (ambos): pegar el link → se completan nombre, imagen y precio si se puede → revisar → guardar.
- **Dueña**: subir/bajar prioridad, editar, marcar como comprado, borrar; sección "Comprados" plegada,
  con opción de deshacer.
- **Pololo**: la misma lista sin esos controles, y el botón de agregar.

## Paso 5 — Ajustes: nombres (commit 5)

- Campos "Tu nombre" y "Nombre de tu pololo".

## Paso 6 — Documentación, despliegue y prueba con el pololo

- `CLAUDE.md` y roadmap. No hay migración nueva.
- Merge de `fase-3` a `main`.
- **Prueba de "listo"**: mi pololo entra desde su celular con su email, solo ve la Wishlist, agrega un
  item y yo lo veo. Además (pendiente desde la Fase 0): con su sesión, `/api/transactions` responde `403`.

## Fuera de esta fase

- Fecha estimada de compra de cada item y si el pololo la ve (Fase 4, decisiones 9 y 12).
- Subir fotos propias (requeriría R2).
- Seguir el precio de un item en el tiempo.
