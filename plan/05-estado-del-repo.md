# 05 — Estado actual del repo

El repo hoy tiene un **template de portafolio** (commit `7457308 template of page`) sobre un proyecto
creado con `create-cloudflare`. El portafolio se mantiene en `/` y la app de finanzas se agrega en `/app`.

## Se reutiliza

- Configuración de React 19 + TypeScript + Vite 8 + Tailwind v4 + ESLint.
- `lucide-react` y `react-icons` para los íconos.
- `react-router-dom`, que ya está instalado y ahora sí se va a usar.
- La paleta rosa/rose y el estilo de tarjetas (`rounded-2xl`, `border-pink-100`) como identidad visual.
- La estructura `components/`, `pages/`, `types/`.
- `Navbar` con menú móvil, como base de la navegación de la app.

## Se mantiene: el portafolio (decisión 1 = B)

El portafolio sigue como sitio público en `/`. Se conservan y se arreglan:

- `src/pages/Home.tsx`, `About.tsx`, `Projects.tsx`, `Curriculum.tsx` → pasan a ser secciones de una
  página `Portfolio` (ruta `/`), con un solo `<Layout>`.
- `src/components/ProjectCard.tsx`, `Navbar.tsx`, `Footer.tsx`, `Layout.tsx`.
- `src/data/data.ts` y el tipo `Project` → revisar que el contenido sea real y actualizado.
- Agregar en la navbar un link discreto "Entrar" → `/app`.

## Se borra o se reemplaza

| Qué | Por qué |
|---|---|
| `src/App.css` | CSS del template de Vite; no se importa |
| `src/assets/react.svg`, `vite.svg`, `public/icons.svg` | No se usan (`hero.png` tampoco se usa; reemplazar por una foto propia si se quiere) |
| `public/index.html` | "Hello, World!" de Cloudflare |
| `README.md` | Es el del template de Vite |
| `CLAUDE.md` | Describe solo el portafolio; hay que reescribirlo para portafolio + app |

## Problemas a corregir de paso

- **Despliegue:** `wrangler.jsonc` sirve `./public`, así que hoy se publicaría el "Hello, World!".
  Con `@cloudflare/vite-plugin` esto queda resuelto (los assets salen del build).
- **Layout duplicado:** cada página se envuelve en su propio `<Layout>`, lo que dibuja varias navbars
  superpuestas. En la app, `Layout` va una sola vez en el router.
- `package.json` se llama `alepatatadev-temp`.
- `index.html` tiene `lang="en"`; la app está en español.
- `wrangler` no está en `devDependencies`.
- La fuente `Inter` se declara en `index.css`, pero no se carga.
- El `.gitignore` debe ignorar cualquier carpeta de cartolas de prueba (por ejemplo, `samples/`) y `.dev.vars`.
