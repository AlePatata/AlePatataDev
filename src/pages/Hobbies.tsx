import { useEffect, useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Footer } from '../components/Footer';
import { hobbies } from '../data/data';
import { CubeDetail } from '../hobbies/CubeDetail';
import { Heatmap } from '../hobbies/Heatmap';
import { MonkeytypeDetail } from '../hobbies/MonkeytypeDetail';
import { VibeDetail } from '../hobbies/VibeDetail';
import { WordleDetail } from '../hobbies/WordleDetail';
import type { HobbiesResponse, HobbySource } from '../shared/hobbies';

/** El "Ver más" de cada hobby. Los demás se agregan a medida que tengan datos. */
const DETAILS: Partial<Record<HobbySource, () => React.ReactNode>> = {
  monkeytype: MonkeytypeDetail,
  wordle: WordleDetail,
  cube: CubeDetail,
  claude: VibeDetail,
};

export function Hobbies() {
  const [data, setData] = useState<HobbiesResponse | null>(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState<HobbySource | null>(null);

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
              <Heatmap data={data} hobbies={hobbies} />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {hobbies.map((hobby) => {
              const Detail = DETAILS[hobby.source];
              const isOpen = open === hobby.source;
              return (
                <article
                  key={hobby.source}
                  className={`rounded-2xl bg-card border border-line-soft p-6 ${isOpen ? 'md:col-span-2' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <img src={hobby.icon} alt="" width={40} height={40} className="size-10 rounded-xl shrink-0" />
                      <h2 className="text-xl font-semibold text-ink">{hobby.name}</h2>
                    </div>
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
                        : data.connected.includes(hobby.source)
                          ? 'Sin actividad este año todavía'
                          : 'Pronto'}
                  </p>
                  {Detail && (
                    <>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`detalle-${hobby.source}`}
                        onClick={() => setOpen(isOpen ? null : hobby.source)}
                        className="mt-3 -ml-2 inline-flex items-center gap-1 min-h-10 px-2 rounded-lg text-sm font-medium text-accent hover:bg-soft"
                      >
                        {isOpen ? 'Ver menos' : 'Ver más'}
                        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div id={`detalle-${hobby.source}`} className="mt-4 pt-4 border-t border-line-soft">
                          <Detail />
                        </div>
                      )}
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </Layout>
  );
}
