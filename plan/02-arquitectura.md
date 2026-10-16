# 02 — Arquitectura

## Visión general

```
Navegador (React SPA)
  ├─ /            portafolio público (sin login)
  └─ /app/*       app de finanzas ──┐
                                    │  fetch /api/*
                                    ▼
Cloudflare Access  ── solo en /app* y /api*; login con código por correo para mí y mi pololo
      ▼
Cloudflare Worker
  ├─ sirve el build de Vite (assets estáticos)
  ├─ /api/*  → lógica + permisos por usuario
  │     ├─ D1 (SQLite): transacciones, categorías, wishlist, configuración
  │     └─ extracción de PDF (ver abajo)
```

## Stack

| Capa | Elección | Por qué |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind v4 | Ya está montado en el repo |
| Router | `react-router-dom` (ya instalado) | `/` portafolio; `/app/*` Dashboard, Gastos, Importar, Wishlist, Ajustes |
| Backend | Cloudflare Worker con **Hono** como router de `/api` | Liviano, tipado, hecho para Workers |
| Integración dev | `@cloudflare/vite-plugin` | Un solo `npm run dev` levanta la SPA y el Worker con D1 local |
| Base de datos | Cloudflare D1 | SQLite gratis, migraciones con `wrangler d1 migrations` |
| Gráficos | Recharts (u otra liviana) | Barras y líneas simples |
| Auth | Cloudflare Access (Zero Trust, gratis hasta 50 usuarios) | Sin escribir login propio ni guardar contraseñas |

## Sitio público + módulo privado

| Ruta | Acceso | Contenido |
|---|---|---|
| `/` (y anclas `#about`, `#projects`, `#cv`) | Público | Mini portafolio y presentación |
| `/app`, `/app/*` | Login (Access) | Dashboard, Gastos, Importar, Wishlist, Ajustes |
| `/api/*` | Login (Access) + JWT validado en el Worker | Datos |

- Una sola SPA con `react-router-dom`: `/` usa el layout del portafolio (navbar con anclas) y `/app/*`
  usa un layout propio de la app (navegación entre módulos, pensada para el celular).
- La app se carga con `React.lazy` para que quien visita el portafolio no descargue el código de la app.
  El código de la app no es secreto (es estático); lo que se protege son los **datos**, en `/api`.
- Desde el portafolio, un link discreto ("Entrar") lleva a `/app`.
- Defensa en profundidad: aunque Access proteja `/api*`, el Worker **rechaza con 401** cualquier
  request a `/api/*` sin JWT válido (por si la política de Access se configura mal).

## Autenticación y permisos

- **Cloudflare Access** protege `/app*` y `/api*` (no el portafolio). Política: solo mi email y el de mi pololo.
- Método de login: **código de un solo uso por correo** (One-time PIN de Access). Sin contraseñas.
- Access agrega el header `Cf-Access-Jwt-Assertion`. El Worker **valida el JWT** y saca el email.
- Permisos en el Worker (no confiar solo en el frontend):
  - email dueña → todo.
  - email pololo → solo `GET/POST/PATCH/DELETE /api/wishlist*`. Cualquier otra ruta → `403`.
- El frontend pide `GET /api/me` y muestra solo las secciones permitidas.
- Los emails autorizados van como variables/secretos de Wrangler, no en el código.

## Modelo de datos (D1)

```sql
statements (            -- cada PDF importado
  id INTEGER PRIMARY KEY,
  filename TEXT, account_type TEXT,          -- 'cuenta_corriente' | 'tarjeta_credito'
  period_start TEXT, period_end TEXT,
  imported_at TEXT
);

categories ( id INTEGER PRIMARY KEY, name TEXT UNIQUE, color TEXT );

category_rules (        -- "si la descripción contiene X → categoría Y"
  id INTEGER PRIMARY KEY, pattern TEXT, category_id INTEGER REFERENCES categories
);

transactions (
  id INTEGER PRIMARY KEY,
  date TEXT,                                 -- ISO yyyy-mm-dd
  description TEXT,
  amount INTEGER,                            -- CLP; negativo = gasto, positivo = ingreso/abono
  category_id INTEGER REFERENCES categories,
  source TEXT,                               -- 'pdf' | 'manual'
  statement_id INTEGER REFERENCES statements,
  dedupe_key TEXT UNIQUE,                    -- hash(fecha, monto, descripción normalizada, n° ocurrencia)
  installment TEXT                           -- ej. '3/12' si es compra en cuotas
);

settings ( key TEXT PRIMARY KEY, value TEXT ); -- presupuesto mensual, ingreso mensual, meses para el promedio

wishlist_items (
  id INTEGER PRIMARY KEY,
  name TEXT, price INTEGER, url TEXT, image_url TEXT, note TEXT,
  priority INTEGER,                          -- orden; menor = antes
  status TEXT,                               -- 'pending' | 'bought'
  created_by TEXT, created_at TEXT, bought_at TEXT
);
```

