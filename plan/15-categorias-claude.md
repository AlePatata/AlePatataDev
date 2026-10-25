# 15 — Categorizar con Claude lo que las reglas no reconocen

Planificado el 2026-10-25. Sigue a [11](11-categorias-por-palabras.md), que se descartó: simulada con mis
movimientos reales, una lista de 128 palabras de rubro categorizaba 5 de 69. Mis gastos son comercios
chicos con nombre propio (`ALCANTARA 2`, `MERPAGO*VOYALGRANOCAF`) que ninguna palabra reconoce.

## Qué hace

- Después de cada importación (sin hacer esperar la respuesta, con `waitUntil`) y con un botón
  "Categorizar con Claude" en Gastos, los movimientos **sin categoría** que no son internos se mandan a
  la API de Claude junto con mis categorías, y Claude elige una para cada uno (o ninguna si no sabe).
- Las reglas van primero y siguen ganando: Claude solo ve lo que quedó sin categoría.
- Lo que Claude categoriza se puede cambiar a mano como cualquier otro movimiento (y ahí la app ofrece
  la regla de siempre).

## Qué se manda

- Solo la **descripción** y si es cargo o abono. Nada de montos, fechas ni cuentas.
- **Los traspasos no se mandan** (`traspaso a:` / `traspaso de:`): traen nombres de personas.
- Las descripciones repetidas se mandan una vez.
- Las categorías: id, nombre y tipo.

## Cómo

- `@anthropic-ai/sdk` desde el Worker, modelo `claude-opus-5-5` con esfuerzo `low` (clasificar es una
  tarea simple), y **salida estructurada** (`output_config.format` con un JSON schema): una lista
  `{ i, categoryId }` donde `categoryId` es uno de mis ids o `null`.
- `categorizeLogic.ts` (pura, con tests): qué movimientos se mandan, el texto del pedido y la
  validación de la respuesta. Un id que no existe se ignora, y el tipo tiene que calzar con el signo:
  un cargo solo va a una categoría de gasto; un abono, a reembolso o ingreso.
- Secreto `ANTHROPIC_API_KEY`. Sin él, la importación sigue igual y el botón avisa que falta.
- Costo: ~70 descripciones son unos pocos miles de tokens, del orden de US$0,05 por pasada.

## Commits

1. Este plan.
2. `categorizeLogic.ts` con tests, la llamada a Claude, el endpoint y la importación.
3. Botón en Gastos.
