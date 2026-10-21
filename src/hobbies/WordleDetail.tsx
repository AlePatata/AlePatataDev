import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { WordleDetail as Detail } from '../shared/hobbies';
import { WordleGrid } from './WordleGrid';

const PLAY_URL = 'https://www.nytimes.com/games/wordle/index.html';

/** "Ver más" de Wordle: el de hoy (solo colores), estadísticas y los últimos días. */
export function WordleDetail() {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/public/hobbies/wordle')
      .then((res) => (res.ok ? (res.json() as Promise<Detail>) : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="text-ink-muted">No se pudo cargar el detalle.</p>;
  if (!data) return <p className="text-ink-muted">Cargando…</p>;

  const { today, todayNumber, stats, recent } = data;
  const maxBar = Math.max(1, ...stats.distribution);
  const tiles: [string, string | number][] = [
    ['Jugados', stats.played],
    ['% victorias', stats.played ? Math.round((100 * stats.won) / stats.played) : 0],
    ['Racha', stats.currentStreak],
    ['Máxima', stats.maxStreak],
  ];

  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr] md:gap-10">
      <div>
        <p className="text-sm text-ink-muted mb-2">
          Hoy · Wordle {todayNumber.toLocaleString('es-CL')}
          {today && ` · ${today.result ?? 'X'}/6${today.hardMode ? ' (difícil)' : ''}`}
        </p>
        {today ? (
          <WordleGrid rows={today.rows} />
        ) : (
          <p className="text-ink-soft max-w-56">Todavía no juego el de hoy.</p>
        )}
        <a
          href={PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-fit items-center gap-1.5 min-h-10 px-4 rounded-full bg-accent text-on-accent text-sm font-medium hover:bg-accent-hover"
        >
          Jugar el Wordle de hoy <ExternalLink size={14} />
        </a>
      </div>

      <div className="space-y-5 min-w-0">
        <dl className="grid grid-cols-4 gap-2 text-center">
          {tiles.map(([label, value]) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="text-xs text-ink-muted">{label}</dt>
              <dd className="text-2xl font-semibold text-ink tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <div>
          <p className="text-sm text-ink-muted mb-2">Intentos</p>
          <ol className="space-y-1">
            {stats.distribution.map((n, i) => (
              <li key={i} className="grid grid-cols-[1rem_1fr] items-center gap-2 text-xs">
                <span className="text-ink-muted tabular-nums">{i + 1}</span>
                <span className="flex items-center gap-2">
                  <span
                    className={`h-4 rounded-r-[4px] ${today?.result === i + 1 ? 'bg-accent' : 'bg-accent/40'}`}
                    style={{ width: `${(100 * n) / maxBar}%`, minWidth: n ? 4 : 0 }}
                  />
                  <span className="text-ink tabular-nums">{n}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {recent.length > 0 && (
          <div>
            <p className="text-sm text-ink-muted mb-2">Días anteriores</p>
            <ul className="flex flex-wrap gap-4">
              {recent.map((d) => (
                <li key={d.number} className="text-center">
                  <WordleGrid rows={d.rows} size="sm" />
                  <p className="text-xs text-ink-muted mt-1 tabular-nums">
                    #{d.number} · {d.result ?? 'X'}/6
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
