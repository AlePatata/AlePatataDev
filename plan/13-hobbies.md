# 13 — Hobbies

Una página **pública** en `/hobbies` que muestra lo que hago fuera de la pega: programación
competitiva, typing, películas y series, Wordle y cubos Rubik. Arriba va un heatmap del año estilo
GitHub que junta todo; abajo, una tarjeta por hobby con su detalle.

Investigado el 2026-10-20 (ver "Fuentes de datos"). Usuario en todas partes: `AlePatata92`.

## Fuentes de datos

Cada hobby es un **adaptador** que trae sus datos y los deja en el mismo formato.

| Hobby | Vía | Fuente | Qué hay que guardar |
|---|---|---|---|
| Codeforces | API pública (cron) | `user.status`, `user.rating` (sin clave) | Handle (no es secreto) |
| Monkeytype | API (cron) | `GET /results` con ApeKey; `/users/{name}/profile` es público | Secreto `MONKEYTYPE_APE_KEY` |
| Películas y series | API (cron) | Trakt: historial y notas de un perfil público | Secreto `TRAKT_CLIENT_ID` |
| Wordle | API no oficial (cron) | Partida guardada en la cuenta de la NYT | Secreto `NYT_COOKIE` |
| Rubik | API no oficial (cron) | Lo que csTimer exporta a su servidor | Secreto `CSTIMER_ID` |

### Codeforces

- `user.status?handle=AlePatata92&from=1&count=N`: cada envío trae `creationTimeSeconds`, `verdict`
  (`OK` = AC), `problem.rating` y `problem.tags`. La primera vez se trae todo (hoy son 264 envíos,
  125 AC); después solo los primeros ~100 y se para al encontrar un `id` ya guardado.
- `user.rating`: un punto por concurso (rating antes/después, puesto). Hoy: 1016, máximo 1049.
- **No usar `user.info`**: devuelve el email si el perfil lo muestra, y el repo es público. Rating
  actual y máximo salen de `user.rating`. (Se puede ocultar el email en Settings de Codeforces.)
- Límite: 1 llamada cada 2 s. Con un cron cada 6 h sobra.

### Monkeytype

- Docs oficiales: `api.monkeytype.com/docs`. Header `Authorization: ApeKey <clave>`; la clave se crea
  en monkeytype.com → Account → Ape Keys.
- `GET /results?onOrAfterTimestamp=<ms>` devuelve hasta 1000 tests (wpm, acc, modo, duración,
  timestamp). **Con ApeKey solo se puede llamar 30 veces al día**: cron cada 2 h (12 al día) pidiendo
  solo lo posterior al último guardado.
- `GET /users/personalBests?mode=time` para los PB (60/h).
- `/users/AlePatata92/profile` funciona sin clave (hoy: 18 tests). Sirve para probar antes de tener la
  ApeKey, pero no trae el detalle por test.

### Películas y series: Trakt

- **Rotten Tomatoes no tiene API pública** desde ~2019 (licencia desde US$60.000 al año, y no entrega
  las notas de un usuario). Descartado.
- **Trakt** registra películas **y** series (episodio por episodio), tiene app oficial para iOS y
  Android, y una API oficial (`github.com/trakt/trakt-api`). Letterboxd es solo películas y su RSS trae
  solo las ~50 últimas.
- Para empezar: crear la cuenta en trakt.tv, dejar el perfil **público**, y crear una app en el portal
  de desarrolladores (pide una cuenta de GitHub verificada) para tener el `client_id`.
- Con el perfil público basta el `client_id` (header `trakt-api-key`, `trakt-api-version: 2`), sin
  OAuth: `/users/AlePatata92/history` (🔓 OAuth opcional, paginado, con `start_at`) y
  `/users/AlePatata92/ratings`. Cada item trae `watched_at`, el tipo (película o episodio), título,
  año, temporada y episodio, e ids de Trakt, TMDB e IMDb. `?extended=full` agrega duración e imágenes.
