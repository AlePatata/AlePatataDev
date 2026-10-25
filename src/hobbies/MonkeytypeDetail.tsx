import { useEffect, useState } from 'react';
import type { MonkeytypeDetail as Detail, TypingTest } from '../shared/hobbies';
import { movingAverage } from './stats';
import { useWidth } from './useWidth';

const number = (n: number) => n.toLocaleString('es-CL', { maximumFractionDigits: 1 });
const modeLabel = (mode: string, mode2: string) =>
  mode === 'time' ? `${mode2} s` : mode === 'words' ? `${mode2} palabras` : mode;
const shortDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('es-CL', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });

function duration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/** "Ver más" de Monkeytype: PB, totales y la evolución de los wpm. */
export function MonkeytypeDetail() {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/public/hobbies/monkeytype')
      .then((res) => (res.ok ? (res.json() as Promise<Detail>) : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="text-ink-muted">No se pudo cargar el detalle.</p>;
  if (!data) return <p className="text-ink-muted">Cargando…</p>;
  if (!data.tests.length) return <p className="text-ink-muted">Todavía no hay tests sincronizados.</p>;

  const stats: [string, string, string?][] = [
    ['Tests', number(data.completedTests), `de ${number(data.startedTests)} empezados`],
    ['Escribiendo', duration(data.secondsTyping)],
    ['Racha', `${data.streak.current} ${data.streak.current === 1 ? 'día' : 'días'}`, `máxima ${data.streak.max}`],
    ...(data.last10 ? [['Últimos 10', `${number(data.last10.wpm)} wpm`, `${number(data.last10.acc)} % precisión`] as [string, string, string]] : []),
  ];

  return (
    <div className="space-y-6">
      {data.pbs.length > 0 && (
        <div>
          <p className="text-sm text-ink-muted mb-2">Mejores marcas</p>
          <ul className="flex flex-wrap gap-3">
            {data.pbs.map((pb) => (
              <li key={`${pb.mode}-${pb.mode2}`} className="rounded-xl bg-soft px-4 py-3 min-w-28">
                <p className="text-xs text-ink-muted">{modeLabel(pb.mode, pb.mode2)}</p>
                <p className="text-2xl font-semibold text-ink tabular-nums">
                  {number(pb.wpm)} <span className="text-sm font-normal text-ink-muted">wpm</span>
                </p>
                <p className="text-xs text-ink-muted tabular-nums">{number(pb.acc)} % precisión</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(([label, value, detail]) => (
          <div key={label}>
            <dt className="text-xs text-ink-muted">{label}</dt>
            <dd className="text-lg font-semibold text-ink tabular-nums">{value}</dd>
            {detail && <dd className="text-xs text-ink-muted">{detail}</dd>}
          </div>
        ))}
      </dl>

      <WpmChart tests={data.tests} />
    </div>
  );
}

/** wpm de cada test (puntos) y su media móvil de 10 (línea), del más antiguo al más reciente. */
function WpmChart({ tests }: { tests: TypingTest[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const height = 200;
  const pad = { top: 12, right: 12, bottom: 28, left: 36 };
  const plotW = Math.max(width - pad.left - pad.right, 0);
  const plotH = height - pad.top - pad.bottom;

  const wpms = tests.map((t) => t.wpm);
  const avg = movingAverage(wpms);
  const lo = Math.floor(Math.min(...wpms) / 10) * 10;
  const hi = Math.max(Math.ceil(Math.max(...wpms) / 10) * 10, lo + 10);
  const ticks = Array.from({ length: (hi - lo) / 10 + 1 }, (_, i) => lo + i * 10);
  const x = (i: number) => pad.left + (tests.length === 1 ? plotW / 2 : (i / (tests.length - 1)) * plotW);
  const y = (v: number) => pad.top + plotH - ((v - lo) / (hi - lo)) * plotH;
  const line = avg.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
  const hovered = hover == null ? null : tests[hover];

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const i = tests.length === 1 ? 0 : Math.round(((px - pad.left) / plotW) * (tests.length - 1));
    setHover(Math.min(tests.length - 1, Math.max(0, i)));
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <p className="text-sm text-ink-muted">Palabras por minuto, test a test</p>
        <p className="flex items-center gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-chart" /> Cada test
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 rounded-full bg-chart-strong" /> Promedio de 10
          </span>
        </p>
      </div>
      <div ref={ref} className="relative">
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`wpm de los últimos ${tests.length} tests`}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} />
                <text x={pad.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[11px] tabular-nums">
                  {t}
                </text>
              </g>
            ))}
            {hover != null && (
              <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + plotH} className="stroke-ink-faint" strokeWidth={1} />
            )}
            {tests.map((t, i) => (
              <circle
                key={t.id}
                cx={x(i)}
                cy={y(t.wpm)}
                r={hover === i ? 6 : 5}
                className="fill-chart stroke-card"
                strokeWidth={1.5}
              />
            ))}
            <path d={line} fill="none" className="stroke-chart-strong" strokeWidth={2} strokeLinejoin="round" />
            {/* Desde cuándo hasta cuándo (el eje va test a test, no por fecha) */}
            <text x={pad.left} y={height - 8} className="fill-ink-muted text-[11px]">
              {shortDate(tests[0].date)}
            </text>
            {tests.length > 1 && (
              <text x={width - pad.right} y={height - 8} textAnchor="end" className="fill-ink-muted text-[11px]">
                {shortDate(tests[tests.length - 1].date)}
              </text>
            )}
          </svg>
        )}
        {hovered && hover != null && (
          <div
            className="pointer-events-none absolute z-10 w-44 rounded-lg bg-card border border-line shadow-md px-3 py-2 text-xs"
            style={{ left: Math.max(0, Math.min(x(hover) - 88, width - 176)), top: 0 }}
          >
            <p className="text-ink-muted">
              {shortDate(hovered.date)} · {modeLabel(hovered.mode, hovered.mode2)}
            </p>
            <p className="text-ink font-semibold text-sm">{number(hovered.wpm)} wpm</p>
            <p className="text-ink-muted">
              {number(hovered.acc)} % precisión · promedio {number(avg[hover])}
            </p>
          </div>
        )}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-ink-muted hover:text-accent">Ver como tabla</summary>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="text-ink-muted">
                <th className="font-medium py-1">Fecha</th>
                <th className="font-medium py-1">Modo</th>
                <th className="font-medium py-1 text-right">wpm</th>
                <th className="font-medium py-1 text-right">Precisión</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[...tests].reverse().slice(0, 20).map((t) => (
                <tr key={t.id} className="border-t border-line-soft text-ink">
                  <td className="py-1">{shortDate(t.date)}</td>
                  <td className="py-1">{modeLabel(t.mode, t.mode2)}</td>
                  <td className="py-1 text-right">{number(t.wpm)}</td>
                  <td className="py-1 text-right">{number(t.acc)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
