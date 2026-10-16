# 04 — Decisiones abiertas

Cuando se decida algo, anotar la respuesta y la fecha, y moverlo a la tabla de decisiones de
[README.md](README.md).

## Bloquean la Fase 0

1. **¿Qué pasa con el portafolio que hay hoy en el repo?**
   - A: se reemplaza entero por la app de finanzas (recomendado: un solo propósito, y todo el sitio queda tras login).
   - B: el portafolio queda público en `/` y la app privada en `/app`.
   - Decisión (2026-10-16): **B**. Se mantiene un mini portafolio / presentación pública en `/` y la app
     de finanzas es un módulo personal privado en `/app`. Ver "Sitio público + módulo privado" en
     [02-arquitectura.md](02-arquitectura.md).
2. **¿Cómo inicia sesión mi pololo?** Recomendado: Cloudflare Access con su email (código de un solo uso
   que llega al correo). Alternativa: link secreto solo para la wishlist (más simple, menos seguro).
   - Decisión (2026-10-16): **Cloudflare Access con su email y código de un solo uso (OTP por correo).**
3. **¿Dominio?** ¿Hay dominio propio en la cuenta de Cloudflare o se usa `*.workers.dev`?
   - Decisión (2026-10-16): **`alepatata.dev`**, dominio propio. Verificado: sus nameservers son de
     Cloudflare (`matt` / `priscilla.ns.cloudflare.com`), así que Access puede proteger solo `/app*` y `/api*`.
   - Despliegue actual (revisado 2026-10-16): **Cloudflare Workers Builds** conectado al repo de GitHub.
     Cada push a `main` construye y despliega el Worker `alepatata` (check run "Workers Builds: alepatata"
     en el commit `7457308`). **No hay GitHub Actions** (sin `.github/`, 0 workflows).
     El comando de build/deploy está en el dashboard de Cloudflare (Worker `alepatata` → Settings → Build),
     no en el repo; revisarlo, porque `wrangler.jsonc` apunta a `./public` y aun así se publica el build de Vite.
   - **AWS:** descartado (2026-10-16). Sin webhooks; la única GitHub App es Cloudflare Workers and Pages.
   - Consecuencia: **cada push a `main` sale a producción**. No pushear la app a `main` antes de que
     Cloudflare Access proteja `/app*` y `/api*`.

## Bloquean la Fase 1

4. **¿Qué PDF(s) del Banco de Chile?** Cartola de cuenta corriente / cuenta vista, estado de cuenta de
   tarjeta de crédito, o ambos. Cambia el parser y cómo se evita contar doble.
   - Decisión (2026-10-16): **ambos** (la cuenta es una cuenta vista). Son dos parsers, y el pago de la tarjeta desde la cuenta
     corriente se excluye de los totales para no contar doble.
5. **¿El PDF trae contraseña?**
   - Decisión (2026-10-16): **no**. Se lee directo; no hace falta pedir contraseña en el navegador.
6. **¿Parser propio o Claude API?** Ver la comparación en [02-arquitectura.md](02-arquitectura.md).
   Se decide al ver una cartola real. Recomendado: parser propio.
   - Decisión (2026-10-16): **parser propio sobre el Excel** que entrega el banco (no el PDF), leído en
     el navegador. Ver [07-fase-1.md](07-fase-1.md). Formatos: cartola histórica y movimientos de la
     cuenta vista, y movimientos no facturados de la tarjeta.

## Bloquean la Fase 2 / 4

7. **¿De dónde sale el ingreso mensual?** De los abonos de la cartola (sueldo, transferencias),
   ingresado a mano en Ajustes, o ambos.
   - Decisión (2026-10-16): **ambos**. Un ingreso mensual fijo en Ajustes (para el presupuesto) y los
     abonos reales del mes en la categoría "Ingreso", para comparar. Las transferencias de amigos que
     devuelven plata van a la categoría "Reembolso" y **restan del gasto** del mes.
8. **¿Hay un ahorro inicial?** Saldo ya ahorrado con el que parte la proyección de la wishlist.
   - Decisión: _pendiente_
9. **¿Mi pololo ve la fecha estimada de cada item?** Esa fecha revela indirectamente mi capacidad de ahorro.
   - Decisión: _pendiente_
10. **Gastos recurrentes** (suscripciones, arriendo): ¿se detectan solos en la cartola o se declaran
    a mano para mejorar la proyección? No se eligieron al principio; quedan como opcionales.
    - Decisión: _pendiente_

12. **¿Qué parte de cada item de la wishlist pago yo?** La wishlist es de los dos (decidido 2026-10-16).
    Para proyectar cuándo se puede comprar cada item con mi ahorro: ¿el 100%, la mitad, o un porcentaje
    por item?
    - Decisión: _pendiente_ (bloquea la Fase 4)

## Forma de trabajo

11. Se eligió un enfoque liviano en vez de BMAD. ¿Se agrega alguna skill o convención más
    (por ejemplo, revisar con `/code-review` antes de cada merge)?
    - Decisión: _pendiente_