- Sin OAuth no cuenta para el límite de "una app conectada" de las cuentas gratis. Límite sin OAuth:
  500 GET cada 5 min.
- **Las imágenes no se pueden enlazar directo** al CDN de Trakt: hay que cacharlas. Van por
  `GET /api/public/hobbies/poster/:traktId`, que las baja una vez y las guarda con la Cache API del
  Worker (cache de días).
- Su política permite expresamente herramientas personales que muestran la actividad de una misma, con
  cache y actualizaciones en segundo plano.

### Wordle (NYT): sí se puede, con la cookie de la cuenta

La NYT no tiene una API oficial, pero **`lukwam/nytimes-games`** (librería en Python, mantenida, con
un chequeo diario contra la NYT y endpoints documentados en `docs/endpoints.md`) muestra cómo leer la
partida guardada de una cuenta. No hace falta suscripción; basta una cuenta gratis de nytimes.com.

- **La cookie**: `NYT-S`, sacada del navegador con la sesión iniciada en nytimes.com (DevTools →
  Application → Cookies). Da acceso a la cuenta de la NYT: va como secreto del Worker, nunca al
  navegador, y solo se usan `GET` (no puede cambiar rachas ni partidas).
- **La partida**: `GET /svc/games/state/wordleV2/latests?puzzle_ids=<ids>` (hasta 30 por llamada).
  Cada partida trae `boardState` (las palabras que probé), `currentRowIndex`, `hardMode` y `status`
  (`WIN`, `FAIL`, `IN_PROGRESS`). Solo incluye los puzzles que jugué con la sesión iniciada.
- **Los ids**: `puzzle_id` es un id interno, no el número del Wordle. Salen de
  `GET /svc/games/v1/archive/wordle/{inicio}/{fin}` (máx. 31 días por llamada, trae la solución) o de
  `GET /svc/wordle/v2/{YYYY-MM-DD}.json` (trae `id`, `solution` y `days_since_launch` = el número).
- **Estadísticas**: el campo `player` de la misma respuesta (pidiendo `puzzle_ids=0`) trae rachas, %
  de victorias y distribución.
- **Historial completo**: recorrer el archivo de 31 en 31 días desde que jugué con la cuenta y pedir
  las partidas de 30 en 30. Se hace una vez a mano desde Ajustes; después el cron pide solo los
  últimos días.

**Los intentos sin la palabra, como en Discord.** El Worker toma mis palabras y la solución, calcula
los colores con `scoreGuess(guess, solution)` (pura, con tests: primero los verdes y después los
amarillos, para que una letra repetida no pinte de más) y **guarda solo los colores**: ni mis palabras
ni la solución llegan a D1 ni a la página. En la tarjeta queda la grilla de cada día:

```
Wordle 1.949  4/6
⬛🟨⬛⬛⬛
⬛⬛🟩🟨⬛
🟩🟩🟩⬛🟩
🟩🟩🟩🟩🟩
```

Partidas `IN_PROGRESS` no se guardan: el cron las vuelve a pedir en la siguiente pasada.

**Riesgos y plan B**

- Son endpoints internos: la NYT puede cambiarlos sin aviso, y leerlos con una cookie va en una zona
  gris de sus términos (uso personal, solo lectura, unas pocas llamadas al día).
- La cookie caduca sin aviso, o la NYT puede bloquear pedidos desde los servidores de Cloudflare. Un
  `401`/`403` deja la fuente en error en Ajustes (y un gatito preocupado) para renovarla.
- **Plan B**: pegar el texto de "Compartir" en Ajustes. `parseWordle` (pura, con tests) saca el
  número, los intentos (`X` = perdido), el modo difícil (`*`) y la grilla, que ya viene sin letras.
  Acepta `1,949`, `1.949` y `1949`, y ⬜ además de ⬛. Las dos vías guardan lo mismo.
- **Probar primero** (commit 7): un `wrangler dev` con la cookie que pida la partida de hoy. Si la NYT
  responde, se sigue; si no, Wordle queda solo con el plan B.

