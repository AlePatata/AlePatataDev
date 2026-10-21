# 13 — Hobbies

Una página **pública** en `/hobbies` que muestra lo que hago fuera de la pega: programación
competitiva, typing, películas, wordles y cubos Rubik. Arriba va un heatmap del año estilo GitHub que
junta todo; abajo, una tarjeta por hobby con su detalle.

Investigado el 2026-10-20 (ver "Fuentes de datos").

## Fuentes de datos

Cada hobby es un **adaptador** que trae datos por una de tres vías y los deja en el mismo formato.

| Hobby | Vía | Fuente | Qué hay que guardar |
|---|---|---|---|
| Codeforces | API pública (cron) | `user.status`, `user.rating` (sin clave) | Handle (no es secreto) |
| Monkeytype | API (cron) | `GET /results` con ApeKey; `/users/{name}/profile` es público | Secreto `MONKEYTYPE_APE_KEY` |
| Películas | RSS (cron) + CSV | `letterboxd.com/{user}/rss/` + export CSV de Letterboxd | Usuario (no es secreto) |
| Wordle | Pegar texto | El texto de "Compartir" de Wordle | — |
| Rubik | Importar archivo | Respaldo de Twisty Timer | — |

### Codeforces

- `user.status?handle=X&from=1&count=N`: cada envío trae `creationTimeSeconds`, `verdict` (`OK` = AC),
  `problem.rating` y `problem.tags`. La primera vez se trae todo; después solo los primeros ~100 y se
  para al encontrar un `id` ya guardado.
- `user.rating?handle=X`: un punto por concurso (rating antes/después, puesto).
- Límite: 1 llamada cada 2 s. Con un cron cada 6 h sobra.

### Monkeytype

- Docs oficiales: `api.monkeytype.com/docs`. Header `Authorization: ApeKey <clave>`; la clave se crea
  en monkeytype.com → Account → Ape Keys.
- `GET /results?onOrAfterTimestamp=<ms>` devuelve hasta 1000 tests (wpm, acc, modo, duración,
  timestamp). **Con ApeKey solo se puede llamar 30 veces al día**: cron cada 2 h (12 al día) pidiendo
  solo lo posterior al último guardado.
- `GET /users/personalBests?mode=time` para los PB (60/h).
- La ApeKey va como secreto del Worker; nunca llega al navegador.

### Películas: Rotten Tomatoes no sirve, Letterboxd sí

- **Rotten Tomatoes no tiene API pública** desde ~2019: hay que pedir una licencia (desde US$60.000 al
  año) y aun así no entrega las notas de un usuario. Scrapearlo es frágil y va contra sus términos.
- **Letterboxd** tiene un RSS público por usuario con etiquetas propias, revisado a mano:
  `letterboxd:watchedDate`, `letterboxd:filmTitle`, `letterboxd:filmYear`, `letterboxd:memberRating`
  (0,5–5), `letterboxd:rewatch`, `letterboxd:memberLike`, `tmdb:movieId` y el póster en la
  `description`. Solo trae las ~50 últimas, así que el cron cada 6 h basta para lo nuevo y el
  **historial se importa una vez** desde el export CSV de Letterboxd (Settings → Data → Export).
- Ojo: la nota solo sale en el RSS si se pone al registrar la película en el diario, no si solo se le
  ponen estrellas en su página.

### Wordle (NYT): no hay API para sincronizar

- La NYT no tiene una API pública de estadísticas de Wordle. La sincronización entre dispositivos va
  con la cuenta de la NYT y usa endpoints internos sin documentar.
- Usarlos desde el Worker obligaría a guardar la cookie de sesión de mi cuenta de la NYT: caduca sin
  aviso, si se filtra da acceso a mi cuenta, y va contra sus términos. **Descartado.**
