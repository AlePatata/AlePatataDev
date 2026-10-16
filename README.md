# alepatata.dev

Sitio personal de Alejandra Campos Urbina:

- **[alepatata.dev](https://alepatata.dev)** — portafolio público.
- **`/app`** — app privada de finanzas personales (importar cartolas, dashboard del mes,
  proyección de ahorro y wishlist). Protegida con Cloudflare Access.

## Stack

React 19 + TypeScript + Vite · Tailwind CSS v4 · Cloudflare Workers ([Hono](https://hono.dev)) ·
Cloudflare D1 · Cloudflare Access.

## Desarrollo

```bash
npm install
npx wrangler d1 migrations apply datita --local   # crea la base local
npm run dev
```

Para usar `/app` en local, crear un `.dev.vars` (no se commitea):

```
OWNER_EMAIL=...
PARTNER_EMAIL=...
DEV_AUTH_EMAIL=...   # simula el login de Access con este email
```

Otros comandos: `npm run build`, `npm run lint`, `npm test`.

## Despliegue

Cada push a `main` se despliega con Workers Builds (`npm run build` + `npx wrangler deploy`).
Las migraciones de D1 se aplican a mano con `npx wrangler d1 migrations apply datita --remote`.

El plan del proyecto está en [`plan/`](plan/README.md).
