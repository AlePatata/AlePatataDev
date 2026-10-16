# 01 — Requisitos

## Usuarios

| Usuario | Puede |
|---|---|
| **Yo (dueña)** | Todo: subir cartolas, ver y editar gastos, configurar presupuesto/ingresos, ver proyecciones, editar wishlist |
| **Mi pololo** | Solo la wishlist: verla, agregar, editar y marcar como comprado. **No** ve gastos, ingresos ni proyecciones |

## Módulo 1 — Gastos desde la cartola

- Subir el PDF de la cartola del Banco de Chile.
- La app extrae las transacciones: fecha, descripción, monto, cargo/abono.
- **Vista previa antes de guardar**: tabla con lo extraído para revisar y corregir antes de confirmar.
- **Sin duplicados**: si subo dos cartolas que se traslapan, una transacción no se guarda dos veces.
- Listado de gastos filtrable por mes y categoría, con búsqueda por descripción.
- Editar categoría o descripción de un gasto; borrar un gasto.
- Agregar un gasto a mano (excepción, por ejemplo efectivo).

## Módulo 2 — Categorías

- Categorías propias (comida, transporte, suscripciones, etc.) con color.
- **Reglas automáticas**: "si la descripción contiene `UBER` → Transporte". Al corregir a mano la
  categoría de un gasto, ofrecer crear la regla.
- Los gastos nuevos se categorizan solos con las reglas; los que no calzan quedan "Sin categoría".

## Módulo 3 — Dashboard del mes

- **¿Cuánto me queda este mes?**: presupuesto mensual − gastado a la fecha, y ritmo diario disponible.
- Gasto por categoría del mes (barras).
- **Tendencia**: gasto total y por categoría de los últimos 6–12 meses.

## Módulo 4 — Wishlist

- Item: nombre, precio (CLP), link, imagen opcional, prioridad, nota, estado (pendiente / comprado).
- Ordenar por prioridad (arrastrar o subir/bajar).
- Cada item muestra **"podrías comprarlo en ~N meses (mes/año)"**, calculado con el ahorro proyectado.
- Compartida: mi pololo entra con su propio acceso y solo ve esta sección.

## Módulo 5 — Proyecciones

- **Ahorro mensual promedio** = ingresos − gastos, promedio de los últimos N meses.
- **Ahorro proyectado** a 3, 6 y 12 meses.
- **Fecha estimada de cada item** de la wishlist, en orden de prioridad y acumulando
  (comprar el item 1 atrasa el item 2).
- Simulación simple: "¿y si ahorro $X más al mes?".

## Requisitos no funcionales

- **Privado**: nada de la app (`/app`, `/api`) es accesible sin iniciar sesión. Son datos bancarios.
  El portafolio en `/` sí es público.
- Funciona bien en el celular (la wishlist se va a usar mucho desde ahí).
- Montos en CLP como enteros (sin decimales).
- Costo ~$0: dentro de los planes gratuitos de Cloudflare.
- Poder exportar mis datos (CSV) en cualquier momento.

## Fuera de alcance (por ahora)

- Gastos de mi pololo o gastos compartidos.
- Conexión directa al banco (open banking / scraping).
- Otros bancos u otros formatos de cartola.
- Foto de boleta.
- App nativa.
