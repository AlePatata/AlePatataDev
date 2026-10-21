import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Footer } from '../components/Footer';
import { hobbies } from '../data/data';
import { Heatmap } from '../hobbies/Heatmap';
import type { HobbiesResponse, HobbySource } from '../shared/hobbies';

const names = Object.fromEntries(hobbies.map((h) => [h.source, h.short])) as Record<HobbySource, string>;

export function Hobbies() {
  const [data, setData] = useState<HobbiesResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/public/hobbies')
      .then((res) => (res.ok ? (res.json() as Promise<HobbiesResponse>) : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const daysFor = (source: string) => data?.days.filter((d) => d.source === source).length ?? 0;

  return (
    <Layout>
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-ink mb-2">Hobbies</h1>
          <div className="w-20 h-1 bg-mark mb-10 rounded-full" />
          <p className="text-ink-soft mb-12 max-w-2xl">
            Lo que hago fuera de la universidad, actualizado solo desde cada app.
          </p>

          {error && <p className="text-ink-muted mb-8">No se pudo cargar la actividad. Intenta de nuevo en un rato.</p>}
          {data && (
            <div className="mb-6">
              <Heatmap data={data} names={names} />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {hobbies.map((hobby) => (
              <article key={hobby.source} className="rounded-2xl bg-card border border-line-soft p-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h2 className="text-xl font-semibold text-ink">{hobby.name}</h2>
                  {hobby.url && (
                    <a
                      href={hobby.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Perfil de ${hobby.name}`}
                      className="p-2 -m-2 text-ink-muted hover:text-accent"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>
                <p className="text-ink-soft mb-4">{hobby.description}</p>
                <p className="text-sm text-ink-faint">
                  {data == null
                    ? error
                      ? '—'
                      : 'Cargando…'
                    : daysFor(hobby.source)
                      ? `${daysFor(hobby.source)} ${daysFor(hobby.source) === 1 ? 'día' : 'días'} con actividad este año`
                      : 'Pronto'}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </Layout>
  );
}
