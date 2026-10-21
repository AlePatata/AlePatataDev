import { ChevronDown, ChevronLeft, ChevronRight, ImagePlus, Play, Plus, RefreshCw, Trash2, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { feel } from '../../cats/catBus';
import { CatFace } from '../../cats/CatFace';
import { EMOTIONS } from '../../cats/emotions';
import { setCatLooks, useCatLooks } from '../../cats/looks';
import { CAT_LIMITS, catFrameUrl, EMOTION_IDS, type CatLook, type CatLooks, type Emotion } from '../../shared/cats';
import type { SyncStatus } from '../../shared/hobbies';
import type { Category, CategoryKind, RuleInfo, Settings } from '../../shared/summary';
import { api } from '../api';
import { CategoryChip, CategorySelect } from '../categories';
import { formatCLP } from '../format';
import { PageTitle } from '../PageTitle';
import { useCategories } from '../useCategories';

const card = 'bg-card rounded-2xl border border-line-soft shadow-sm p-4 sm:p-5 space-y-4';
const input = 'bg-card rounded-lg border border-line px-3 py-2 text-ink focus:border-mark focus:outline-none';
const primary = 'flex items-center gap-1.5 px-4 py-2 bg-accent text-on-accent rounded-full text-sm font-medium hover:bg-accent-hover disabled:opacity-50';

const KIND_LABEL: Record<CategoryKind, string> = { expense: 'Gasto', refund: 'Reembolso', income: 'Ingreso' };

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function SettingsPage() {
  const { categories, byId, reload } = useCategories();
  return (
    <section className="max-w-3xl space-y-6">
      <PageTitle>Ajustes</PageTitle>
      <MoneySettings />
      <NameSettings />
      <CategoriesEditor categories={categories} onChange={reload} />
      <RulesEditor categories={categories} byId={byId} />
      <HobbySync />
      <CatsEditor />
    </section>
  );
}

/** "300.000" → 300000; vacío → null */
const parseCLP = (s: string) => (s.replace(/\D/g, '') === '' ? null : Number(s.replace(/\D/g, '')));

function MoneySettings() {
  const [income, setIncome] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    api<Settings>('/api/settings').then((s) => {
      setIncome(s.monthlyIncome == null ? '' : s.monthlyIncome.toLocaleString('es-CL'));
      setBudget(s.monthlyBudget == null ? '' : s.monthlyBudget.toLocaleString('es-CL'));
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const s = await api<Settings>('/api/settings', {
        method: 'PUT',
        body: { monthlyIncome: parseCLP(income), monthlyBudget: parseCLP(budget) },
      });
      setStatus(`Guardado: ingreso ${s.monthlyIncome == null ? '—' : formatCLP(s.monthlyIncome)}, presupuesto ${s.monthlyBudget == null ? 'igual al ingreso' : formatCLP(s.monthlyBudget)}.`);
    } catch (e) {
      setStatus(errorText(e));
    }
  }

  return (
    <form onSubmit={save} className={card}>
      <h2 className="text-lg font-semibold text-ink">Ingreso y presupuesto</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm text-ink-soft">Ingreso mensual</span>
          <input inputMode="numeric" placeholder="Ej. 300000" value={income} onChange={(e) => setIncome(e.target.value)} className={`${input} w-full`} />
          <span className="block text-xs text-ink-muted">Lo que recibes al mes (mesada, sueldo, beca).</span>
        </label>
        <label className="space-y-1">
          <span className="text-sm text-ink-soft">Presupuesto mensual (opcional)</span>
          <input inputMode="numeric" placeholder="Igual al ingreso" value={budget} onChange={(e) => setBudget(e.target.value)} className={`${input} w-full`} />
          <span className="block text-xs text-ink-muted">Cuánto quieres gastar como máximo. Vacío = el ingreso.</span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={primary}>
          Guardar
        </button>
        {status && <p className="text-sm text-ink-muted">{status}</p>}
      </div>
    </form>
  );
}

/** Nombres que se muestran en la wishlist ("Agregado por …"). */
function NameSettings() {
  const [owner, setOwner] = useState('');
  const [partner, setPartner] = useState('');
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    api<Settings>('/api/settings').then((s) => {
      setOwner(s.ownerName ?? '');
      setPartner(s.partnerName ?? '');
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api<Settings>('/api/settings', { method: 'PUT', body: { ownerName: owner.trim() || null, partnerName: partner.trim() || null } });
      setStatus('Guardado.');
    } catch (e) {
      setStatus(errorText(e));
    }
  }

  return (
    <form onSubmit={save} className={card}>
      <div>
        <h2 className="text-lg font-semibold text-ink">Nombres</h2>
        <p className="text-sm text-ink-muted">Se muestran en la wishlist, en "Agregado por …".</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm text-ink-soft">Tu nombre</span>
          <input maxLength={40} placeholder="Ej. Ale" value={owner} onChange={(e) => setOwner(e.target.value)} className={`${input} w-full`} />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-ink-soft">Nombre de tu pololo</span>
          <input maxLength={40} value={partner} onChange={(e) => setPartner(e.target.value)} className={`${input} w-full`} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={primary}>
          Guardar
        </button>
        {status && <p className="text-sm text-ink-muted">{status}</p>}
      </div>
    </form>
  );
}

function CategoriesEditor({ categories, onChange }: { categories: Category[]; onChange: () => void }) {
  const [error, setError] = useState<string>();
  const [draft, setDraft] = useState({ name: '', color: '#ec4899', kind: 'expense' as CategoryKind });

  async function run(action: () => Promise<unknown>) {
    setError(undefined);
    try {
      await action();
    } catch (e) {
      setError(errorText(e));
    } finally {
      onChange();
    }
  }

  const update = (c: Category, patch: Partial<Category>) =>
    run(() => api(`/api/categories/${c.id}`, { method: 'PATCH', body: patch }));

  const remove = (c: Category) => {
    if (!confirm(`¿Borrar "${c.name}"? Sus movimientos quedan sin categoría y sus reglas se borran.`)) return;
    run(() => api(`/api/categories/${c.id}`, { method: 'DELETE' }));
  };

  function add(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      await api('/api/categories', { method: 'POST', body: { ...draft, name: draft.name.trim() } });
      setDraft({ ...draft, name: '' });
    });
  }

  return (
    <div className={card}>
      <div>
        <h2 className="text-lg font-semibold text-ink">Categorías</h2>
        <p className="text-sm text-ink-muted">
          Los <strong>reembolsos</strong> restan del gasto del mes; los <strong>ingresos</strong> se comparan con tu ingreso mensual.
        </p>
      </div>
      <ul className="divide-y divide-line-soft">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-1.5 sm:gap-2 py-2">
            <input
              type="color"
              aria-label={`Color de ${c.name}`}
              defaultValue={c.color}
              onBlur={(e) => e.target.value !== c.color && update(c, { color: e.target.value })}
              className="size-7 sm:size-8 shrink-0 rounded cursor-pointer bg-transparent"
            />
            <input
              aria-label="Nombre"
              defaultValue={c.name}
              onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== c.name && update(c, { name: e.target.value.trim() })}
              className={`${input} flex-1 min-w-0 py-1.5 px-2 sm:px-3 text-sm sm:text-base`}
            />
            <select
              aria-label="Tipo"
              value={c.kind}
              onChange={(e) => update(c, { kind: e.target.value as CategoryKind })}
              className={`${input} py-1.5 px-1.5 sm:px-3 w-[6.5rem] sm:w-32 text-sm sm:text-base`}
            >
              {Object.entries(KIND_LABEL).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
            <button aria-label={`Borrar ${c.name}`} onClick={() => remove(c)} className="p-1 sm:p-2 text-ink-faint hover:text-ink-muted">
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="flex flex-wrap items-center gap-2 pt-2 border-t border-line-soft">
        <input
          type="color"
          aria-label="Color"
          value={draft.color}
          onChange={(e) => setDraft({ ...draft, color: e.target.value })}
          className="size-8 rounded cursor-pointer bg-transparent"
        />
        <input
          required
          placeholder="Nueva categoría"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className={`${input} flex-1 min-w-40 py-1.5`}
        />
        <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as CategoryKind })} className={`${input} py-1.5`}>
          {Object.entries(KIND_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className={primary}>
          <Plus size={16} /> Agregar
        </button>
      </form>
      {error && <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</p>}
    </div>
  );
}

