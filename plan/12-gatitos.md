# 12 — Gatitos con emociones

Para que la página sea menos fome: un gatito naranjo, dibujado a mano en SVG, se asoma en la esquina
de abajo con una emoción y una frase según lo que esté pasando. Sale en el portafolio y en la app.

## Emociones y qué las dispara

| Emoción | Dónde | Disparador |
|---|---|---|
| Ansioso | Todo el sitio | Mover el mouse muy rápido (> 3 px/ms por 200 ms; solo mouse, no dedo) |
| Enojado | Todo el sitio | 6 clics en menos de 1,2 s |
| Aburrido | Todo el sitio | 60 s sin mover el mouse, escribir ni hacer scroll |
| Triste | Todo el sitio | Volver a la pestaña después de 30 s fuera |
| Triste | Gastos, Wishlist | Borrar un movimiento o un item |
| Curioso | Portafolio | Llegar al footer (máx. cada 2 min) |
| Endeudado | Gastos, Importar, Wishlist | Agregar un gasto; importar una cartola donde salió más de lo que entró; marcar un item como comprado |
| Millonario | Gastos, Importar | Agregar un ingreso; importar una cartola donde entró más de lo que salió |
| En pánico | Dashboard | El mes en curso se pasó del presupuesto (máx. cada 10 min) |
| Orgulloso | Dashboard | El mes en curso va dentro del presupuesto (máx. cada 10 min) |
| Enamorado | Wishlist | Agregar un item |

Los movimientos internos (pago de tarjeta, transferencias propias) no despiertan a ningún gatito.

## Cómo funciona

- `src/cats/emotions.ts`: la lista de emociones con su nombre y frases.
- `src/cats/catBus.ts`: `feel(emoción, { message?, cooldownMs? })` desde cualquier parte. Hay un solo
  gatito a la vez, se va solo a los 4,5 s o al tocarlo, y cada emoción espera 20 s antes de repetirse
  (las acciones de la app usan `cooldownMs: 0` porque son a propósito).
- `src/cats/detectors.ts`: detectores puros (velocidad del mouse, ráfaga de clics, espera), con tests.
- `src/cats/CatSvg.tsx`: el dibujo; cada emoción cambia ojos, cejas, boca y detalles (sudor, lágrimas,
  billete con alas, corazones, lentes de sol…).
- `src/cats/Cats.tsx`: escucha los eventos globales y muestra el gatito. Va en `App.tsx`, así sirve en
  `/` y en `/app`; en la app queda sobre la barra de abajo del celular.
- Colores: roles `cat-fur`, `cat-stripe`, `cat-line`, `cat-shine` y `cat-tear` en `src/index.css`
  (naranjo en claro, Peach de Catppuccin en oscuro). Las animaciones van con `motion-safe:`, así que
  quien pide "reducir movimiento" ve al gatito quieto.
- Accesibilidad: el contenedor es `role="status"` y lee el nombre de la emoción y la frase.

## Ideas para después

- Opción en Ajustes para silenciar a los gatitos.
- Más emociones: cambiar a modo oscuro de noche, categorizar todo lo pendiente, etc.
