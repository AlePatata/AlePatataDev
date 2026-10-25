import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { CfContest, CodeforcesDetail as Detail } from '../shared/hobbies';
import { useWidth } from './useWidth';

const shortDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('es-CL', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
const problemUrl = (contestId: number | null, index: string) =>
  contestId == null
    ? 'https://codeforces.com/problemset'
    : contestId >= 100000
      ? `https://codeforces.com/gym/${contestId}/problem/${index}`
      : `https://codeforces.com/problemset/problem/${contestId}/${index}`;

/** Barras horizontales simples: etiqueta, barra proporcional al máximo y el número. */
function Bars({ items, label }: { items: { key: string; label: string; count: number }[]; label: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div>
      <p className="text-sm text-ink-muted mb-2">{label}</p>
      {/* Una sola grilla para que todas las barras partan en la misma columna */}
      <ol className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 text-xs">
        {items.map((i) => (
          <li key={i.key} className="contents">
            <span className="text-ink-muted tabular-nums">{i.label}</span>
            <span className="flex items-center gap-2 min-w-0">
              <span className="h-4 rounded-r-[4px] bg-chart" style={{ width: `${(100 * i.count) / max}%`, minWidth: 4 }} />
              <span className="text-ink tabular-nums">{i.count}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** "Ver más" de Codeforces: rating, resueltos por dificultad, tags y lo último resuelto. */
export function CodeforcesDetail() {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/public/hobbies/codeforces')
      .then((res) => (res.ok ? (res.json() as Promise<Detail>) : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="text-ink-muted">No se pudo cargar el detalle.</p>;
  if (!data) return <p className="text-ink-muted">Cargando…</p>;
  if (!data.submissions) return <p className="text-ink-muted">Todavía no hay envíos sincronizados.</p>;

  const tiles: [string, string, string?][] = [
    ['Rating', data.rating == null ? '—' : String(data.rating), data.maxRating == null ? undefined : `máximo ${data.maxRating}`],
    ['Concursos', String(data.contests.length)],
    ['Resueltos', String(data.solved), `${data.submissions} envíos`],
    ['Racha de AC', `${data.streak.current} ${data.streak.current === 1 ? 'día' : 'días'}`, `máxima ${data.streak.max}`],
  ];

  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map(([label, value, detail]) => (
          <li key={label} className="rounded-xl bg-soft px-4 py-3">
            <p className="text-xs text-ink-muted">{label}</p>
            <p className="text-2xl font-semibold text-ink tabular-nums">{value}</p>
            {detail && <p className="text-xs text-ink-muted tabular-nums">{detail}</p>}
          </li>
        ))}
      </ul>

      {data.contests.length > 0 && <RatingChart contests={data.contests} />}

      <div className="grid gap-6 md:grid-cols-2">
        <Bars
          label="Resueltos por dificultad"
          items={data.byRating.map((b) => ({ key: String(b.rating), label: b.rating == null ? 'Sin' : String(b.rating), count: b.count }))}
        />
        <Bars label="Tags más resueltos" items={data.tags.map((t) => ({ key: t.tag, label: t.tag, count: t.count }))} />
      </div>

      {data.recent.length > 0 && (
        <div>
          <p className="text-sm text-ink-muted mb-2">Lo último que resolví</p>
          <ul className="divide-y divide-line-soft">
            {data.recent.map((s) => (
              <li key={`${s.contestId}-${s.index}`}>
                <a
                  href={problemUrl(s.contestId, s.index)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-2 min-h-10 text-sm hover:text-accent"
                >
                  <span className="text-ink-muted tabular-nums w-12 shrink-0">{s.rating ?? '—'}</span>
                  <span className="text-ink flex-1 min-w-0 truncate">
                    {s.contestId ?? ''}
                    {s.index} · {s.name}
                  </span>
                  <span className="text-xs text-ink-muted shrink-0">{shortDate(s.date)}</span>
                  <ExternalLink size={14} className="text-ink-faint shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Rating después de cada concurso, del más antiguo al más reciente. */
function RatingChart({ contests }: { contests: CfContest[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const height = 200;
  const pad = { top: 12, right: 12, bottom: 28, left: 44 };
  const plotW = Math.max(width - pad.left - pad.right, 0);
  const plotH = height - pad.top - pad.bottom;

  const ratings = contests.map((c) => c.newRating);
  const lo = Math.floor(Math.min(...ratings) / 100) * 100;
  const hi = Math.max(Math.ceil(Math.max(...ratings) / 100) * 100, lo + 100);
  const step = hi - lo > 600 ? 200 : 100;
  const ticks = Array.from({ length: Math.floor((hi - lo) / step) + 1 }, (_, i) => lo + i * step);
  const x = (i: number) => pad.left + (contests.length === 1 ? plotW / 2 : (i / (contests.length - 1)) * plotW);
  const y = (v: number) => pad.top + plotH - ((v - lo) / (hi - lo)) * plotH;
  const line = ratings.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
  const hovered = hover == null ? null : contests[hover];

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const i = contests.length === 1 ? 0 : Math.round(((px - pad.left) / plotW) * (contests.length - 1));
    setHover(Math.min(contests.length - 1, Math.max(0, i)));
  }

  return (
    <div>
      <p className="text-sm text-ink-muted mb-2">Rating después de cada concurso</p>
      <div ref={ref} className="relative">
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`Rating en ${contests.length} concursos`}
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
            <path d={line} fill="none" className="stroke-chart-strong" strokeWidth={2} strokeLinejoin="round" />
            {contests.map((c, i) => (
              <circle
                key={c.contestId}
                cx={x(i)}
                cy={y(c.newRating)}
                r={hover === i ? 6 : 4}
                className="fill-chart stroke-card"
                strokeWidth={1.5}
              />
            ))}
            <text x={pad.left} y={height - 8} className="fill-ink-muted text-[11px]">
              {shortDate(contests[0].date)}
            </text>
            {contests.length > 1 && (
              <text x={width - pad.right} y={height - 8} textAnchor="end" className="fill-ink-muted text-[11px]">
                {shortDate(contests[contests.length - 1].date)}
              </text>
            )}
          </svg>
        )}
        {hovered && hover != null && (
          <div
            className="pointer-events-none absolute z-10 w-56 rounded-lg bg-card border border-line shadow-md px-3 py-2 text-xs"
            style={{ left: Math.max(0, Math.min(x(hover) - 112, width - 224)), top: 0 }}
          >
            <p className="text-ink-muted">{shortDate(hovered.date)}</p>
            <p className="text-ink font-medium line-clamp-2">{hovered.name}</p>
            <p className="text-ink font-semibold text-sm tabular-nums">
              {hovered.newRating}{' '}
              <span className="font-normal text-ink-muted">
                ({hovered.newRating >= hovered.oldRating ? '+' : ''}
                {hovered.newRating - hovered.oldRating})
              </span>
            </p>
            <p className="text-ink-muted tabular-nums">puesto {hovered.rank.toLocaleString('es-CL')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