function RulesEditor({ categories, byId }: { categories: Category[]; byId: (id: number | null) => Category | undefined }) {
  const [rules, setRules] = useState<RuleInfo[]>([]);
  const [version, setVersion] = useState(0);
  const [pattern, setPattern] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [status, setStatus] = useState<{ message?: string; error?: string }>({});

  useEffect(() => {
    api<RuleInfo[]>('/api/rules').then(setRules);
  }, [version, categories]); // al borrar una categoría también se borran sus reglas

  async function run(action: () => Promise<string | void>) {
    setStatus({});
    try {
      const message = await action();
      setStatus({ message: message ?? undefined });
    } catch (e) {
      setStatus({ error: errorText(e) });
    } finally {
      setVersion((v) => v + 1);
    }
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      await api('/api/rules', { method: 'POST', body: { pattern, categoryId } });
      setPattern('');
    });
  }

  const sorted = [...rules].sort((a, b) => a.pattern.localeCompare(b.pattern));

  return (
    <div className={card}>
      <div>
        <h2 className="text-lg font-semibold text-ink">Reglas</h2>
        <p className="text-sm text-ink-muted">
          Si la descripción contiene el texto, el movimiento toma esa categoría al importar. Si calzan varias, gana el texto más largo.
        </p>
      </div>
      <button
        onClick={() =>
          run(async () => {
            const { categorized } = await api<{ categorized: number }>('/api/rules/apply', { method: 'POST' });
            return `Se categorizaron ${categorized} movimientos.`;
          })
        }
        className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-line text-sm text-ink hover:bg-card-hover"
      >
        <Wand2 size={16} className="text-accent" /> Aplicar reglas a los movimientos sin categoría
      </button>
      <ul className="divide-y divide-line-soft">
        {sorted.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2 text-sm">
            <code className="flex-1 min-w-0 truncate text-ink">{r.pattern}</code>
            <CategoryChip category={byId(r.categoryId)} />
            <button
              aria-label={`Borrar regla ${r.pattern}`}
              onClick={() => run(() => api(`/api/rules/${r.id}`, { method: 'DELETE' }).then(() => undefined))}
              className="p-1.5 text-ink-faint hover:text-ink-muted"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="flex flex-wrap items-center gap-2 pt-2 border-t border-line-soft">
        <input
          required
          placeholder="Texto, ej. uber eats"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          className={`${input} flex-1 min-w-40 py-1.5`}
        />
        <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} emptyLabel="Categoría…" className={`${input} py-1.5`} />
        <button type="submit" disabled={categoryId == null} className={primary}>
          <Plus size={16} /> Agregar
        </button>
      </form>
      {status.message && <p className="text-sm text-positive">{status.message}</p>}
      {status.error && <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{status.error}</p>}
    </div>
  );
}

