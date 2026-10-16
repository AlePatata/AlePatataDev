import { AlertTriangle, ChevronRight, Tags } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Category, MonthSummary, TrendPoint } from '../../shared/summary';
import { api } from '../api';
import { formatCLP } from '../format';
import { MonthPicker } from '../MonthPicker';
import { currentMonth, monthLabel } from '../months';
import { PageTitle } from '../PageTitle';
import { useCategories } from '../useCategories';

// Colores validados con la skill dataviz (contraste ≥ 3:1 sobre blanco y distinguibles con daltonismo):
// el mes destacado en rosa oscuro y el resto en el rosa de la app.
const ACCENT = '#9d174d';
const MARK = '#ec4899';
const TRACK = '#fce7f3'; // pink-100: el fondo de la barra de presupuesto, mismo tono más claro
const GRID = '#fbcfe8'; // pink-200

const card = 'bg-white rounded-2xl border border-pink-100 shadow-sm p-4 sm:p-5';

/** 1234567 → "1,2M"; 45000 → "45K" */
const compact = (n: number) =>
  new Intl.NumberFormat('es-CL', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

export function DashboardPage() {
  const [month, setMonth] = useState(currentMonth);
  const [summary, setSummary] = useState<{ month: string; data?: MonthSummary; error?: string }>();
  const [trend, setTrend] = useState<TrendPoint[]>();
  const { byId } = useCategories();

  useEffect(() => {
    let cancelled = false;
    api<MonthSummary>(`/api/summary?month=${month}`)
      .then((data) => !cancelled && setSummary({ month, data }))
      .catch((e: Error) => !cancelled && setSummary({ month, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [month]);

  useEffect(() => {
    api<TrendPoint[]>('/api/trends?months=6').then(setTrend).catch(() => setTrend([]));
  }, []);

  const data = summary?.data;
  // Al cambiar de mes se mantiene lo anterior, más tenue, hasta que llegan los datos nuevos
  const loading = summary?.month !== month;

  return (
    <section className="max-w-5xl">
      <PageTitle>Dashboard</PageTitle>
      <div className="mb-6">
        <MonthPicker month={month} onChange={setMonth} />
      </div>

      {summary?.error && <p className="text-sm text-rose-700 bg-rose-100 rounded-lg px-4 py-3 mb-4">{summary.error}</p>}

      {data && (
        <div className={`space-y-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <Hero s={data} />
          <Kpis s={data} />
          {(data.uncategorizedCount > 0 || data.uncategorizedCredits.count > 0) && <UncategorizedNotice s={data} />}
          <ByCategory s={data} byId={byId} />
          {trend && trend.length > 0 && <Trend points={trend} selected={month} budget={data.budget} />}
        </div>
      )}
    </section>
  );
}

/** La cifra principal: cuánto queda del presupuesto (mes en curso) o cuánto se gastó (otros meses). */
function Hero({ s }: { s: MonthSummary }) {
  const current = s.daysLeft != null;
  const over = s.remaining != null && s.remaining < 0;
  const used = s.budget ? Math.min(s.spentNet / s.budget, 1) : 0;

  if (s.budget == null) {
    return (
      <div className={card}>
        <p className="text-sm text-rose-700">Gastado neto en {monthLabel(s.month).toLowerCase()}</p>
        <p className="text-5xl font-semibold text-rose-900 my-2">{formatCLP(s.spentNet)}</p>
        <p className="text-sm text-rose-700">
          Para ver cuánto te queda, <Link to="/app/ajustes" className="underline decoration-pink-300 hover:text-pink-500">define tu ingreso mensual en Ajustes</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className={card}>
      <p className="text-sm text-rose-700">
        {current ? (over ? 'Te pasaste del presupuesto por' : 'Te queda este mes') : `Gastado neto en ${monthLabel(s.month).toLowerCase()}`}
      </p>
      <p className={`text-5xl font-semibold my-2 ${over ? 'text-amber-700' : 'text-rose-900'}`}>
        {formatCLP(current ? Math.abs(s.remaining!) : s.spentNet)}
      </p>
      {current && !over && s.dailyPace != null && (
        <p className="text-rose-800">
          Puedes gastar <strong>{formatCLP(s.dailyPace)}</strong> al día durante {s.daysLeft === 1 ? 'el último día' : `los ${s.daysLeft} días que quedan`}.
        </p>
      )}
      {over && (
        <p className="flex items-center gap-1.5 text-amber-800">
          <AlertTriangle size={16} /> Gastaste más que el presupuesto de este mes.
        </p>
      )}

      {/* Barra de presupuesto: relleno = lo gastado; fondo = el mismo tono más claro */}
      <div className="mt-4">
        <div
          role="meter"
          aria-label="Presupuesto usado"
          aria-valuemin={0}
          aria-valuemax={s.budget}
          aria-valuenow={Math.max(s.spentNet, 0)}
          className="h-2.5 rounded-full overflow-hidden"
          style={{ backgroundColor: over ? '#fef3c7' : TRACK }}
        >
          <div className="h-full rounded-full" style={{ width: `${Math.max(used, 0) * 100}%`, backgroundColor: over ? '#d97706' : MARK }} />
        </div>
        <p className="mt-1.5 text-xs text-rose-700">
          Gastado neto {formatCLP(s.spentNet)} de {formatCLP(s.budget)} ({Math.round((s.spentNet / s.budget) * 100)}%)
        </p>
      </div>
    </div>
  );
}

function Kpis({ s }: { s: MonthSummary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Tile label="Gastado neto" value={formatCLP(s.spentNet)} note={s.refunds > 0 ? `Descontando ${formatCLP(s.refunds)} de reembolsos` : 'Gastos menos reembolsos'} />
      <Tile
        label="Ingresos del mes"
        value={formatCLP(s.incomeActual)}
        note={s.incomeFixed != null ? `Tu ingreso fijo es ${formatCLP(s.incomeFixed)}` : 'Abonos en la categoría Ingreso'}
      />
      <Tile
        label="Balance"
        value={formatCLP(s.incomeActual - s.spentNet)}
        note="Ingresos del mes − gastado neto"
      />
    </div>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className={card}>
      <p className="text-sm text-rose-700">{label}</p>
      <p className="text-2xl font-semibold text-rose-900 mt-1">{value}</p>
      <p className="text-xs text-rose-600 mt-1">{note}</p>
    </div>
  );
}

function UncategorizedNotice({ s }: { s: MonthSummary }) {
  const parts = [
    s.uncategorizedCount > 0 && `${s.uncategorizedCount} gastos`,
    s.uncategorizedCredits.count > 0 && `${s.uncategorizedCredits.count} abonos (${formatCLP(s.uncategorizedCredits.amount)}, que no cuentan hasta clasificarlos)`,
  ].filter(Boolean);
  return (
    <Link
      to={`/app/gastos?month=${s.month}&category=none`}
      className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100"
    >
      <Tags size={18} className="shrink-0" />
      <span className="flex-1">Tienes {parts.join(' y ')} sin categoría. Categorízalos para que el resumen sea exacto.</span>
      <ChevronRight size={18} className="shrink-0" />
    </Link>
  );
}

/** Barras horizontales de un solo tono, de mayor a menor; el color de la categoría va solo en el punto. */
function ByCategory({ s, byId }: { s: MonthSummary; byId: (id: number | null) => Category | undefined }) {
  const max = Math.max(...s.byCategory.map((c) => c.amount), 1);
  return (
    <div className={card}>
      <h2 className="text-lg font-semibold text-rose-900 mb-4">Gasto por categoría</h2>
      {s.byCategory.length === 0 ? (
        <p className="text-sm text-rose-700">No hay gastos este mes.</p>
      ) : (
        <ul className="space-y-1">
          {s.byCategory.map((c) => {
            const category = byId(c.categoryId);
            const name = category?.name ?? 'Sin categoría';
            return (
              <li key={c.categoryId ?? 'none'}>
                <Link
                  to={`/app/gastos?month=${s.month}&category=${c.categoryId ?? 'none'}`}
                  title={`${name}: ${formatCLP(c.amount)} en ${c.count} movimientos`}
                  className="grid grid-cols-[7.5rem_1fr] sm:grid-cols-[10rem_1fr] items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-rose-50 focus:bg-rose-50 focus:outline-none"
                >
                  <span className="flex items-center gap-2 min-w-0 text-sm text-rose-900">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: category?.color ?? '#d1d5db' }} />
                    <span className="truncate">{name}</span>
                  </span>
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-4 rounded-r min-w-1"
                      style={{ width: `${(c.amount / max) * 100}%`, maxWidth: 'calc(100% - 5.5rem)', backgroundColor: MARK }}
                    />
                    <span className="text-sm text-rose-800 whitespace-nowrap">{formatCLP(c.amount)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Columnas del gastado neto de los últimos meses, con el presupuesto como línea de referencia. */
function Trend({ points, selected, budget }: { points: TrendPoint[]; selected: string; budget: number | null }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const height = 200;
  const pad = { top: 16, right: 8, bottom: 24, left: 44 };
  const plotW = Math.max(width - pad.left - pad.right, 0);
  const plotH = height - pad.top - pad.bottom;

  const top = Math.max(...points.map((p) => p.spentNet), budget ?? 0, 1);
  // Ticks redondos: 0, paso, 2·paso… cubriendo el máximo
  const rawStep = top / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep)!;
  const ticks = Array.from({ length: Math.ceil(top / step) + 1 }, (_, i) => i * step);
  const yMax = ticks[ticks.length - 1];
  const y = (v: number) => pad.top + plotH - (Math.max(v, 0) / yMax) * plotH;

  const slot = plotW / points.length;
  const barW = Math.min(24, slot * 0.6);
  const hovered = hover == null ? null : points[hover];

  return (
    <div className={card}>
      <h2 className="text-lg font-semibold text-rose-900">Gastado neto por mes</h2>
      <p className="text-sm text-rose-700 mb-3">Últimos {points.length} meses{budget != null && ', con tu presupuesto como referencia'}.</p>
      <div ref={ref} className="relative">
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label="Gastado neto por mes" onPointerLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
                <text x={pad.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-rose-700 text-[11px] tabular-nums">
                  {compact(t)}
                </text>
              </g>
            ))}
            {points.map((p, i) => {
              const x = pad.left + slot * i + (slot - barW) / 2;
              const h = y(0) - y(p.spentNet);
              const isSelected = p.month === selected;
              return (
                <g key={p.month}>
                  {h > 0 && (
                    // Esquinas redondeadas solo arriba (4px), base recta
                    <path
                      d={`M${x},${y(0)} V${y(p.spentNet) + Math.min(4, h)} q0,-${Math.min(4, h)} ${Math.min(4, barW / 2)},-${Math.min(4, h)} H${x + barW - Math.min(4, barW / 2)} q${Math.min(4, barW / 2)},0 ${Math.min(4, barW / 2)},${Math.min(4, h)} V${y(0)} Z`}
                      fill={isSelected ? ACCENT : MARK}
                      opacity={hover == null || hover === i ? 1 : 0.55}
                    />
                  )}
                  {isSelected && p.spentNet > 0 && (
                    <text x={x + barW / 2} y={y(p.spentNet) - 6} textAnchor="middle" className="fill-rose-900 text-[11px] font-medium">
                      {compact(p.spentNet)}
                    </text>
                  )}
                  <text x={x + barW / 2} y={height - 6} textAnchor="middle" className={`text-[11px] ${isSelected ? 'fill-rose-900 font-semibold' : 'fill-rose-700'}`}>
                    {monthLabel(p.month, true)}
                  </text>
                  {/* Zona de hover más grande que la barra: toda la columna */}
                  <rect
                    x={pad.left + slot * i}
                    y={pad.top}
                    width={slot}
                    height={plotH}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${monthLabel(p.month)}: gastado neto ${formatCLP(p.spentNet)}`}
                    onPointerEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                  />
                </g>
              );
            })}
            {budget != null && budget <= yMax && (
              <g>
                <line x1={pad.left} x2={width - pad.right} y1={y(budget)} y2={y(budget)} stroke="#be123c" strokeWidth={1} />
                {/* Etiqueta a la izquierda: los meses recientes (a la derecha) suelen tener barras y su valor */}
                <text x={pad.left + 4} y={y(budget) - 4} className="fill-rose-800 text-[11px]">
                  Presupuesto {compact(budget)}
                </text>
              </g>
            )}
          </svg>
        )}
        {hovered && hover != null && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg bg-white border border-pink-200 shadow-md px-3 py-2 text-xs"
            style={{
              left: Math.min(pad.left + slot * hover + slot / 2, width - 150),
              top: 0,
            }}
          >
            <p className="text-rose-700">{monthLabel(hovered.month)}</p>
            <p className="text-rose-900 font-semibold text-sm">{formatCLP(hovered.spentNet)}</p>
            <p className="text-rose-700">Ingresos {formatCLP(hovered.incomeActual)}</p>
          </div>
        )}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-rose-700 hover:text-pink-500">Ver como tabla</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="text-rose-700">
              <th className="font-medium py-1">Mes</th>
              <th className="font-medium py-1 text-right">Gastado neto</th>
              <th className="font-medium py-1 text-right">Ingresos</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {points.map((p) => (
              <tr key={p.month} className="border-t border-pink-50 text-rose-900">
                <td className="py-1">{monthLabel(p.month)}</td>
                <td className="py-1 text-right">{formatCLP(p.spentNet)}</td>
                <td className="py-1 text-right">{formatCLP(p.incomeActual)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
