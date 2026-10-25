import { useEffect, useState } from 'react';
import { formatTime, type CubeAverage, type CubeDetail as Detail, type CubePuzzle, type CubeSolve } from '../shared/hobbies';
import { movingAverage } from './stats';
import { useWidth } from './useWidth';

const average = (a: CubeAverage) => (a == null ? '—' : a === 'DNF' ? 'DNF' : formatTime(a));
const solveTime = (s: CubeSolve) => (s.penalty === 2 ? 'DNF' : `${formatTime(s.ms)}${s.penalty === 1 ? '+' : ''}`);
const shortDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('es-CL', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });

const chip = (selected: boolean) =>
  `min-h-10 px-4 rounded-full border text-sm transition-colors ${
    selected ? 'bg-accent text-on-accent border-accent' : 'border-line text-ink-soft hover:text-accent hover:border-accent'
  }`;

/** "Ver más" de los cubos: un selector de puzzle, el PB, las medias y la evolución de los tiempos. */
export function CubeDetail() {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    fetch('/api/public/hobbies/cube')
      .then((res) => (res.ok ? (res.json() as Promise<Detail>) : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="text-ink-muted">No se pudo cargar el detalle.</p>;
  if (!data) return <p className="text-ink-muted">Cargando…</p>;
  if (!data.puzzles.length) return <p className="text-ink-muted">Todavía no hay tiempos sincronizados.</p>;

  const puzzle = data.puzzles[Math.min(selected, data.puzzles.length - 1)];

  return (
    <div className="space-y-6">
      {data.puzzles.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Puzzle">
          {data.puzzles.map((p, i) => (
            <button key={p.puzzle} type="button" className={chip(p === puzzle)} aria-pressed={p === puzzle} onClick={() => setSelected(i)}>
              {p.label}
            </button>
          ))}
        </div>
      )}
      <PuzzleStats puzzle={puzzle} />
      <TimesChart key={puzzle.puzzle} solves={puzzle.solves} />
    </div>
  );
}

function PuzzleStats({ puzzle }: { puzzle: CubePuzzle }) {
  const tiles: [string, string, string?][] = [
    ['Mejor single', puzzle.best == null ? '—' : formatTime(puzzle.best)],
    ['ao5', average(puzzle.current.ao5), `mejor ${average(puzzle.bests.ao5)}`],
    ['ao12', average(puzzle.current.ao12), `mejor ${average(puzzle.bests.ao12)}`],
    ['ao100', average(puzzle.current.ao100), `mejor ${average(puzzle.bests.ao100)}`],
  ];
  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map(([label, value, detail]) => (
          <li key={label} className="rounded-xl bg-soft px-4 py-3">
            <p className="text-xs text-ink-muted">{label}</p>
            <p className="text-2xl font-semibold text-ink tabular-nums">{value}</p>
            {detail && <p className="text-xs text-ink-muted tabular-nums">{detail}</p>}
          </li>
        ))}
      </ul>
      <p className="text-sm text-ink-muted">
        {puzzle.count.toLocaleString('es-CL')} {puzzle.count === 1 ? 'resolución' : 'resoluciones'}
        {puzzle.dnfs > 0 && `, ${puzzle.dnfs} DNF`}. Las medias son como en la WCA: sin el mejor ni el peor
        (en ao100, sin los 5 de cada lado).
      </p>
    </div>
  );
}

/** Pasos posibles del eje, en segundos. */
const STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300];

/** Cada tiempo (puntos, sin los DNF) y su media móvil de 5 (línea), del más antiguo al más reciente. */
function TimesChart({ solves }: { solves: CubeSolve[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const valid = solves.filter((s) => s.penalty !== 2);
  const height = 200;
  const pad = { top: 12, right: 12, bottom: 28, left: 44 };
  const plotW = Math.max(width - pad.left - pad.right, 0);
  const plotH = height - pad.top - pad.bottom;

  const seconds = valid.map((s) => s.ms / 1000);
  const avg = movingAverage(seconds, 5);
  const min = Math.min(...seconds);
  const max = Math.max(...seconds);
  const step = STEPS.find((s) => (max - min) / s <= 5) ?? STEPS[STEPS.length - 1];
  const lo = Math.floor(min / step) * step;
  const hi = Math.max(Math.ceil(max / step) * step, lo + step);
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => lo + i * step);
  const x = (i: number) => pad.left + (valid.length === 1 ? plotW / 2 : (i / (valid.length - 1)) * plotW);
  const y = (v: number) => pad.top + plotH - ((v - lo) / (hi - lo)) * plotH;
  const line = avg.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
  const hovered = hover == null ? null : valid[hover];

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const i = valid.length === 1 ? 0 : Math.round(((px - pad.left) / plotW) * (valid.length - 1));
    setHover(Math.min(valid.length - 1, Math.max(0, i)));
  }

  return (
    <div>
      {valid.length > 0 && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <p className="text-sm text-ink-muted">Segundos por resolución (más abajo, más rápido)</p>
            <p className="flex items-center gap-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-chart" /> Cada resolución
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 rounded-full bg-chart-strong" /> Promedio de 5
              </span>
            </p>
          </div>
          <div ref={ref} className="relative">
            {width > 0 && (
              <svg
                width={width}
                height={height}
                role="img"
                aria-label={`Tiempos de las últimas ${valid.length} resoluciones`}
                onPointerMove={onMove}
                onPointerLeave={() => setHover(null)}
              >
                {ticks.map((t) => (
                  <g key={t}>
                    <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} />
                    <text x={pad.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[11px] tabular-nums">
                      {t >= 60 ? `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` : t}
                    </text>
                  </g>
                ))}
                {hover != null && (
                  <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + plotH} className="stroke-ink-faint" strokeWidth={1} />
                )}
                {valid.map((s, i) => (
                  <circle
                    key={s.timestamp}
                    cx={x(i)}
                    cy={y(seconds[i])}
                    r={hover === i ? 6 : 5}
                    className="fill-chart stroke-card"
                    strokeWidth={1.5}
                  />
                ))}
                <path d={line} fill="none" className="stroke-chart-strong" strokeWidth={2} strokeLinejoin="round" />
                <text x={pad.left} y={height - 8} className="fill-ink-muted text-[11px]">
                  {shortDate(valid[0].date)}
                </text>
                {valid.length > 1 && (
                  <text x={width - pad.right} y={height - 8} textAnchor="end" className="fill-ink-muted text-[11px]">
                    {shortDate(valid[valid.length - 1].date)}
                  </text>
                )}
              </svg>
            )}
            {hovered && hover != null && (
              <div
                className="pointer-events-none absolute z-10 w-44 rounded-lg bg-card border border-line shadow-md px-3 py-2 text-xs"
                style={{ left: Math.max(0, Math.min(x(hover) - 88, width - 176)), top: 0 }}
              >
                <p className="text-ink-muted">{shortDate(hovered.date)}</p>
                <p className="text-ink font-semibold text-sm tabular-nums">{solveTime(hovered)} s</p>
                <p className="text-ink-muted tabular-nums">promedio de 5: {formatTime(avg[hover] * 1000)}</p>
              </div>
            )}
          </div>
        </>
      )}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-ink-muted hover:text-accent">Ver como tabla</summary>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="text-ink-muted">
                <th className="font-medium py-1">Fecha</th>
                <th className="font-medium py-1 text-right">Tiempo</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[...solves].reverse().slice(0, 20).map((s) => (
                <tr key={s.timestamp} className="border-t border-line-soft text-ink">
                  <td className="py-1">{shortDate(s.date)}</td>
                  <td className="py-1 text-right">{solveTime(s)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