const SOURCE_LABEL: Record<SyncStatus['source'], string> = {
  codeforces: 'Codeforces',
  monkeytype: 'Monkeytype',
  trakt: 'Trakt',
  wordle: 'Wordle',
  cube: 'csTimer',
};

const when = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'medium', timeStyle: 'short' });

/** Estado de lo que se sincroniza solo para /hobbies (cada 2 horas) y un botón para hacerlo ahora. */
function HobbySync() {
  const [statuses, setStatuses] = useState<SyncStatus[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    api<SyncStatus[]>('/api/hobbies/sync').then(setStatuses, (e) => setError(errorText(e)));
  }, []);

  async function syncNow() {
    setSyncing(true);
    setError(undefined);
    try {
      setStatuses(await api<SyncStatus[]>('/api/hobbies/sync', { method: 'POST' }));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className={card}>
      <div>
        <h2 className="text-lg font-semibold text-ink">Hobbies</h2>
        <p className="text-sm text-ink-muted">
          Lo que sale en <a href="/hobbies" className="underline decoration-mark hover:text-accent">/hobbies</a> se trae
          solo cada 2 horas.
        </p>
      </div>
      <ul className="divide-y divide-line-soft">
        {statuses.map((s) => (
          <li key={s.source} className="py-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="font-medium text-ink">{SOURCE_LABEL[s.source]}</span>
            <span className={`text-sm ${s.lastError ? 'text-danger' : 'text-ink-muted'}`}>
              {s.lastError
                ? `Error: ${s.lastError}`
                : s.lastSync
                  ? `Al día · ${when(s.lastSync)}`
                  : 'Todavía no se sincroniza'}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={syncNow} disabled={syncing} className={primary}>
          <RefreshCw size={16} className={syncing ? 'motion-safe:animate-spin' : ''} />
          {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
        </button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}


const FRAME_SPEEDS = [150, 250, 400, 500, 800, 1200, 2000, 3000];

const seconds = (ms: number) => `${(ms / 1000).toLocaleString('es-CL')} s`;

/** Imágenes propias para cada emoción de los gatitos; con varias se turnan como una animación. */
function CatsEditor() {
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
