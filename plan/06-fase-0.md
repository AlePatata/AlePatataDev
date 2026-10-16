# 06 — Fase 0 en detalle: base técnica y acceso privado

Planificada el 2026-10-16. Objetivo y criterio de "listo" en [03-roadmap.md](03-roadmap.md#fase-0--base-técnica-y-acceso-privado).

Se trabaja en una rama `fase-0` y se mergea a `main` al final, porque **cada push a `main` despliega
a producción** (Workers Builds). Cada paso de código es un commit, con `npm run build` y `npm run lint` limpios.

## Paso 1 — Configuración en Cloudflare (a mano, en el dashboard)

Lo hago yo (dueña) antes de escribir código; Claude guía paso a paso.

1. **Revisar Workers Builds** (Workers & Pages → `alepatata` → Settings → Build): anotar el build
   command y el deploy command actuales. Revisado 2026-10-16: ya están así (root directory `/`), no hay que cambiarlos:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
2. **Base D1**: ya creada, se llama `datita` (2026-10-16), `database_id` = `cab09f27-b45f-4bcc-92cd-beb05b1056e5`.
3. **Zero Trust**: ya activado en plan Free (2026-10-16). Team domain: `young-snow-c5f8.cloudflareaccess.com`.
   Estado revisado por API (2026-10-16): 0 aplicaciones de Access, 0 métodos de login → nada protegido aún.
   `alepatata.dev` ya es custom domain del Worker `alepatata`. **`alepatata.alepatata.workers.dev` y sus
   preview URLs están activos** → se desactivan en el paso 3 (`workers_dev: false`, `preview_urls: false`).
4. **Login con One-time PIN**: Zero Trust → Settings → Authentication → agregar "One-time PIN".
5. **Aplicación de Access** (Access → Applications → Self-hosted):
   - Destinos: `alepatata.dev/app` y `alepatata.dev/api` (cubre sus subrutas).
   - Política "Allow": emails = el mío y el de mi pololo.
   - Duración de sesión: 1 mes (para no pedir código a cada rato desde el celular).
   - Anotar el **Application Audience (AUD) tag**.
   Hecho 2026-10-16: aplicación "alepatata app" creada; verificado con curl que `/app` y `/api/*`
   redirigen al login de Access y `/` sigue público.
6. **AWS**: revisado 2026-10-16. Sin webhooks; la única GitHub App instalada es Cloudflare Workers and Pages. Nada de AWS.
7. **Secretos** `OWNER_EMAIL` y `PARTNER_EMAIL`: cargados en el Worker `alepatata` (2026-10-16). Los emails no se escriben en el repo (es público).

Datos que salen de este paso y que el Worker necesita (no van en el código):

| Variable | Dónde | Ejemplo |
|---|---|---|
| `ACCESS_TEAM_DOMAIN` | `vars` en `wrangler.jsonc` (no es secreto) | `https://young-snow-c5f8.cloudflareaccess.com` |
| `ACCESS_AUD` | `vars` | `b20ecd3de27275df033e71ff408605d44f6cb89298847f59a3761e5c674eeafe` |
| `OWNER_EMAIL` | secreto (`wrangler secret put`) | mi email |
| `PARTNER_EMAIL` | secreto | email de mi pololo |

## Paso 2 — Ordenar el portafolio (commit 1)

Sin cambiar el diseño, solo dejarlo correcto:

- `src/pages/Portfolio.tsx`: un solo `<Layout>` con las secciones `Home`, `About`, `Projects`, `Curriculum`
  (cada sección deja de envolverse en su propio `<Layout>`, que hoy duplica la navbar).
- Navbar: los íconos de GitHub y LinkedIn usan `about.github` / `about.linkedin` (hoy apuntan a
  `github.com` y `linkedin.com` genéricos). Agregar el link discreto **"Entrar"** → `/app`.
- `index.html`: `lang="es"`; cargar la fuente Inter (hoy se declara pero no se carga).
- `package.json`: nombre `alepatatadev`.
- Borrar `src/App.css`, `src/assets/{hero.png,react.svg,vite.svg}`, `public/icons.svg`, `public/index.html`.
- `.gitignore`: `samples/`, `.dev.vars*`, `.wrangler/`.

Contenido (lo completo yo, no bloquea la fase): `projects` en `src/data/data.ts` todavía son
proyectos de ejemplo con imágenes de picsum.

## Paso 3 — Worker + Vite plugin (commit 2)

- Dependencias: `hono`, `jose` · dev: `wrangler`, `@cloudflare/vite-plugin`.
- `vite.config.ts`: agregar `cloudflare()`.
- `wrangler.jsonc`:
  ```jsonc
  {
    "name": "alepatata",
    "main": "src/worker/index.ts",
    "compatibility_date": "2026-05-24",
    "workers_dev": false,     // sin alepatata.<cuenta>.workers.dev: esquivaría Access
    "preview_urls": false,    // ídem para las URLs de preview
    "assets": {
      "not_found_handling": "single-page-application",
      "run_worker_first": ["/api/*"]
    },
    "routes": [{ "pattern": "alepatata.dev", "custom_domain": true }],
    "d1_databases": [{ "binding": "DB", "database_name": "datita", "database_id": "cab09f27-b45f-4bcc-92cd-beb05b1056e5", "migrations_dir": "migrations" }],
    "vars": { "ACCESS_TEAM_DOMAIN": "https://young-snow-c5f8.cloudflareaccess.com", "ACCESS_AUD": "b20ecd3de27275df033e71ff408605d44f6cb89298847f59a3761e5c674eeafe" }
  }
  ```
  (Con el plugin de Vite, `assets.directory` lo pone el build; se quita el `./public`.)
- `src/worker/index.ts`: app Hono con `GET /api/health`; cualquier otra `/api/*` → 404 JSON.
- `tsconfig.worker.json` + `npx wrangler types` para los tipos de `Env` (generado, se commitea).
- Revisar que `npm run dev` levante la SPA y el Worker juntos.

## Paso 4 — Autenticación y roles (commit 3)

- `src/worker/auth.ts`, middleware para todo `/api/*` salvo `/api/health`:
  1. Lee el header `Cf-Access-Jwt-Assertion`. Si no está → `401`.
  2. Valida el JWT con `jose` (`createRemoteJWKSet` sobre `${ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`,
     `issuer` = team domain, `audience` = `ACCESS_AUD`). Si falla → `401`.
  3. Email = `OWNER_EMAIL` → rol `owner`; = `PARTNER_EMAIL` → rol `partner`; otro → `403`.
  4. Rol `partner`: solo `/api/me` y `/api/wishlist*`; el resto → `403`.
- `GET /api/me` → `{ email, role }`.
- **Desarrollo local** (no hay Access): si existe `DEV_AUTH_EMAIL` en `.dev.vars`, se usa ese email
  sin JWT. Esa variable **nunca** se define en producción; el middleware lo registra en consola
  para que se note si pasara.
- Tests (Vitest) de la lógica de roles como función pura: `roleFor(email, env)` y `canAccess(role, path)`.

## Paso 5 — Rutas de la app (commit 4)

- `react-router-dom` en `main.tsx`:
  - `/` → `Portfolio` (con el layout actual).
  - `/app/*` → `AppShell`, cargado con `React.lazy` (el portafolio no descarga el código de la app).
- `AppShell`: pide `/api/me`; muestra nav según el rol. Dueña: Dashboard, Gastos, Importar, Wishlist,
  Ajustes. Pololo: solo Wishlist (y si entra a otra ruta, redirige a Wishlist).
  Nav inferior en el celular, lateral en escritorio; misma paleta rosa.
- Páginas vacías por ahora ("Próximamente") salvo el contenido de `/api/me`.
- El link "Entrar" del portafolio es un `<a href="/app">` normal (carga completa), **no** un `<Link>`:
  Access solo pide login cuando el navegador hace una carga real de `/app`.
- Si `/api/me` falla (sesión de Access vencida), recargar la página para que Access pida el código.

## Paso 6 — Base de datos (commit 5)

- `migrations/0001_init.sql` con las tablas de [02-arquitectura.md](02-arquitectura.md#modelo-de-datos-d1),
  más `CHECK`s simples (`status IN ('pending','bought')`, `source IN ('pdf','manual')`) e índice por `transactions.date`.
- `npx wrangler d1 migrations apply datita --local` para desarrollo.
- `/api/health` hace un `SELECT 1` en D1 para confirmar el binding.

## Paso 7 — Documentación (commit 6)

- Reescribir `CLAUDE.md`: propósito (portafolio + app), estructura `src/worker` / `src/app` /
  `src/portfolio`, comandos (dev, migraciones, secretos, deploy), regla de no commitear cartolas.
- Reescribir `README.md` (hoy es el del template de Vite).

## Paso 8 — Despliegue y verificación

1. ~~Secretos~~ (ya cargados en el paso 1).
2. `npx wrangler d1 migrations apply datita --remote`.
3. Mergear `fase-0` → `main` (Workers Builds ya usa `npm run build` + `npx wrangler deploy`).
4. Verificar (criterio de "listo"):

| Prueba | Esperado |
|---|---|
| `alepatata.dev` en ventana privada | Se ve el portafolio, sin login |
| `alepatata.dev/app` en ventana privada | Pide email y código |
| `curl https://alepatata.dev/api/me` sin sesión | No devuelve datos (redirige a login o `401`) |
| Entrar con mi email | Veo las 5 secciones de la app |
| Entrar con el email de mi pololo | Solo Wishlist |
| `/api/transactions` con la sesión de mi pololo | `403` |
| `alepatata.<cuenta>.workers.dev` | No existe (desactivado) |

## Riesgos

- **Que el comando de deploy actual de Workers Builds choque con la nueva config** → revisarlo en el
  paso 1 y ajustarlo justo antes del merge.
- **Access mal configurado** → el Worker igual exige JWT válido en `/api/*`; los datos no quedan expuestos.
- **Navegación interna a `/app` sin pasar por Access** → por eso el link "Entrar" hace una carga completa.
