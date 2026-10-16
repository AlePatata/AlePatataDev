# 08 — Modo oscuro (Catppuccin Mocha)

Planificado el 2026-10-16. Trabajo paralelo a las fases: no depende de la Fase 1 y se hace en la rama
`modo-oscuro`, que sale de `main`. Conviene mergearlo antes que la Fase 1 para que sus pantallas nuevas
nazcan con los colores del tema.

## Objetivo

Todo el sitio (portafolio en `/` y app en `/app`) tiene un modo oscuro inspirado en
[Catppuccin Mocha](https://catppuccin.com/palette), con el morado (mauve) como color principal.
El modo claro rosado se queda tal cual.

## Decisiones

- **Colores semánticos.** Los componentes usan nombres por rol (`bg-page`, `text-ink`, `text-accent`…)
  en vez de `rose-900` o `pink-500`. Cada tema define qué color va en cada rol con variables CSS en
  `src/index.css`. Así no hay que escribir `dark:` en cada clase, y las pantallas nuevas solo usan estos nombres.
- **Elección del tema.** Un botón sol/luna en el navbar del portafolio y en el menú de la app. La
  elección se guarda en `localStorage`; si nunca se eligió, sigue la preferencia del sistema.
- **Sin parpadeo.** Un script corto en `index.html` pone la clase `dark` en `<html>` antes de que
  cargue React.

## Paleta

| Rol (clase) | Claro | Oscuro (Catppuccin) |
|---|---|---|
| `page` — fondo de página | `rose-50` | Base `#1e1e2e` |
| `bar` — navbar, menú y footer | `rose-50` / `pink-100` | Mantle `#181825` |
| `card` — tarjetas | `white` | Surface0 `#313244` |
| `card-hover` | `pink-50` | Surface1 `#45475a` |
| `soft` — chips, item activo del menú | `pink-100` | Surface1 `#45475a` |
| `line` / `line-soft` — bordes | `pink-200` / `pink-100` | Mauve al 25 % / 15 % |
| `ink` — texto principal | `rose-900` | Text `#cdd6f4` |
| `ink-soft` — párrafos | `rose-800` | Subtext1 `#bac2de` |
| `ink-muted` — texto secundario | `rose-700` | Subtext0 `#a6adc8` |
| `ink-faint` — texto apagado | `rose-400` | Overlay1 `#7f849c` |
| `accent` — color principal | `pink-500` | Mauve `#cba6f7` |
| `accent-hover` | `pink-600` | Lavender `#b4befe` |
| `accent-strong` — texto de chips | `pink-600` | Mauve `#cba6f7` |
| `mark` — barritas y viñetas | `pink-400` | Mauve `#cba6f7` |
| `on-accent` — texto sobre botones | `white` | Crust `#11111b` |
| `glow-from` / `glow-to` — degradados | `pink-200` / `rose-100` | Mauve sobre Surface0 / Pink sobre Surface0 |
| `shade` — sombra sobre imágenes | `rose-900` | Crust `#11111b` |

Reservados para la app de finanzas (se agregan cuando se usen): Green `#a6e3a1` (ahorro), Red
`#f38ba8` (gasto o error), Peach `#fab387` (advertencia), Yellow `#f9e2af` (cuotas), Sapphire `#74c7ec` (gráficos).

## Commits

1. Este plan.
2. Colores semánticos en `src/index.css` y todos los componentes pasan a usarlos. El modo claro no cambia.
3. Paleta oscura, botón sol/luna, script sin parpadeo y test de la lógica que elige el tema.
4. `CLAUDE.md`: documentar los colores semánticos para las pantallas nuevas.

## Listo cuando

- En modo claro el sitio se ve igual que antes.
- El botón cambia el tema en `/` y en `/app`, y la elección se mantiene al recargar.
- Sin elección guardada, el sitio sigue el tema del sistema.
- Al recargar en modo oscuro no se ve un destello rosado.
- `npm run build`, `npm run lint` y `npm test` limpios.
