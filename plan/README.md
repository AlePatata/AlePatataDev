# Plan — App de finanzas personales (AlePatataDev)

Plan del módulo personal de finanzas dentro del sitio `AlePatataDev`. El sitio mantiene un mini
portafolio público en `/`; la app vive en `/app` y es privada.
Iniciado el 2026-10-14 a partir de la conversación donde se formó la idea.

## La idea en una frase

Una app web privada donde subo la cartola en PDF del Banco de Chile, veo en qué gasto y cuánto me
queda del mes, proyecto mi ahorro y sé **cuándo** podré comprar cada cosa de mi wishlist, que
comparto con mi pololo.

## Decisiones ya tomadas

| Tema | Decisión |
|---|---|
| Registro de gastos | Subiendo el PDF de la cartola del Banco de Chile (sin tipear gasto por gasto) |
| Proyecciones | Las cuatro: saldo del mes, cuándo comprar items de la wishlist, gráficas de tendencia, ahorro proyectado |
| Wishlist | Items con precio, prioridad, vinculada al ahorro, compartida con mi pololo |
| Cuentas | Solo mis gastos. Mi pololo **solo** ve y edita la wishlist |
| Datos | En la nube (Cloudflare), accesibles desde cualquier dispositivo |
| Estructura del sitio | Portafolio / presentación **público** en `/` + app de finanzas **privada** en `/app` (2026-10-16) |
| Cartolas | Cuenta vista **y** tarjeta de crédito, importadas desde el **Excel** del banco con parser propio (2026-10-16) |
| Ingreso y reembolsos | Ingreso mensual fijo en Ajustes **y** abonos reales del mes para comparar; los reembolsos de amigos restan del gasto (2026-10-16) |
| Wishlist | Lista **de los dos**; el pololo puede hacer todo en ella (no en el resto de la app); la imagen sale sola desde el link (2026-10-16) |
| Login | Cloudflare Access con email + código de un solo uso, para mí y para mi pololo (2026-10-16) |
| Dominio | `alepatata.dev` (ya está en Cloudflare) (2026-10-16) |
| Stack | React + TypeScript + Vite, Cloudflare Workers, Cloudflare D1 (ya está la base del repo) |
| Forma de trabajo | Liviana: `CLAUDE.md` + planificar cada feature antes de ejecutarla + commits atómicos (no BMAD completo) |

## Documentos

| Archivo | Contenido |
|---|---|
| [01-requisitos.md](01-requisitos.md) | Qué hace la app, módulo por módulo, y qué queda fuera |
| [02-arquitectura.md](02-arquitectura.md) | Stack, modelo de datos, API, autenticación, importación de PDF y cálculos |
| [03-roadmap.md](03-roadmap.md) | Fases de trabajo con tareas y criterio de "listo" |
| [04-decisiones-abiertas.md](04-decisiones-abiertas.md) | Preguntas por responder, ordenadas por qué fase bloquean |
| [05-estado-del-repo.md](05-estado-del-repo.md) | Qué hay hoy en el repo (template de portafolio), qué se arregla y qué se agrega |
| [06-fase-0.md](06-fase-0.md) | Fase 0 paso a paso: configuración en Cloudflare, commits, verificación |
| [07-fase-1.md](07-fase-1.md) | Fase 1 paso a paso: formatos de cartola, parser, importación y gastos |
| [08-fase-2.md](08-fase-2.md) | Fase 2 paso a paso: categorías, reglas, ajustes y dashboard |
| [09-modo-oscuro.md](09-modo-oscuro.md) | Modo oscuro Catppuccin, colores semánticos y reglas para celular |
| [10-fase-3.md](10-fase-3.md) | Fase 3 paso a paso: wishlist compartida, leer links, nombres |
| [12-gatitos.md](12-gatitos.md) | Gatitos con emociones: qué las dispara y cómo funciona |
| [13-hobbies.md](13-hobbies.md) | Página pública de hobbies: Codeforces, Monkeytype, Trakt, Wordle y Twisty Timer |

## Estado

- [x] Fase 0 — Base técnica y acceso privado (desplegada 2026-10-16; falta probar el acceso del pololo en el navegador)
- [x] Fase 1 — Importar cartola y listar gastos (desplegada 2026-10-16)
- [x] Fase 2 — Categorías y dashboard del mes (desplegada 2026-10-16)
- [ ] Fase 3 — Wishlist compartida
- [ ] Fase 4 — Proyecciones
- [ ] Fase 5 — Pulido
