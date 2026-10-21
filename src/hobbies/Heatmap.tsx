import { useEffect, useMemo, useRef, useState } from 'react';
import type { HobbiesResponse, HobbySource } from '../shared/hobbies';
import type { Hobby } from '../types';
import { buildHeatmap, type HeatCell } from './heatmap';

const CELL = 11;
const GAP = 2; // separación del color de la card entre celdas
const STEP = CELL + GAP;
const LEFT = 28; // espacio para "lun", "mié", "vie"
const TOP = 18; // espacio para los meses
const TOOLTIP_W = 224;
const WEEKDAYS: [number, string][] = [
  [0, 'lun'],
  [2, 'mié'],
  [4, 'vie'],
];
// Clases completas (no armadas con el nivel) para que Tailwind las vea y genere --color-heat-*
const LEVEL_FILL = ['fill-heat-0', 'fill-heat-1', 'fill-heat-2', 'fill-heat-3', 'fill-heat-4'];
const LEVEL_BG = ['bg-heat-0 border border-line', 'bg-heat-1', 'bg-heat-2', 'bg-heat-3', 'bg-heat-4'];

const longDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('es-CL', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

interface Props {
  data: HobbiesResponse;
  hobbies: Pick<Hobby, 'source' | 'short' | 'icon'>[];
}

/** Heatmap del último año estilo GitHub, con filtro por hobby. */
export function Heatmap({ data, hobbies }: Props) {
  const names = Object.fromEntries(hobbies.map((h) => [h.source, h.short])) as Record<HobbySource, string>;
  const [source, setSource] = useState<HobbySource | null>(null);
  // x, y: posición de la celda dentro del recuadro visible (ya descontado el scroll); boxWidth: su ancho
  const [hover, setHover] = useState<{ cell: HeatCell; x: number; y: number; boxWidth: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { weeks, months } = useMemo(
    () => buildHeatmap(data.from, data.to, data.days, source ? [source] : undefined),
    [data, source],
  );
  const active = weeks.flat().filter((c): c is HeatCell => c != null && c.days.length > 0);
  const width = LEFT + weeks.length * STEP;
  const height = TOP + 7 * STEP;

  // En el celular no cabe el año: parte mostrando lo más reciente (la derecha)
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weeks.length]);

  const chip = (selected: boolean) =>
    `min-h-10 min-w-10 rounded-full border text-sm transition-colors ${
      selected ? 'bg-accent text-on-accent border-accent' : 'border-line text-ink-soft hover:text-accent hover:border-accent'
    }`;

  return (
    <div className="rounded-2xl bg-card border border-line-soft p-4 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
        <h2 className="text-xl font-semibold text-ink">Mi año</h2>
        <p className="text-sm text-ink-muted">
          {active.length} {active.length === 1 ? 'día' : 'días'} con actividad
          {source ? ` en ${names[source]}` : ''}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filtrar por hobby">
        <button type="button" className={`${chip(source == null)} px-3`} aria-pressed={source == null} onClick={() => setSource(null)}>
          Todo
        </button>
        {/* Solo el ícono; el nombre queda para lectores de pantalla y al pasar el mouse */}
        {hobbies.map((h) => (
          <button
            key={h.source}
            type="button"
            className={`${chip(source === h.source)} grid place-items-center p-1.5`}
            aria-pressed={source === h.source}
            aria-label={h.short}
            title={h.short}
            onClick={() => setSource(h.source)}
          >
            <img src={h.icon} alt="" width={26} height={26} className="size-[26px] rounded-md" />
          </button>
        ))}
      </div>

      {/* El tooltip va fuera del contenedor con scroll, así no se corta en las filas de abajo */}
      <div ref={boxRef} className="relative" onPointerLeave={() => setHover(null)}>
        <div ref={scrollRef} className="overflow-x-auto" onScroll={() => setHover(null)}>
          <svg width={width} height={height} role="img" aria-label={`Actividad del último año: ${active.length} días con actividad`}>
            {months.map((m) => (
              <text key={`${m.week}-${m.label}`} x={LEFT + m.week * STEP} y={11} className="fill-ink-muted text-[11px]">
                {m.label}
              </text>
            ))}
            {WEEKDAYS.map(([row, label]) => (
              <text key={label} x={0} y={TOP + row * STEP + CELL - 2} className="fill-ink-muted text-[11px]">
                {label}
              </text>
            ))}
            {weeks.map((week, w) =>
              week.map((cell, d) =>
                cell ? (
                  <rect
                    key={cell.date}
                    x={LEFT + w * STEP}
                    y={TOP + d * STEP}
                    width={CELL}
                    height={CELL}
                    rx={2}
                    className={LEVEL_FILL[cell.level]}
                    // Los días sin actividad son transparentes: solo el borde marca el calendario
                    stroke={hover?.cell.date === cell.date ? 'var(--color-ink)' : cell.level === 0 ? 'var(--color-line)' : 'none'}
                    strokeWidth={hover?.cell.date === cell.date ? 1.5 : 1}
                    onPointerEnter={() =>
                      setHover({
                        cell,
                        x: LEFT + w * STEP - (scrollRef.current?.scrollLeft ?? 0),
                        y: TOP + d * STEP,
                        boxWidth: boxRef.current?.clientWidth ?? width,
                      })
                    }
                  />
                ) : null,
              ),
            )}
          </svg>
        </div>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg bg-card border border-line shadow-md px-3 py-2 text-xs"
            style={{
              width: TOOLTIP_W,
              left: Math.max(0, Math.min(hover.x - TOOLTIP_W / 2, hover.boxWidth - TOOLTIP_W)),
              top: hover.y + STEP + 4,
            }}
          >
            <p className="text-ink-muted first-letter:uppercase">{longDate(hover.cell.date)}</p>
            {hover.cell.days.length === 0 ? (
              <p className="text-ink">Sin actividad</p>
            ) : (
              hover.cell.days.map((d) => (
                <p key={d.source} className="text-ink">
                  <span className="font-semibold">{names[d.source]}</span>
                  {d.summary ? `: ${d.summary}` : ''}
                </p>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-1 mt-2 text-xs text-ink-muted" aria-hidden="true">
        <span className="mr-1">Menos</span>
        {LEVEL_BG.map((bg) => (
          <span key={bg} className={`inline-block size-[11px] rounded-[2px] ${bg}`} />
        ))}
        <span className="ml-1">Más</span>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-ink-muted hover:text-accent">Ver como lista</summary>
        {active.length === 0 ? (
          <p className="mt-2 text-ink-muted">Todavía no hay actividad.</p>
        ) : (
          <ul className="mt-2 max-h-72 overflow-y-auto divide-y divide-line-soft">
            {[...active].reverse().map((cell) => (
              <li key={cell.date} className="py-1.5 text-ink">
                <span className="block text-ink-muted first-letter:uppercase">{longDate(cell.date)}</span>
                {cell.days.map((d) => (
                  <span key={d.source} className="block">
                    {names[d.source]}
                    {d.summary ? `: ${d.summary}` : ''}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}