### Rubik: csTimer, exportado a su servidor

Antes era importar el respaldo de Twisty Timer, pero Twisty no tiene nube: los tiempos viven solo en el
celular y habría que exportar a mano cada vez. Me cambié a **csTimer**, que sube los tiempos a
cstimer.net bajo un ID y lo hace solo cada 50 resoluciones (Opciones → Auto Export → "a ID"). El
formato sale de `src/js/export.js` (`github.com/cs0x7f/cstimer`, GPL-3).

- Es una API no oficial: `POST https://cstimer.net/userdata2.php` con el form `id=<ID>&offset=0`
  devuelve `{retcode, data}`; `data` es un JSON comprimido con LZString
  (`decompressFromEncodedURIComponent`). Trae `properties.sessionData` (nombre y `opt.scrType` de
  cada sesión; sin `scrType` es 3x3) y `session1…N`: listas de hashes de tandas de 1000 tiempos.
- Las tandas se piden con `id=<ID>&ids=slice<hash>,slice<hash>…` → `{retcode, datas: {slice…: …}}`,
  cada una también con LZString.
- Cada tiempo: `[[penalización, ms, …fases], scramble, comentario, fecha en segundos]`. Penalización
  `0` nada, `2000` +2 (se suma), `-1` DNF.
- `retcode` `400` = ID inválido (solo letras y números), `404` = no hay nada subido con ese ID.
- **El ID es una contraseña**: quien lo tenga lee y sobrescribe mis tiempos. Va como secreto
  `CSTIMER_ID`, nunca en el repo.
- Cada 2 h, con el cron. Si el `data` no cambió (se compara su SHA-256, guardado en
  `hobby_snapshots`), no se hace nada más; si cambió, se reemplazan todos los tiempos (así también se
  borran los que borré en csTimer) y los días de `activity`. Los tiempos van en un solo `INSERT …
  SELECT FROM json_each(?)` por tanda, para no gastar una consulta por fila.
- No se guardan scrambles ni comentarios.
- No es en tiempo real: llega cuando csTimer exporta (o cuando aprieto "Exportar al servidor").

## Qué muestra cada tarjeta

| Hobby | Destacado | Gráficos |
|---|---|---|
| Codeforces | Rating actual y máximo, racha de días con AC | Rating por concurso; AC por dificultad (barras); tags más resueltos |
| Monkeytype | PB de 15/30/60 s, wpm promedio de los últimos 10 | wpm en el tiempo con media móvil; tests por día |
| Películas y series | Películas y episodios este año, horas vistas | Pósters de lo último; series en curso; vistas por mes; distribución de notas |
| Wordle | Racha actual, % de victorias, promedio de intentos | Distribución de intentos; las grillas de colores de los últimos días; calendario |
| Rubik | PB single, ao5, ao12, ao100 por puzzle | Tiempos con media móvil; histograma; selector de puzzle |

Las medias siguen las reglas de la WCA, en funciones puras con tests: ao5 y ao12 sacan el mejor y el
peor; desde ao50 sacan el 5 % de cada lado; un DNF cuenta como el peor y, si hay más DNF de los que se
sacan, la media es DNF.

## Modelo de datos

Una tabla por hobby con el detalle (`cf_submissions`, `cf_contests`, `mt_results`, `watched`,
`wordles`, `cube_solves`) y una tabla común para el heatmap:

```sql
CREATE TABLE activity (
  date    TEXT NOT NULL,   -- YYYY-MM-DD, hora de Chile
  source  TEXT NOT NULL,   -- 'codeforces' | 'monkeytype' | 'trakt' | 'wordle' | 'cube'
  count   INTEGER NOT NULL,
  summary TEXT,            -- "3 AC, máx 1600", "4/6", "2 episodios de Severance"
  PRIMARY KEY (date, source)
);

CREATE TABLE wordles (
  number    INTEGER PRIMARY KEY,   -- 1949; la fecha sale del número (el 0 fue el 2021-06-19)
  result    INTEGER,               -- intentos, NULL = perdido
  hard_mode INTEGER NOT NULL,
  colors    TEXT NOT NULL          -- "BYBBB/BBGYB/GGGBG/GGGGG": solo colores, nunca letras
);
```