- La vía es **pegar el texto de "Compartir"** en `/app/hobbies` (unos 5 s al día):
  ```
  Wordle 1.949 4/6*

  ⬛🟨⬛⬛⬛
  ⬛⬛🟩🟨⬛
  🟩🟩🟩⬛🟩
  🟩🟩🟩🟩🟩
  ```
  `parseWordle` (puro, con tests) saca el número del puzzle, los intentos (`X` = perdido), el modo
  difícil (`*`) y la grilla. Acepta `1,949`, `1.949` y `1949`, y el cuadrado blanco del modo claro
  (⬜) además del negro. La fecha sale del número: el puzzle 0 fue el 2021-06-19.
- Las estadísticas de la NYT solo muestran totales, no el detalle por día: al empezar se pueden
  cargar a mano como **punto de partida** (jugadas, % de victorias, racha máxima, distribución) y
  sumarles lo que se pegue después.
- En la página pública solo salen días ya cerrados. La grilla no tiene letras, así que no hay spoilers.

### Rubik: respaldo de Twisty Timer

Twisty Timer es open source (`github.com/aricneto/TwistyTimer`); el formato sale de
`MainActivity.java`. En la app: menú → Exportar/Importar → **Respaldo** (todos los puzzles), y el
`.txt` se pasa al computador o se elige desde el celular.

```
Puzzle,Category,Time(millis),Date(millis),Scramble,Penalty,Comment
"333";"Normal";"12340";"1760000000000";"R U R' ...";"0";""
```

- La cabecera va separada por **comas** pero las filas por **punto y coma**, todo entre comillas.
- `Puzzle`: `222` … `777`, `mega`, `pyra`, `skewb`, `clock`, `sq1`. `Category` es el subtipo
  (por defecto `Normal`).
- `Time` en ms y **ya incluye** el +2. `Date` en ms desde 1970.
- `Penalty`: `0` nada, `1` +2, `2` DNF. Las filas con `10` no son resoluciones (Twisty las usa para
  crear subtipos): se ignoran.
- La exportación "externa" (un solo puzzle, tiempos como texto) no se usa: pierde el +2.

Se lee en el navegador como la cartola (`parseTwistyBackup`, puro y con tests sobre un fixture
inventado), con vista previa y `dryRun`. La clave para no duplicar es `puzzle + category + date`.
Un respaldo puede tener miles de filas: se guardan en tandas.

## Qué muestra cada tarjeta

| Hobby | Destacado | Gráficos |
|---|---|---|
| Codeforces | Rating actual y máximo, racha de días con AC | Rating por concurso; AC por dificultad (barras); tags más resueltos |
| Monkeytype | PB de 15/30/60 s, wpm promedio de los últimos 10 | wpm en el tiempo con media móvil; tests por día |
| Películas | Películas este año, nota promedio | Pósters de las últimas 6; películas por mes; distribución de notas |
| Wordle | Racha actual, % de victorias | Distribución de intentos (el histograma clásico); calendario |
| Rubik | PB single, ao5, ao12, ao100 por puzzle | Tiempos con media móvil; histograma; selector de puzzle |

Las medias siguen las reglas de la WCA, en funciones puras con tests: ao5 y ao12 sacan el mejor y el
peor; desde ao50 sacan el 5 % de cada lado; un DNF cuenta como el peor y, si hay más DNF de los que se
sacan, la media es DNF.

## Modelo de datos

Una tabla por hobby con el detalle (`cf_submissions`, `cf_contests`, `mt_results`, `movies`,
`wordles`, `cube_solves`) y una tabla común para el heatmap:

```sql
CREATE TABLE activity (
  date    TEXT NOT NULL,   -- YYYY-MM-DD, hora de Chile
  source  TEXT NOT NULL,   -- 'codeforces' | 'monkeytype' | 'movies' | 'wordle' | 'cube'
  count   INTEGER NOT NULL,
  summary TEXT,            -- "3 AC, máx 1600", "4/6", "42 resoluciones, PB 11,8 s"
  PRIMARY KEY (date, source)
);
```

Cada adaptador recalcula sus días de `activity` después de sincronizar o importar. El heatmap lee solo
esta tabla. Los usuarios (handle de Codeforces, Monkeytype, Letterboxd) van en `settings`.

## API y acceso

