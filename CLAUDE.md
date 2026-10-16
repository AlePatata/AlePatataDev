# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

`alepatata.dev` is two things in one Cloudflare Worker:

- **`/`** — public mini-portfolio of Alejandra Campos Urbina.
- **`/app`** — private personal-finance app (import Banco de Chile PDF statements, monthly dashboard,
  savings projections, wishlist shared with her partner). Protected by Cloudflare Access.

The plan lives in `plan/` (Spanish): start with `plan/README.md` and `plan/03-roadmap.md`. Plan each
feature before implementing it and keep commits atomic.

## Rules

- **The repo is public.** Never commit emails, secrets, `.dev.vars`, or bank statements (put sample
  PDFs in `samples/`, which is gitignored).
- **Every push to `main` deploys to production** (Workers Builds: `npm run build` + `npx wrangler deploy`).
  Work on a branch and merge when done.
- Keep `npm run build`, `npm run lint` and `npm test` clean on every commit.

## Commands

```bash
npm run dev        # SPA + Worker together (Vite + @cloudflare/vite-plugin), uses .dev.vars
npm run build      # Type-check (app, worker, node configs) + build to dist/
npm run lint       # ESLint
npm test           # Vitest (pure logic only; uses vitest.config.ts, not vite.config.ts)
npm run preview    # Serve the production build locally

npx wrangler types                                   # Regenerate worker-configuration.d.ts after editing wrangler.jsonc
npx wrangler d1 migrations create datita <name>      # New migration in migrations/
npx wrangler d1 migrations apply datita --local      # Apply to the local D1 (.wrangler/)
npx wrangler d1 migrations apply datita --remote     # Apply to production — before merging code that needs it
npx wrangler secret put OWNER_EMAIL                  # Same for PARTNER_EMAIL
```

Local dev needs a `.dev.vars` (gitignored):

```
OWNER_EMAIL=...
PARTNER_EMAIL=...
DEV_AUTH_EMAIL=...   # skips Access locally; set to OWNER_EMAIL or PARTNER_EMAIL to test each role
```

`DEV_AUTH_EMAIL` must **never** be set in production. `npm run preview` reads a copy of `.dev.vars`
made into `dist/alepatata/` at build time, so rebuild after changing it.

## Architecture

```
src/
  main.tsx, App.tsx     React entry + routes: / → Portfolio, /app/* → AppShell (React.lazy)
  pages/, components/   Portfolio sections and shared UI (Navbar, Layout, Footer, ProjectCard)
  data/data.ts          Portfolio content (projects, about, curriculum) — edit content here
  types/                Portfolio types
  app/                  Finance app (AppShell, useMe, pages/, import/ parser, api.ts, format.ts)
  shared/               API request/response types used by both app and worker
  worker/               Cloudflare Worker (Hono), serves /api/*
migrations/             D1 schema (database `datita`, binding `DB`)
```

**Worker** (`src/worker/index.ts`): a Hono app with base path `/api`. `wrangler.jsonc` has
`run_worker_first: ["/api/*"]`; everything else is static assets with SPA fallback.

**Auth** (`src/worker/auth.ts`, `roles.ts`): Cloudflare Access protects `/app*` and `/api*` (One-time
PIN login). The Worker also validates the `Cf-Access-Jwt-Assertion` JWT itself (defense in depth):
no/invalid JWT → 401; email not `OWNER_EMAIL`/`PARTNER_EMAIL` → 403. The `partner` role may only use
`/api/me` and `/api/wishlist*`. `/api/health` is the only public route and is registered before the
middleware. New routes go after `app.use('*', requireAuth)`; read the user with `c.get('email')` /
`c.get('role')`. Secrets are typed in `Secrets` in `auth.ts` (they aren't in the generated `Env`).

**Statement import** (see `plan/07-fase-1.md` for the bank formats): the user picks the bank's Excel
(`.xls`) on the Importar page. It is read **in the browser** with SheetJS (lazy-loaded, installed from
the official CDN tarball, not npm) and parsed by `src/app/import/parseCartola.ts`, a pure function over
sheet rows that supports three Banco de Chile formats (cuenta vista historical / movements, credit card
unbilled movements). The file never leaves the device. `POST /api/statements/commit` receives all parsed
rows: with `dryRun` it returns each row's status (new / duplicate / possible duplicate); otherwise it
saves the included new rows in one D1 batch. `dedupe_key` (`src/worker/dedupe.ts`) is computed by the
worker from the bank's original description, so edits never break dedupe. Never commit real statements:
test fixtures in `*.test.ts` are invented and mirror the real layouts.

**Amounts and totals**: CLP integers, negative = expense. `transactions.internal` marks card payments and
transfers between own accounts; totals (`monthTotals`) leave them out to avoid double counting.

**Frontend app**: `AppShell` calls `/api/me` and builds the nav from the role (owner: Dashboard, Gastos,
Importar, Wishlist, Ajustes; partner: Wishlist only). Pages live in `src/app/pages/` and are attached via
the `page` field of `sections` in `AppShell.tsx`. The portfolio's "Entrar" link is a plain
`<a href="/app">` so the browser does a full load and Access can ask for login — don't turn it into a
router `<Link>`.

**Security config**: `workers_dev` and `preview_urls` are `false` in `wrangler.jsonc` because those
URLs would bypass Access. Don't re-enable them.

**Styling**: Tailwind v4 via `@tailwindcss/vite` (no `tailwind.config.js`). Rose/pink palette
(`rose-50`, `pink-500`, `rose-900`), cards with `rounded-2xl border-pink-100`. Custom base styles in
`src/index.css` go inside `@layer base`, otherwise they override Tailwind utilities.