Cada adaptador recalcula sus días de `activity` después de sincronizar o importar. El heatmap lee solo
esta tabla. Los usuarios van en `settings`; las claves y la cookie, como secretos.

## API y acceso

- **Lectura pública**: `GET /api/public/hobbies` (todo lo de la página en una respuesta),
  `/api/public/hobbies/:source` (detalle) y `/api/public/hobbies/poster/:id`. Se registran antes de
  `requireAuth`, como `/api/health`, y responden con `Cache-Control` de unos minutos.
- **En Cloudflare Access** hay que crear una aplicación con política **Bypass** para
  `alepatata.dev/api/public/*` (la ruta más específica gana sobre `/api*`). Revisarlo en producción
  antes de mergear: `curl` sin sesión a `/api/public/hobbies` → 200 y a `/api/me` → 302/401.
- Lo público solo devuelve lo que ya es público (Codeforces, Monkeytype, Trakt) o inofensivo (colores
  de wordle, tiempos). Nada de la app de finanzas pasa por ahí, y nunca el email ni las palabras.
- **Escritura** (pegar un wordle, recorrer el historial de Wordle, sincronizar a mano,
  ajustes): rutas normales detrás de Access, solo para la dueña.
- **Cron**: `"triggers": { "crons": ["0 */2 * * *"] }` en `wrangler.jsonc` y un handler `scheduled`
  junto al `fetch` de Hono. Cada 2 h Monkeytype y Wordle; cada 3.ª pasada (6 h) Codeforces y Trakt.
  Si una fuente falla, las otras siguen, y se guarda `last_sync`/`last_error` por fuente.

## Páginas

- **`/hobbies`** (pública, en el portafolio): heatmap del año con filtro por hobby y tooltip con el
  `summary` del día; debajo, las tarjetas. Un link "Hobbies" en el Navbar del portafolio.
- **Tarjetas con "Ver más"**: cada hobby con datos abre su detalle debajo (la tarjeta pasa a ocupar
  las dos columnas). Wordle: el de hoy en grande (solo colores) o "Todavía no juego el de hoy", el
  botón "Jugar el Wordle de hoy" (link al juego, nunca a la respuesta), jugados / % victorias / racha /
  máxima, la distribución de intentos y los 7 días anteriores en chico.
- **Ajustes → Hobbies** (privado, solo dueña; en vez de una página `/app/hobbies`, para no sumar una
  sexta pestaña a la barra del celular): estado de cada fuente (última sincronización, error) y
  "Sincronizar ahora". Ahí irán también traer el historial de Wordle, pegar un wordle (plan B).
- Gráficos en SVG a mano, como el dashboard. El heatmap usa una escala secuencial nueva
  (`--color-heat-0…4` en `src/index.css`, para los dos temas) y la grilla de Wordle los roles
  `--color-wordle-hit/near/miss`, validados con el script de `dataviz`.

## Íconos

Cada hobby tiene un PNG de 96×96 en `public/hobby-icons/` (no en `public/hobbies/`, para no chocar con
la ruta `/hobbies`). Salen en las tarjetas y son el único contenido de los filtros de "Mi año" (el
nombre queda en `aria-label` y `title`). Son los íconos oficiales, usados solo para identificar cada
servicio y enlazar al perfil: favicon de Codeforces, `apple-touch-icon` de Monkeytype, `favicon.svg`
de Trakt pasado a PNG, logo de Wordle de la NYT, y `cstimer512x512.png` de csTimer (GPL-3) para los cubos.

## Gatitos

