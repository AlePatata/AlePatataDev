# 07 — Fase 1 en detalle: importar cartola y listar gastos

Planificada el 2026-10-16. Objetivo y criterio de "listo" en [03-roadmap.md](03-roadmap.md#fase-1--importar-cartola-y-listar-gastos).
Se trabaja en la rama `fase-1`, igual que la Fase 0: un commit por paso, con build, lint y tests limpios.

## Lo que muestran las cartolas reales

Revisadas el 2026-10-16 (en `samples/`, que no se commitea): dos de la **cuenta vista** y los
**movimientos no facturados de la tarjeta de crédito**.

El banco entrega cada cartola en PDF y en Excel (`.xls` binario antiguo). **Se usa el Excel**: el texto
del PDF pega columnas (`98.4504.990` = saldo `98.450` + cargo `4.990`) y no distingue cargo de abono.

### Cuenta vista

Hay **dos formatos** de Excel. Ambos tienen una sola hoja útil (`Hoja1`), un encabezado con nombre, RUT y
número de cuenta, y una tabla con las columnas `Fecha | Descripción | Canal o Sucursal | Cargos | Abonos | Saldo`.

| | A. Cartola histórica (emitida) | B. Movimientos (saldos y movimientos) |
|---|---|---|
| Cómo se reconoce | Celda `Detalle Cartola Histórica` + `Fecha de Emisión` | Celda `Movimientos al dd/mm/aaaa` |
| Período | Un período cerrado (ej. 22/09 al 30/09) | Los últimos ~45 días hasta hoy |
| Fecha | `dd/mm` **sin año** (sale de la fecha de emisión) | `dd/mm/aaaa` |
| Orden | Más antiguo primero | Más reciente primero |
| Descripción | MAYÚSCULAS: `PAGO:EL COMERCIO` | Tipo título: `Pago:el Comercio` |
| Canal | `CENTRAL` / `INTERNET` | `Oficina Central` / `Internet` |
| Saldo | Solo en el último movimiento de cada día | En cada fila |
| Filas extra | `SALDO INICIAL` y `SALDO FINAL` | — |
| Columnas de monto | `Cargos (PESOS)` … | `Cargos (CLP)` … |

Ejemplo inventado de la misma compra en los dos formatos:

```
A:  23/09        PAGO:EL COMERCIO        CENTRAL          4990   (vacío)   98450
B:  23/09/2026   Pago:el Comercio        Oficina Central  4990   (vacío)   98450
```

Tipos de movimiento vistos: `Pago:<comercio>` (compra con débito), `Traspaso A:<nombre>` / `Traspaso De:<nombre>`
(transferencias), `Traspaso De Cuenta:<n°>` (desde otra cuenta), `Giro Cajero Automatico`, `Comision ...`,
`Cargo Por Pago Tc` (pago de la tarjeta de crédito). Algunas descripciones vienen cortadas por el banco
(~35 caracteres) o con espacios repetidos.

Los movimientos que se traslapan entre A y B son idénticos salvo **mayúsculas, espacios y el orden
dentro del día**. Eso define la deduplicación.

### Tarjeta de crédito: formato C, "Saldos y Movimientos No Facturados"

| | C. Movimientos no facturados |
|---|---|
| Cómo se reconoce | Hoja `Saldo y Mov No Facturado`, celda `Saldos y Movimientos No Facturados` + `al dd/mm/aaaa` |
| Período | Desde la última facturación hasta hoy |
| Columnas | `Fecha \| Tipo de Tarjeta \| Descripción \| Ciudad \| Cuotas \| Monto ($)` |
| Fecha | `dd/mm/aaaa`, más reciente primero |
| Monto | Una sola columna: **positivo = compra, negativo = pago** a la tarjeta |
| Cuotas | `01/01` (cuota actual / total) |
| Resumen | Cupo disponible, cupo utilizado (la deuda) y cupo total |

Ojo con este formato:

- **Los encabezados no están alineados con los datos** (celdas combinadas): el monto está dos columnas
  a la derecha de `Monto ($)`, y entre medio hay una celda `1 / 0`. El parser toma como monto el último
  número de la fila y como cuotas la celda con forma `nn/nn`.
- El banco **pega `COMPRAS` al final** de la descripción, a veces sin espacio
  (`EL COMERCIO COMPRAS`, `COMERCIO LARGO CORTADOCOMPRAS`). Se quita.
- Los movimientos **muy recientes** pueden venir provisorios: sin ciudad y sin `COMPRAS`
  (ej. `MERPAGOCOMERCIO`). Cuando el banco los procesa, la descripción puede cambiar
  (`MERPAGO*COMERCIO COMPRAS`), y la `dedupe_key` ya no coincide.
- **Solo trae lo no facturado.** Al cerrar la facturación esos movimientos salen de este listado,
  así que hay que importarlo **al menos una vez antes de cada cierre** para no perder compras.
- El pago de la tarjeta aparece como `PAGO PESOS TEF PAGO NORMAL` con monto negativo.

## Decisiones de diseño

- **Decisión 6 → parser propio sobre el Excel.** El formato es tabular y fijo; no hace falta Claude API.
  El PDF queda fuera por ahora (respaldo opcional en la Fase 5).
- **El archivo se lee en el navegador** con SheetJS, cargado solo en la página Importar. La cartola nunca
  sale del dispositivo: al Worker solo llegan las transacciones que confirmo. Esto reemplaza al
  `POST /api/statements/parse` del plan original.
- **Deduplicación**: `dedupe_key` = `cuenta | fecha | monto | descripción normalizada | n° de ocurrencia`.
  Normalizar = minúsculas, espacios colapsados, sin espacios al borde. El n° de ocurrencia cuenta los
  movimientos idénticos (misma fecha, monto y descripción) dentro del archivo, así que no depende del orden.
  La calcula el Worker, no el navegador.
- **Posibles duplicados**: para los movimientos provisorios de la tarjeta, la vista previa marca como
  "posible duplicado" una fila nueva si ya existe otra de la misma cuenta con el mismo monto y fecha
  ±3 días. Esas filas vienen desmarcadas por defecto; yo decido.
- **Monto** = abono − cargo en la cuenta vista; −monto en la tarjeta. Negativo = gasto, entero en CLP.
- **Validación con el saldo**: si la fila trae saldo, se comprueba que `saldo anterior − cargo + abono`
  cuadre. Si no cuadra, la vista previa lo avisa (detecta errores del parser o un cambio de formato).
- **Movimientos internos**: el pago de la tarjeta aparece dos veces (cargo en la cuenta y abono en la
  tarjeta), y las compras ya están en la tarjeta. Para no contar doble, las transacciones tienen un campo
  `internal`. El parser lo marca solo en `Cargo Por Pago Tc` y `Traspaso De Cuenta:` (cuenta) y en los
  pagos de la tarjeta; se puede cambiar a mano (por ejemplo, un `Traspaso A:` a mí misma).
  `Traspaso De Cuenta:` viene de otra cuenta mía (confirmado 2026-10-16), igual que el pago de la tarjeta
  del 30/09 que no aparece en la cuenta vista. Importar esa otra cuenta queda fuera de esta fase. Los totales de Gastos no
  incluyen los movimientos internos.

## Paso 1 — Migración `0002` (commit 1)

- `statements.account_type` acepta `'cuenta_vista'` (la `CHECK` actual solo tiene `cuenta_corriente` y
  `tarjeta_credito`). Como SQLite no permite cambiar una `CHECK`, se recrea la tabla.
- `statements` agrega `closing_balance INTEGER`: saldo al final del período en la cuenta vista
  (útil para el ahorro actual, decisión 8); en la tarjeta, el cupo utilizado en negativo (la deuda).
- `transactions` agrega `internal INTEGER NOT NULL DEFAULT 0` (ver "Movimientos internos").
- `transactions.source` pasa de `'pdf'` a `'import'` (la cartola ya no viene en PDF). También se
  recrea; ambas tablas estaban vacías.

Hecho 2026-10-16.
- Aplicar en local; en remoto, en el despliegue.

## Paso 2 — Parser y tests (commit 2)

- `src/app/import/parseCartola.ts`, función pura: recibe las filas de la hoja (arreglo de arreglos, como
  las entrega SheetJS) y devuelve `{ format, accountType, periodStart, periodEnd, closingBalance, transactions, warnings }`.
  Cada transacción: `{ date, description, amount, installment?, internal }`.
  - Reconoce el formato A, B o C; si no reconoce ninguno, error claro ("no parece una cartola del Banco de Chile").
  - Busca la fila de encabezados por los nombres de columna, no por posición fija.
  - Año del formato A: el de la emisión; si el mes del movimiento es mayor que el de emisión, año anterior
    (cartola de diciembre emitida en enero).
  - Ignora `SALDO INICIAL` / `SALDO FINAL` y las filas vacías o el pie de página.
  - Validación de saldos → `warnings` (A y B).
  - Formato C: monto = último número de la fila, cuotas = celda `nn/nn` (`installment` solo si el total es > 1),
    quitar `COMPRAS` del final, marcar `internal` en los pagos.
- `src/worker/dedupe.ts`: `normalizeDescription` y `dedupeKeys(account, transactions)`.
- Tests con **fixtures inventados** (nombres y montos falsos, nunca datos reales):
  formato A, formato B, formato C (con columnas desalineadas, `COMPRAS` pegado, cuotas y un pago),
  cambio de año, saldo que no cuadra, archivo irreconocible, y que la misma compra en A y en B dé la
  misma `dedupe_key`.

Hecho 2026-10-16. Probado también contra las 3 cartolas reales (en local): sin avisos de saldo, y los
8 movimientos de la histórica dan las mismas `dedupe_key` en la de movimientos.

## Paso 3 — API de importación (commit 3)

- `POST /api/statements/commit` con `{ dryRun, statement: {...}, transactions: [...] }`:
  - Valida el cuerpo (fechas ISO, montos enteros, descripciones no vacías).
  - Calcula las `dedupe_key` y consulta cuáles ya existen.
  - `dryRun: true` → devuelve el estado de cada fila (`nueva` / `ya importada` / `posible duplicado`) sin guardar.
  - `dryRun: false` → inserta el `statement` y las transacciones nuevas en un `batch` de D1
    (`INSERT ... ON CONFLICT(dedupe_key) DO NOTHING`) y devuelve cuántas se guardaron y cuántas se omitieron.
- La `dedupe_key` se calcula con la descripción **original** (`originalDescription`), aunque se edite en
  la vista previa. El navegador manda **todas** las filas con `include`, para que el n° de ocurrencia no
  cambie al excluir una.

Hecho 2026-10-16. Probado en local con las 3 cartolas reales: histórica 8 nuevas; movimientos 47 nuevas y
8 duplicadas; tarjeta 35 nuevas; reimportar cualquiera → todo duplicado.

## Paso 4 — Página Importar (commit 4)

- Elegir archivo (`.xls`, `.xlsx`). SheetJS con `import()` dinámico: no pesa en el resto de la app.
- Vista previa: período, saldo final, avisos de validación, y tabla con fecha, descripción (editable),
  monto, interno (sí/no) y estado (nueva / ya importada / posible duplicado, vía `dryRun`). Casilla para excluir filas.
- Botón "Importar N movimientos" → resultado ("Se guardaron 12, se omitieron 8 duplicados").
- Celular: la tabla pasa a lista de tarjetas.

Hecho 2026-10-16. Probado en Firefox con las 3 cartolas reales: 8 nuevas → 47 nuevas + 8 ya importadas
→ 35 de la tarjeta; subir el PDF muestra "no parece una cartola".

## Paso 5 — Gastos: listar, agregar, editar, borrar (commit 5)

- `GET /api/transactions?month=aaaa-mm&q=` (búsqueda por descripción, sin distinguir mayúsculas).
- `POST /api/transactions` (manual, `source = 'manual'`, sin `dedupe_key`),
  `PATCH /api/transactions/:id` (fecha, descripción, monto), `DELETE /api/transactions/:id`.
- `PATCH` también permite cambiar `internal`.
- Página Gastos: selector de mes (por defecto el actual), búsqueda, filtro por cuenta (vista / tarjeta),
  totales del mes sin los movimientos internos (cargos, abonos, neto),
  lista con fecha, descripción y monto (gastos en rosa oscuro, abonos en verde suave), agregar/editar/borrar.

Hecho 2026-10-16. Probado en Firefox con los datos reales importados en local: navegar meses, buscar,
filtrar por cuenta, y agregar, editar y borrar un movimiento manual (los totales se actualizan).

## Paso 6 — Documentación y despliegue

- `CLAUDE.md`: flujo de importación y dónde vive el parser. Marcar avance aquí y en el roadmap.
- `npx wrangler d1 migrations apply datita --remote`, merge de `fase-1` a `main`.
- **Prueba de "listo"** con las dos cartolas reales: importar la histórica (22–30 sep) y después la de
  movimientos (2 sep – 15 oct). La segunda debe mostrar los 8 movimientos del 23–29 sep como "ya importada"
  y no debe aparecer ningún duplicado en Gastos. Después importar la tarjeta: sus compras aparecen con
  la cuenta "tarjeta" y su pago queda marcado como interno.

## Fuera de esta fase

- **Estado de cuenta facturado** de la tarjeta (otro formato). Con importar los no facturados antes de
  cada cierre debería bastar; se agrega si hace falta.
- Compras en cuotas de verdad (no hay ninguna en la muestra): se guarda la cuota (`installment`), pero
  la proyección de cuotas futuras es de la Fase 4.
- Categorías y reglas (Fase 2).
- Qué cuenta como ingreso: sueldo, `Traspaso De Cuenta`, reembolsos de amigos (decisión 7, Fase 2).
