# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Direction (read first)

The site is becoming a public mini-portfolio at `/` plus a private personal-finance app at `/app`
(Cloudflare Worker + D1 + Access). The plan lives in `plan/` (Spanish): start with `plan/README.md`,
then `plan/06-fase-0.md`, which is the next phase to implement. Step 1 of Fase 0 (Cloudflare
dashboard setup) is done; implementation starts at step 2 on a `fase-0` branch. Every push to
`main` deploys to production via Workers Builds. The repo is public: never commit emails, secrets,
or bank statements. The rest of this file describes the portfolio template and gets rewritten in
step 7 of Fase 0.

## Project Overview

Personal portfolio site for Alejandra Campos Urbina. Built with React 19 + TypeScript + Vite, styled with Tailwind CSS v4, and deployed to Cloudflare Workers via Wrangler.

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Type-check + build to dist/
npm run lint      # Run ESLint
npm run preview   # Preview the production build locally
npx wrangler deploy  # Deploy to Cloudflare
```

## Architecture

**Single-page app with anchor navigation.** `App.tsx` renders the four page sections in sequence (`<Home>`, `<About>`, `<Projects>`, `<Curriculum>`). `react-router-dom` is installed but not yet wired up — navigation is done via `href="#section-id"` anchors.

**Content lives in `src/data/data.ts`.** The `projects` array and `about` object are the single source of truth for all displayed content. Adding a project or changing personal info is done here, not in the page components.

**Types in `src/types/index.ts`** — currently just the `Project` interface.

**Tailwind v4** is configured via the `@tailwindcss/vite` plugin in `vite.config.ts` — there is no `tailwind.config.js`. The color palette used throughout is rose/pink (`rose-50`, `pink-500`, `rose-900`).

## Deployment Note

`wrangler.jsonc` sets `assets.directory` to `./public`, but the Vite build outputs to `dist/`. Before deploying, either update `wrangler.jsonc` to point at `./dist`, or ensure the build output is copied to `public/`.
