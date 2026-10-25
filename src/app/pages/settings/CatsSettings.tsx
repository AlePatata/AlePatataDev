import { ChevronDown, ChevronLeft, ChevronRight, ImagePlus, Play, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { feel } from '../../../cats/catBus';
import { CatFace } from '../../../cats/CatFace';
import { EMOTIONS } from '../../../cats/emotions';
import { setCatLooks, useCatLooks } from '../../../cats/looks';
import { CAT_LIMITS, catFrameUrl, EMOTION_IDS, type CatLook, type CatLooks, type Emotion } from '../../../shared/cats';
import { api } from '../../api';
import { card, errorText, input, primary } from './ui';

const FRAME_SPEEDS = [150, 250, 400, 500, 800, 1200, 2000, 3000];

const seconds = (ms: number) => `${(ms / 1000).toLocaleString('es-CL')} s`;

/** Imágenes propias para cada emoción de los gatitos; con varias se turnan como una animación. */
export function CatsSettings() {
  const looks = useCatLooks();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    api<CatLooks>('/api/cats')
      .then((next) => {
        setCatLooks(next);
        setLoaded(true);
      })
      .catch((e) => setError(errorText(e)));
  }, []);

  /** Corre un cambio y deja la configuración que devuelve el servidor (así se ve al tiro en todo el sitio). */
  async function run(action: () => Promise<CatLooks | void>) {
    setError(undefined);
    try {
      const next = await action();
      if (next) setCatLooks(next);
    } catch (e) {
      setError(errorText(e));
    }
  }

  return (
    <div className={card}>
      <div>
        <h2 className="text-lg font-semibold text-ink">Gatitos</h2>
        <p className="text-sm text-ink-muted">
          Ponle imágenes propias a cada emoción (PNG, JPEG, WebP o GIF, hasta 1 MB). Con dos o más se turnan en bucle, como una
          animación; sin imágenes sale el dibujo. Ojo: son <strong>públicas</strong>, los gatitos salen también en el portafolio.
        </p>
      </div>
      {loaded && (
        <ul className="divide-y divide-line-soft">
          {EMOTION_IDS.map((emotion) => (
            <CatLookRow key={emotion} emotion={emotion} look={looks[emotion]} run={run} />
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</p>}
    </div>
  );
}

function CatLookRow({ emotion, look, run }: { emotion: Emotion; look?: CatLook; run: (action: () => Promise<CatLooks | void>) => void }) {
  const frames = look?.frames ?? [];
  const [frameMs, setFrameMs] = useState(look?.frameMs ?? CAT_LIMITS.defaultFrameMs);
  const [messages, setMessages] = useState((look?.messages ?? []).join('\n'));
  const [status, setStatus] = useState<string>();
  const { label, messages: defaults } = EMOTIONS[emotion];

  const upload = (files: FileList | null) =>
    run(async () => {
      let next: CatLooks | undefined;
      // Una por una, en el orden elegido
      for (const file of Array.from(files ?? [])) {
        if (file.size > CAT_LIMITS.maxImageBytes) throw new Error(`"${file.name}" pesa más de 1 MB`);
        next = await api<CatLooks>(`/api/cats/${emotion}/frames`, { method: 'POST', body: file });
        setCatLooks(next);
      }
      return next;
    });

  const move = (i: number, by: -1 | 1) => {
    const order = [...frames];
    [order[i], order[i + by]] = [order[i + by], order[i]];
    run(() => api<CatLooks>(`/api/cats/${emotion}`, { method: 'PUT', body: { frameIds: order } }));
  };

  const remove = (id: string) => run(() => api<CatLooks>(`/api/cats/frames/${id}`, { method: 'DELETE' }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus(undefined);
    run(async () => {
      const next = await api<CatLooks>(`/api/cats/${emotion}`, { method: 'PUT', body: { frameMs, messages: messages.split('\n') } });
      setStatus('Guardado.');
      return next;
    });
  }

  return (
    <li>
      <details className="group">
        <summary className="flex items-center gap-3 py-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <CatFace emotion={emotion} className="w-12 shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block font-medium text-ink">{label}</span>
            <span className="block text-sm text-ink-muted">
              {frames.length === 0 ? 'El dibujo' : frames.length === 1 ? '1 imagen' : `${frames.length} imágenes, ${seconds(look!.frameMs)} cada una`}
            </span>
          </span>
          <ChevronDown size={18} className="text-ink-faint transition-transform group-open:rotate-180" />
        </summary>

        <form onSubmit={save} className="space-y-4 pb-4 pt-2">
          <div className="flex flex-wrap gap-3">
            {frames.map((id, i) => (
              <div key={id} className="w-24 rounded-xl border border-line-soft bg-soft p-1">
                <img src={catFrameUrl(id)} alt={`Imagen ${i + 1}`} className="w-full aspect-square object-contain" />
                <div className="flex justify-between">
                  <button type="button" aria-label="Mover antes" disabled={i === 0} onClick={() => move(i, -1)} className="p-2 text-ink-muted hover:text-ink disabled:opacity-30">
                    <ChevronLeft size={16} />
                  </button>
                  <button type="button" aria-label={`Borrar imagen ${i + 1}`} onClick={() => remove(id)} className="p-2 text-ink-faint hover:text-ink-muted">
                    <Trash2 size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Mover después"
                    disabled={i === frames.length - 1}
                    onClick={() => move(i, 1)}
                    className="p-2 text-ink-muted hover:text-ink disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
            {frames.length < CAT_LIMITS.maxFrames && (
              <label className="w-24 min-h-24 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-sm text-ink-muted hover:text-accent hover:border-mark cursor-pointer text-center p-2">
                <ImagePlus size={20} />
                Agregar
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => {
                    upload(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>

          {frames.length > 1 && (
            <label className="block space-y-1">
              <span className="text-sm text-ink-soft">Cuánto dura cada imagen</span>
              <select value={frameMs} onChange={(e) => setFrameMs(Number(e.target.value))} className={`${input} block`}>
                {[...new Set([...FRAME_SPEEDS, frameMs])].sort((a, b) => a - b).map((ms) => (
                  <option key={ms} value={ms}>
                    {seconds(ms)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block space-y-1">
            <span className="text-sm text-ink-soft">Frases, una por línea</span>
            <textarea
              rows={3}
              value={messages}
              onChange={(e) => setMessages(e.target.value)}
              placeholder={defaults.join('\n')}
              className={`${input} w-full text-base`}
            />
            <span className="block text-xs text-ink-muted">Vacío = las de siempre (las que se ven de ejemplo).</span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className={primary}>
              Guardar
            </button>
            <button
              type="button"
              onClick={() => feel(emotion, { force: true })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-line text-sm text-ink hover:bg-card-hover"
            >
              <Play size={16} className="text-accent" /> Probar
            </button>
            {status && <p className="text-sm text-ink-muted">{status}</p>}
          </div>
        </form>
      </details>
    </li>
  );
}