## API

| Método y ruta | Quién | Qué hace |
|---|---|---|
| `GET /api/me` | ambos | Email y rol |
| `POST /api/statements/parse` | dueña | Recibe el PDF, devuelve transacciones extraídas **sin guardar** |
| `POST /api/statements/commit` | dueña | Guarda las transacciones revisadas (ignora duplicados) |
| `GET /api/transactions?month=&category=&q=` | dueña | Listado |
| `POST/PATCH/DELETE /api/transactions[/:id]` | dueña | Manual / editar / borrar |
| `GET/POST/PATCH/DELETE /api/categories`, `/api/rules` | dueña | Categorías y reglas |
| `GET /api/summary?month=` | dueña | Totales del mes por categoría, saldo vs presupuesto |
| `GET /api/trends?months=12` | dueña | Serie mensual |
| `GET /api/projection` | dueña | Ahorro promedio, proyección, fecha estimada por item |
| `GET/POST/PATCH/DELETE /api/wishlist[/:id]` | ambos | Wishlist |
| `GET/PUT /api/settings` | dueña | Presupuesto, ingreso |
| `GET /api/export.csv` | dueña | Exportar todo |

**Nota:** al pololo, `/api/wishlist` le devuelve los items **sin** la fecha estimada, porque esa
fecha revela mi ritmo de ahorro. Ver decisión abierta.

## Importación de la cartola (PDF)

Flujo: subir PDF → extraer texto → convertir a transacciones → vista previa editable → confirmar →
deduplicar → aplicar reglas de categoría → guardar.

Dos caminos para "convertir a transacciones"; se decide con una cartola real en la mano:

| | A. Parser propio | B. Claude API |
|---|---|---|
| Cómo | Extraer el texto del PDF (pdf.js / `unpdf`) y parsear las líneas con reglas/regex | Enviar el PDF a Claude y pedir JSON estructurado |
| Pros | Gratis, determinista, los datos no salen de Cloudflare | Tolera cambios de formato, menos código |
| Contras | Se rompe si el banco cambia el formato | Costo por cartola (bajo), los datos bancarios pasan por un tercero, requiere API key |

**Recomendación:** A como camino principal, porque el formato del Banco de Chile es fijo y son
datos sensibles. B solo como respaldo si A no logra leer un PDF. En ambos casos la vista previa
es obligatoria: nada se guarda sin que yo lo revise.

- El PDF **no se guarda** después de importar (menos superficie de riesgo). Solo quedan las transacciones.
- Si la cartola tiene contraseña, se pide en el navegador para desbloquearla.

## Cálculos

- **Gastado del mes** = suma de `amount < 0` del mes, excluyendo transferencias propias/pagos de tarjeta
  (para no contar doble: pago de la tarjeta desde la cuenta corriente + compras en la tarjeta).
- **Queda del mes** = presupuesto − gastado. **Ritmo diario** = queda / días restantes.
- **Ahorro mensual promedio** = promedio de (ingresos − gastos) de los últimos N meses completos
  (N configurable, por defecto 3).
- **Fecha de cada item**: recorrer la wishlist pendiente por prioridad, acumulando precios;
  `meses = ceil((acumulado − ahorro_actual) / ahorro_mensual)`. Si el ahorro mensual es ≤ 0 → "no alcanzable al ritmo actual".
- Las **cuotas** futuras de la tarjeta se descuentan del ahorro proyectado de los meses que corresponden.

## Entornos

- Local: `npm run dev` con D1 local (`wrangler d1 migrations apply --local`).
- Producción: `wrangler deploy` + `wrangler d1 migrations apply --remote`.
- Nunca subir cartolas reales al repo. Para pruebas: una cartola de ejemplo **anonimizada** o
  fixtures de texto inventados, en una carpeta ignorada por git.
