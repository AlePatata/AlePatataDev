# 03 — Roadmap

Forma de trabajo: antes de cada fase, planificarla (plan mode) y luego ejecutarla en commits
pequeños. Cada fase termina con `npm run build` y `npm run lint` limpios y desplegada.

## Fase 0 — Base técnica y acceso privado

Objetivo: el sitio está publicado, protegido con login, y tiene un Worker con D1 respondiendo.

- [ ] Ordenar el portafolio y dejarlo funcionando en `/` (ver [05-estado-del-repo.md](05-estado-del-repo.md)):
      arreglar el layout duplicado, quitar archivos del template de Vite, contenido real en `data.ts`.
- [ ] Agregar `@cloudflare/vite-plugin`, `wrangler` y `hono` como dependencias.
- [ ] Crear el Worker (`src/worker/index.ts`) con `/api/health` y `/api/me`.
- [ ] Configurar `wrangler.jsonc`: `main` del Worker, assets desde el build de Vite,
      `not_found_handling: "single-page-application"`, binding de D1.
- [ ] Crear la base D1 y la primera migración (tablas de [02-arquitectura.md](02-arquitectura.md)).
- [ ] Revisar en Cloudflare el comando de build/deploy de Workers Builds y alinearlo con `wrangler.jsonc`.
- [ ] Confirmar que AWS no esté conectado al repo (webhooks / GitHub Apps / Amplify); si lo está, desconectarlo.
- [ ] Configurar Access **antes** de pushear a `main` cualquier ruta de la app (cada push despliega).
- [ ] Configurar Cloudflare Access en `alepatata.dev/app*` y `alepatata.dev/api*` con mi email y el de mi pololo.
- [ ] Middleware en el Worker: validar el JWT de Access y asignar rol (dueña / pololo).
- [ ] Router: `/` → portafolio; `/app/*` (lazy) → layout de la app con Dashboard, Gastos, Importar,
      Wishlist, Ajustes. Link "Entrar" desde el portafolio.
- [ ] Actualizar `CLAUDE.md` con el nuevo propósito, stack y comandos.

**Listo cuando:** en producción, el portafolio en `/` se ve sin login; `/app` y `/api` piden login; con mi email veo el layout; con el email de
mi pololo solo veo Wishlist, y llamar `/api/transactions` con su sesión responde `403`.

## Fase 1 — Importar cartola y listar gastos

Requiere una cartola real (decisiones 4, 5 y 6, ya tomadas). Detalle en [07-fase-1.md](07-fase-1.md).

- [x] Explorar una cartola real y documentar el formato ([07-fase-1.md](07-fase-1.md)). Se usa el Excel, no el PDF.
- [x] Parser de cartola (cuenta vista y tarjeta) → `{ date, description, amount, installment?, internal }[]`, con tests sobre fixtures inventados.
- [x] Lectura del Excel en el navegador y pantalla de vista previa editable (reemplaza a `POST /api/statements/parse`).
- [x] `POST /api/statements/commit` con deduplicación por `dedupe_key` y aviso de posibles duplicados.
- [x] Listado de gastos por mes con búsqueda y filtro por cuenta.
- [x] Gasto manual, editar y borrar.

**Listo cuando:** subo 2 cartolas consecutivas que se traslapan y no aparece ningún duplicado.

## Fase 2 — Categorías y dashboard del mes

Detalle en [08-fase-2.md](08-fase-2.md).

- [x] CRUD de categorías (gasto / reembolso / ingreso) y reglas.
- [x] Aplicar las reglas al importar; "crear regla" al recategorizar a mano; categorización rápida.
- [x] Ajustes: presupuesto mensual e ingreso mensual.
- [x] Dashboard: queda del mes, ritmo diario y gasto por categoría.
- [x] Gráfico de tendencia de los últimos 6 meses.
- [x] Excluir de los totales los pagos de la tarjeta y las transferencias propias (hecho en la Fase 1, campo `internal`).

**Listo cuando:** el dashboard del mes cuadra con la cartola, revisado a mano.

## Fase 3 — Wishlist compartida

- [ ] CRUD de items con prioridad, link e imagen.
- [ ] Reordenar por prioridad.
- [ ] Marcar como comprado (queda en el historial).
- [ ] Vista móvil cómoda.
- [ ] Probar con la cuenta de mi pololo.

**Listo cuando:** mi pololo agrega un item desde su celular y yo lo veo.

## Fase 4 — Proyecciones

- [ ] Cálculo del ahorro mensual promedio (N meses configurable).
- [ ] Ahorro proyectado a 3/6/12 meses, descontando las cuotas futuras.
- [ ] Fecha estimada por item de la wishlist (acumulativa por prioridad).
- [ ] Simulador "¿y si ahorro $X más?".
- [ ] Tests de los cálculos (son funciones puras: fáciles de testear).

**Listo cuando:** cada item de la wishlist muestra un mes estimado coherente con el ahorro real.

## Fase 5 — Pulido

- [ ] Exportar a CSV.
- [ ] Estados vacíos y errores claros (PDF no reconocido, sin datos del mes, etc.).
- [ ] PWA (instalable en el celular), opcional.
- [ ] Respaldo periódico de D1 (`wrangler d1 export`), opcional.
- [ ] Respaldo con Claude API para PDFs que el parser no reconozca, si hace falta.
