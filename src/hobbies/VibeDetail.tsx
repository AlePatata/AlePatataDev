import { useEffect, useState } from 'react';
import type { VibeDetail as Detail, VibeFeature } from '../shared/hobbies';

const REPO = 'https://github.com/AlePatata/AlePatataDev';
const shortDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('es-CL', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
/** "nombres-fijos" → "Nombres fijos" */
const featureName = (branch: string) => {
  const words = branch.replace(/[-_/]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** "Ver más" de vibe coding: lo que hicimos con Claude en este repo, sacado de GitHub. */
export function VibeDetail() {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/public/hobbies/claude')
      .then((res) => (res.ok ? (res.json() as Promise<Detail>) : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="text-ink-muted">No se pudo cargar el detalle.</p>;
  if (!data) return <p className="text-ink-muted">Cargando…</p>;
  if (!data.totals.commits) return <p className="text-ink-muted">Todavía no hay commits sincronizados.</p>;

  const { totals } = data;
  const [last, ...older] = data.features;
  const stats: [string, string, string?][] = [
    ['Commits con Claude', totals.withClaude.toLocaleString('es-CL'), `de ${totals.commits.toLocaleString('es-CL')}`],
    ['Features', totals.features.toLocaleString('es-CL'), 'mergeadas a main'],
    ['Días programando', totals.days.toLocaleString('es-CL'), totals.since ? `desde el ${shortDate(totals.since)}` : undefined],
  ];

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(([label, value, detail]) => (
          <div key={label}>
            <dt className="text-xs text-ink-muted">{label}</dt>
            <dd className="text-lg font-semibold text-ink tabular-nums">{value}</dd>
            {detail && <dd className="text-xs text-ink-muted">{detail}</dd>}
          </div>
        ))}
      </dl>

      {last && (
        <div className="rounded-xl bg-soft px-4 py-3">
          <p className="text-xs text-ink-muted">Última feature · {shortDate(last.date)}</p>
          <p className="text-xl font-semibold text-ink mb-2">{featureName(last.branch)}</p>
          <CommitList feature={last} />
        </div>
      )}

      {older.length > 0 && (
        <div>
          <p className="text-sm text-ink-muted mb-2">Antes</p>
          <ul className="divide-y divide-line-soft">
            {older.map((f) => (
              <li key={f.sha}>
                <details className="group py-2">
                  <summary className="flex items-center justify-between gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden min-h-10">
                    <span className="text-ink group-open:text-accent">{featureName(f.branch)}</span>
                    <span className="text-xs text-ink-muted tabular-nums shrink-0">
                      {f.commits.length} {f.commits.length === 1 ? 'commit' : 'commits'} · {shortDate(f.date)}
                    </span>
                  </summary>
                  <div className="pt-1 pb-2">
                    <CommitList feature={f} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}

      <a href={`${REPO}/commits/main`} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-ink-muted underline decoration-mark hover:text-accent">
        Ver todos los commits en GitHub
      </a>
    </div>
  );
}

function CommitList({ feature }: { feature: VibeFeature }) {
  if (!feature.commits.length) return null;
  return (
    <ul className="space-y-1 text-sm text-ink-soft list-disc pl-5">
      {feature.commits.map((subject, i) => (
        <li key={i}>{subject}</li>
      ))}
      <li className="list-none -ml-5 pt-1">
        <a href={`${REPO}/commit/${feature.sha}`} target="_blank" rel="noopener noreferrer" className="text-xs text-ink-muted underline decoration-mark hover:text-accent">
          Ver el merge en GitHub
        </a>
      </li>
    </ul>
  );
}