- **Lectura pública**: `GET /api/public/hobbies` (todo lo de la página en una respuesta) y
  `/api/public/hobbies/:source` (detalle). Se registra antes de `requireAuth`, como `/api/health`, y
  responde con `Cache-Control` de unos minutos.
- **En Cloudflare Access** hay que crear una aplicación con política **Bypass** para
  `alepatata.dev/api/public/*` (la ruta más específica gana sobre `/api*`). Revisarlo en producción
  antes de mergear: `curl` sin sesión a `/api/public/hobbies` → 200 y a `/api/me` → 302/401.
- Lo público solo devuelve lo que ya es público (Codeforces, Letterboxd, Monkeytype) o inofensivo
  (wordles, tiempos). Nada de la app de finanzas pasa por ahí.
- **Escritura** (pegar wordle, importar Twisty, sincronizar a mano, ajustes): rutas normales detrás de
  Access, solo para la dueña (el pololo no participa).
- **Cron**: `"triggers": { "crons": ["0 */2 * * *"] }` en `wrangler.jsonc` y un handler `scheduled`
  junto al `fetch` de Hono. Cada 2 h Monkeytype; cada 3.ª pasada (6 h) Codeforces y Letterboxd. Si una
  fuente falla, las otras siguen, y se guarda `last_sync`/`last_error` por fuente para verlo en la app.

## Páginas

- **`/hobbies`** (pública, en el portafolio): heatmap del año con filtro por hobby y tooltip con el
  `summary` del día; debajo, las tarjetas. Un link "Hobbies" en el Navbar del portafolio.
- **`/app/hobbies`** (privada, solo dueña): pegar el wordle del día, importar el respaldo de Twisty y el
  CSV de Letterboxd, configurar los usuarios, ver el estado de cada sincronización y un botón
  "Sincronizar ahora".
- Gráficos en SVG a mano, como el dashboard. El heatmap usa una escala secuencial nueva
  (`--color-heat-0…4` en `src/index.css`, para los dos temas), validada con el script de `dataviz`.

## Gatitos

| Emoción | Disparador |
|---|---|
| Orgulloso | PB nuevo en el cubo o en Monkeytype al importar o sincronizar |
| Millonario | Wordle en 1/6 o 2/6 |
| Triste | Wordle perdido (X/6) |
| Enamorado | Película con 5 estrellas o con corazón |
| Curioso | Pasar el mouse por el heatmap en la página pública (máx. cada 2 min) |

## Commits

1. Plan (este archivo).
2. Migración `activity` + rutas `/api/public/*` antes de `requireAuth` + página `/hobbies` vacía.
3. Componente `Heatmap` (puro: días → semanas) con tests y colores validados.
4. Cron `scheduled` + estado por fuente.
5. Codeforces: adaptador, tarjeta y tests del cálculo (rachas, AC por dificultad).
6. Monkeytype: adaptador con ApeKey, tarjeta.
7. Letterboxd: `parseLetterboxdRss` y `parseLetterboxdCsv` con tests, cron, importación, tarjeta.
8. Wordle: `parseWordle` con tests, pegar en `/app/hobbies`, punto de partida, tarjeta.
9. Twisty Timer: `parseTwistyBackup` y las medias WCA con tests, importación, tarjeta.
10. Gatitos y `CLAUDE.md`.

**Listo cuando:** sin sesión, `/hobbies` muestra el heatmap con los cinco hobbies; resuelvo un
problema en Codeforces y aparece solo en menos de 6 h; importo dos veces el mismo respaldo de Twisty
y no se duplica ninguna resolución.

## Decisiones abiertas

- ¿Uso Letterboxd? Si no, la alternativa es anotar las películas a mano en `/app/hobbies` buscando en
  TMDB (API gratis con clave) para el póster y el año.
- Usuarios exactos de Codeforces, Monkeytype y Letterboxd.

## Ideas para después

- Atajo de iOS en "Compartir" de Wordle que mande el texto directo (necesita un service token de
  Access).
- Más juegos diarios con el mismo patrón de pegar texto (Connections, Strands).
- AtCoder, Lichess o GitHub como otros adaptadores de API.
