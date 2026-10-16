# 08 — Fase 2 en detalle: categorías y dashboard del mes

Planificada el 2026-10-16. Objetivo y criterio de "listo" en [03-roadmap.md](03-roadmap.md#fase-2--categorías-y-dashboard-del-mes).
Se trabaja en la rama `fase-2`: un commit por paso, con build, lint y tests limpios.

## Lo que muestran los datos

Con las cartolas de septiembre y octubre importadas:

- **Las transferencias a personas (`Traspaso A:`) son ~40% del gasto.** Una regla "la descripción contiene X"
  sirve para comercios (`uber eats` → Comida), pero no sabe qué fue cada transferencia. Esas se categorizan
  a mano; para las que se repiten a la misma persona se crea una regla con su nombre.
- **Los abonos son `Traspaso De:` de personas**: familia (ingreso) y amigos que devuelven plata (reembolso).
  Tampoco se pueden distinguir solos: se categorizan a mano y se crean reglas por nombre.
- El pago de la tarjeta y los traspasos desde otra cuenta propia ya están marcados como internos (Fase 1).

## Decisiones (2026-10-16)

- **Ingreso (decisión 7): ambos.** Un ingreso mensual fijo en Ajustes, y además los abonos reales del mes
  en la categoría "Ingreso", para comparar.
- **Reembolsos: restan del gasto.** Si pagué $20.000 y me devuelven $10.000, el gasto del mes es $10.000.
  El reembolso resta del total, no de una categoría en particular (no se sabe a qué gasto corresponde).
- **Categorías iniciales**: la lista sugerida (abajo). Se pueden cambiar en Ajustes.

## Diseño

### Categorías

Cada categoría tiene nombre, color y **tipo**:

| Tipo | Qué es | Cómo cuenta |
|---|---|---|
| `expense` | Gasto | Suma al gasto del mes y al gráfico por categoría |
| `refund` | Reembolso | Resta del gasto del mes |
| `income` | Ingreso | Suma a los ingresos reales del mes |

Iniciales: Comida y salidas, Supermercado, Transporte, Universidad, Compras, Salud, Suscripciones, Efectivo,
Transferencias, Otros (gasto); Reembolso; Ingreso.

### Reglas

- Regla = `patrón → categoría`. Calza si la descripción normalizada (minúsculas, sin tildes, espacios
  colapsados) **contiene** el patrón normalizado.
- Si calzan varias, gana **el patrón más largo** (`uber eats` le gana a `uber`). Sin prioridades a mano.
- Se aplican al importar (solo a filas sin categoría) y con el botón "Aplicar reglas a los movimientos sin categoría".
- Al cambiar a mano la categoría de un movimiento, se ofrece crear la regla con un patrón sugerido
  (la descripción sin el prefijo `Pago:`, `Traspaso A:`, etc.), editable.
- La migración trae solo reglas **genéricas** de comercios chilenos comunes (`giro cajero` → Efectivo,
  `uber eats` → Comida, `uber` → Transporte, `lider`/`jumbo`/`unimarc` → Supermercado,
  `farmacia`/`cruz verde`/`salcobrand` → Salud, `netflix`/`spotify` → Suscripciones). Las reglas con
  nombres de personas o comercios propios se crean desde la app y viven solo en la base, **no en el repo**.

### Cálculos del mes (función pura, con tests)

Sin contar los movimientos internos:

- **Gastado neto** = gastos (montos negativos, cualquier categoría salvo las de tipo `income`) − reembolsos.
- **Gasto por categoría** = gastos agrupados por categoría (`Sin categoría` aparte).
- **Ingresos reales** = abonos en categorías `income`.
- **Abonos sin categoría** = abonos que todavía no son ni ingreso ni reembolso (se muestran para clasificarlos).
- **Queda del mes** = presupuesto − gastado neto. Presupuesto = el de Ajustes; si está vacío, el ingreso fijo.
- **Ritmo diario** = queda / días que faltan del mes (contando hoy). Solo para el mes en curso.
- **Tendencia** = gastado neto e ingresos reales por mes, últimos 6 o 12 meses.

### Ajustes (`settings`)

`monthly_income` (ingreso fijo) y `monthly_budget` (presupuesto, opcional), enteros en CLP.

## Paso 1 — Migración `0003` (commit 1)

- `categories.kind TEXT NOT NULL DEFAULT 'expense' CHECK (kind IN ('expense', 'refund', 'income'))`.
- Insertar las categorías iniciales (con color) y las reglas genéricas.
- Índice por `transactions.category_id`.

## Paso 2 — Lógica pura y tests (commit 2)

- `src/worker/rules.ts`: `matchCategory(description, rules)` (patrón más largo) y `suggestPattern(description)`.
- `src/worker/summary.ts`: `monthSummary(rows, categories, settings, month, today)` y `trend(...)`.
- Tests: reglas (empate, tildes, más largo gana), reembolsos que restan, internos fuera, ingresos,
  presupuesto vacío → ingreso, ritmo diario en el último día del mes, mes pasado sin ritmo.

## Paso 3 — API (commit 3)

- `GET/POST/PATCH/DELETE /api/categories` (al borrar una categoría, sus movimientos quedan sin categoría
  y sus reglas se borran).
- `GET/POST/PATCH/DELETE /api/rules` y `POST /api/rules/apply` (aplica a los movimientos sin categoría y
  devuelve cuántos categorizó).
- `GET/PUT /api/settings`.
- `GET /api/summary?month=aaaa-mm` y `GET /api/trends?months=12`.
- `GET /api/transactions` devuelve la categoría y acepta `category=<id>|none`; `PATCH` acepta `categoryId`.
- `POST /api/statements/commit` aplica las reglas a las filas que guarda.

## Paso 4 — Gastos con categorías (commit 4)

- Cada fila muestra su categoría (punto de color + nombre); "Sin categoría" resaltado.
- Filtro por categoría, incluida "Sin categoría".
- En el formulario de edición, selector de categoría. Al cambiarla, aparece "¿Crear regla?" con el
  patrón sugerido (editable) y la opción de aplicarla a los demás movimientos sin categoría.
- **Categorización rápida**: con el filtro "Sin categoría", cada fila tiene el selector a la vista, sin
  abrir el formulario.

## Paso 5 — Ajustes (commit 5)

- Ingreso mensual y presupuesto mensual.
- Categorías: crear, renombrar, cambiar color y tipo, borrar.
- Reglas: lista (patrón → categoría), crear, borrar; botón "Aplicar reglas a los movimientos sin categoría".

## Paso 6 — Dashboard (commit 6)

Antes de escribir los gráficos se carga la skill `dataviz`. Sin librería de gráficos: SVG/CSS propio,
con la paleta rosa.

- Selector de mes (el mismo de Gastos, extraído a un componente).
- Tarjeta principal (mes en curso): **queda del mes** y **ritmo diario**; barra de presupuesto usado.
- Gastado neto (gastos − reembolsos), ingreso fijo vs. ingresos reales del mes.
- Barras horizontales de gasto por categoría, de mayor a menor. Tocar una barra abre Gastos filtrado.
- Aviso si hay movimientos o abonos sin categoría, con link para categorizarlos.
- Tendencia de los últimos 6 meses (barras por mes: gastado neto; línea o marca: ingresos).

## Paso 7 — Documentación y despliegue

- `CLAUDE.md` y roadmap.
- `npx wrangler d1 migrations apply datita --remote`, merge de `fase-2` a `main`.
- **Prueba de "listo"**: categorizar septiembre y octubre, y comparar a mano el gastado neto de un mes
  con la suma de la cartola (cargos − reembolsos, sin el pago de la tarjeta ni los traspasos propios).

## Fuera de esta fase

- Proyecciones, ahorro y fecha de cada item de la wishlist (Fase 4; decisiones 8, 9 y 10 siguen abiertas).
- Dividir un movimiento en varias categorías.
- Vincular un reembolso con el gasto que devuelve.
