# 14 — Gatitos con imágenes propias

Hasta ahora cada gatito era un dibujo SVG fijo en `CatSvg.tsx`. Ahora cada emoción se puede vestir
desde **Ajustes → Gatitos** con imágenes propias, y si tiene varias, se van turnando en bucle como una
animación. Si una emoción no tiene imágenes, sigue saliendo el dibujo de siempre.

## Qué se configura por emoción

- **Cuadros**: de 1 a 8 imágenes (PNG, JPEG, WebP o GIF, máx. 1 MB cada una), en orden. Con una sola
  es un gatito quieto (o animado, si es un GIF); con dos o más se turnan en bucle.
- **Velocidad**: cuánto dura cada cuadro (100 ms a 5 s; parte en 500 ms).
- **Frases**: una por línea. Vacío = las frases de siempre (`emotions.ts`).
- Un botón **Probar** que hace salir al gatito en la esquina, sin importar cuánto gatito haya elegido.

Las emociones y lo que las dispara siguen en el código (`emotions.ts`, `Cats.tsx`): una emoción nueva
necesita su disparador, así que no se crean desde la app.

Quien pide "reducir movimiento" ve solo el primer cuadro (los GIF se mueven igual: eso lo decide el
archivo).

## Emoción nueva: disociado

| Emoción | Dónde | Disparador |
|---|---|---|
| Disociado | Todo el sitio | 3 min sin mover el mouse, escribir ni hacer scroll (el aburrido sale al minuto) |

Se queda en la esquina hasta que la persona vuelve (mueve el mouse, toca, escribe o hace scroll), en
vez de irse a los 4,5 s. Su dibujo por defecto tiene ojos de espiral que giran; la idea es ponerle dos
imágenes que se turnan.

## Dónde se guardan

En D1, para no sumar otro servicio (las imágenes son chicas: se muestran a ~100 px).

```sql
CREATE TABLE cat_looks (
  emotion  TEXT PRIMARY KEY,
  frame_ms INTEGER NOT NULL DEFAULT 500,
  messages TEXT              -- JSON con las frases; NULL = las de siempre
);

CREATE TABLE cat_frames (
  id       TEXT PRIMARY KEY, -- uuid, nunca se reutiliza (la imagen se cachea para siempre)
  emotion  TEXT NOT NULL,
  position INTEGER NOT NULL,
  mime     TEXT NOT NULL,
  data     BLOB NOT NULL
);
```

## API

Los gatitos salen también en el portafolio, así que leerlos es público (Access ya tiene el Bypass para
`/api/public/*`, ver `13-hobbies.md`):

- `GET /api/public/cats` → `{ [emoción]: { frames: id[], frameMs, messages } }`, sin los bytes.
  `Cache-Control` de 1 minuto.
- `GET /api/public/cats/frames/:id` → la imagen, con cache de un año (`immutable`): cambiar una
  imagen es subir otra con otro id.

Escribir es solo para la dueña (rutas normales detrás de Access; el pololo no llega por `canAccess`):

- `GET /api/cats` → lo mismo que el público, sin cache.
- `POST /api/cats/:emotion/frames` → el archivo tal cual en el body; se agrega al final.
- `PUT /api/cats/:emotion` → `{ frameIds?, frameMs?, messages? }` (orden, velocidad, frases).
- `DELETE /api/cats/frames/:id`.

**Seguridad**: el Worker no confía en el `Content-Type`: mira los primeros bytes (`sniffImage`, pura y
con tests) y solo acepta PNG, JPEG, GIF y WebP. Nada de SVG, que podría traer scripts y correr con la
sesión de alepatata.dev. Las imágenes se sirven con `X-Content-Type-Options: nosniff` y
`Content-Security-Policy: default-src 'none'; sandbox`. Las imágenes subidas quedan **públicas**.

## Frontend

- `src/shared/cats.ts`: la lista de emociones y los tipos de la API, compartidos con el Worker.
- `src/cats/looks.ts`: baja la configuración una vez al cargar la página, precarga los cuadros y
  avisa a quien la use; Ajustes la reemplaza al guardar, así el cambio se ve al tiro.
- `src/cats/CatFace.tsx`: los cuadros en bucle si hay imágenes; si no, `CatSvg`. Lo usan `Cats.tsx` y
  `CatAmountControl.tsx`.
- `catBus.ts`: `feel()` toma las frases configuradas; opciones nuevas `sticky` (no se va solo) y
  `force` (sale siempre, para Probar).
- `src/app/CatsEditor.tsx`: la tarjeta "Gatitos" de Ajustes, una fila por emoción con su vista previa.

## Commits

1. Este plan.
2. Migración y API (`catsLogic.ts` con tests: `sniffImage`, validar lo que llega).
3. Gatitos con imágenes en el sitio (`looks.ts`, `CatFace`, frases y `sticky`/`force` en `catBus`).
4. Gatito disociado.
5. Editor en Ajustes.
6. CLAUDE.md y `12-gatitos.md`.

Antes de mergear: `npx wrangler d1 migrations apply datita --remote`.