| Emoción | Disparador |
|---|---|
| Orgulloso | PB nuevo en el cubo o en Monkeytype al importar o sincronizar |
| Millonario | Wordle en 1/6 o 2/6 |
| Triste | Wordle perdido (X/6) |
| Enamorado | Película o serie con nota 10 en Trakt |
| Ansioso | Una fuente quedó en error (cookie de la NYT vencida, etc.) al abrir Ajustes |
| Curioso | Pasar el mouse por el heatmap en la página pública (máx. cada 2 min) |

## Commits

1. Plan (este archivo).
2. Migración `activity` + rutas `/api/public/*` antes de `requireAuth` + página `/hobbies` vacía.
3. Componente `Heatmap` (puro: días → semanas) con tests y colores validados.
   Hecho: niveles por orden dentro de cada hobby (`levelsBySource`), así un día con 80 resoluciones no
   deja pálido al resto, y un hobby con una sola cantidad (un wordle al día) va al nivel 2; con filtro "Todo", el nivel del día es el más alto entre sus hobbies. Colores
   validados con `validate_palette.js --ordinal`: claro `pink-400/500/700/800` sobre la card blanca
   (el `pink-300` no llegaba a 2:1; el `pink-950` se veía negro), oscuro mauve al 45/65/82/100 % sobre Surface0 (al 35 % no llegaba).
4. Cron `scheduled` + estado por fuente + "Sincronizar ahora" en Ajustes. Hecho junto con el 7.
5. Codeforces: adaptador, tarjeta y tests del cálculo (rachas, AC por dificultad).
6. Monkeytype: adaptador con ApeKey, tarjeta.
7. Wordle: probar la cookie desde el Worker; `scoreGuess` y `parseWordle` con tests; sincronización,
   historial, plan B y tarjeta con las grillas.
   Hecho: `scoreGuess`, `toWordleDay` y `wordleStats` con tests; sincroniza hoy, ayer y anteayer (probado
   contra la NYT desde `wrangler dev`, falta probarlo desde Cloudflare); "Ver más" con la grilla de hoy.
   Falta: traer el historial completo y el plan B. Los colores de la NYT no pasan `dataviz` (verde y
   amarillo muy parecidos): se usan `#5ba754`/`#cdaf33`/`#787c7e` en claro y `#3c8836`/`#ac942f`/Overlay1
   en oscuro, y las casillas amarillas llevan un punto para no depender solo del color.
8. Trakt: adaptador, pósters cacheados, tarjeta.
9. csTimer: lectura del servidor y las medias WCA con tests, sincronización, tarjeta.
10. Gatitos y `CLAUDE.md`.

**Listo cuando:** sin sesión, `/hobbies` muestra el heatmap con los cinco hobbies; resuelvo un
problema en Codeforces y aparece solo en menos de 6 h; juego el Wordle y en menos de 2 h sale mi grilla
de colores sin ninguna letra; resuelvo en csTimer y, cuando exporta, mis tiempos aparecen sin duplicarse.

## Lo que tengo que hacer yo

- [x] Crear la ApeKey en Monkeytype (activa; falta `npx wrangler secret put MONKEYTYPE_APE_KEY`).
- [x] Crear la cuenta de Trakt (perfil público) y una app de API tipo **Development** en
      `developer.trakt.tv/apps`, con Redirect URI `http://localhost` (falta subir `TRAKT_CLIENT_ID`).
- [x] Jugar Wordle con la sesión iniciada en nytimes.com y copiar la cookie `NYT-S` (probada desde mi
      computador; falta `npx wrangler secret put NYT_COOKIE`, con el valor `NYT-S=...`).
- [ ] Opcional: ocultar el email en el perfil de Codeforces.
- [x] Crear en Access la aplicación Bypass "public hobbies" para `/api/public/*` (falta probarla después del merge).
- [x] Exportar csTimer al servidor con un ID y activar Auto Export (falta
      `npx wrangler secret put CSTIMER_ID`).

## Ideas para después

- Connections y Strands con la misma cookie (mismo endpoint `latests`, otro `{game}`).
- AtCoder, Lichess o GitHub como otros adaptadores de API.
