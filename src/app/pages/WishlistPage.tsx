import { ArrowDown, ArrowUp, Check, ExternalLink, Gift, Link2, Pencil, Plus, RotateCcw, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ItemInput, ProductMeta, WishlistItem, WishlistResponse } from '../../shared/wishlist';
import { feel } from '../../cats/catBus';
import { api } from '../api';
import { formatCLP } from '../format';
import { PageTitle } from '../PageTitle';

const card = 'bg-card rounded-2xl border border-line-soft shadow-sm';
const input = 'w-full bg-card rounded-lg border border-line px-3 py-2 text-ink placeholder:text-ink-faint focus:border-mark focus:outline-none';
const iconButton = 'p-2 rounded-full text-ink-faint hover:text-ink-muted hover:bg-card-hover disabled:opacity-30 disabled:hover:bg-transparent';

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function WishlistPage() {
  const [data, setData] = useState<WishlistResponse>();
  const [error, setError] = useState<string>();
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  // Lo último marcado como comprado y el orden que tenía la lista, para avisar y poder deshacer
  const [justBought, setJustBought] = useState<{ item: WishlistItem; order: number[] }>();

  useEffect(() => {
    api<WishlistResponse>('/api/wishlist')
      .then(setData)
      .catch((e) => setError(errorText(e)));
  }, [version]);

  const reload = () => setVersion((v) => v + 1);
  const done = () => {
    setEditing(null);
    reload();
  };

  async function run(action: () => Promise<unknown>) {
    setError(undefined);
    setJustBought(undefined);
    try {
      await action();
    } catch (e) {
      setError(errorText(e));
    }
    reload();
  }

  const pending = data?.items.filter((i) => i.status === 'pending') ?? [];
  const bought = data?.items.filter((i) => i.status === 'bought') ?? [];
  const total = pending.reduce((sum, i) => sum + i.price, 0);
  const author = (i: WishlistItem) => data?.names[i.createdBy] ?? (i.createdBy === 'owner' ? 'Ale' : 'tu pololo');

  const setStatus = (item: WishlistItem, status: WishlistItem['status']) =>
    run(() => api(`/api/wishlist/${item.id}`, { method: 'PATCH', body: { status } }));

  const markBought = (item: WishlistItem) => {
    const order = pending.map((i) => i.id);
    return run(async () => {
      await api(`/api/wishlist/${item.id}`, { method: 'PATCH', body: { status: 'bought' } });
      setJustBought({ item, order });
      feel('endeudado', { message: `¡Compraste "${item.name}"! …y la billetera llora`, cooldownMs: 0 });
    });
  };

  // Vuelve a pendiente en el lugar que tenía (al pasar a pendiente queda al final)
  const undoBought = ({ item, order }: { item: WishlistItem; order: number[] }) =>
    run(async () => {
      await api(`/api/wishlist/${item.id}`, { method: 'PATCH', body: { status: 'pending' } });
      const { items } = await api<WishlistResponse>('/api/wishlist');
      const now = items.filter((i) => i.status === 'pending').map((i) => i.id);
      const ids = [...order.filter((id) => now.includes(id)), ...now.filter((id) => !order.includes(id))];
      await api('/api/wishlist/reorder', { method: 'POST', body: { ids } });
    });

  function move(index: number, delta: number) {
    const ids = pending.map((i) => i.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    // Se muestra el orden nuevo de inmediato, mientras se guarda
    setData((d) => d && { ...d, items: [...ids.map((id) => d.items.find((i) => i.id === id)!), ...bought] });
    run(() => api('/api/wishlist/reorder', { method: 'POST', body: { ids } }));
  }

  return (
    <section className="max-w-3xl">
      <PageTitle>Wishlist</PageTitle>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {data && (
          <p className="text-ink-soft">
            {pending.length === 0 ? 'Nada pendiente todavía.' : `${pending.length} pendientes · ${formatCLP(total)} en total`}
          </p>
        )}
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-on-accent rounded-full text-sm font-medium hover:bg-accent-hover"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {error && <p className="text-sm text-danger bg-danger-soft rounded-lg px-4 py-3 mb-4">{error}</p>}

      {justBought && (
        <p role="status" className={`${card} flex items-center gap-2 px-4 py-2 mb-4 text-sm text-ink`}>
          <Check size={16} className="text-positive shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="font-medium">{justBought.item.name}</span> pasó a Comprados.
          </span>
          <button onClick={() => undoBought(justBought)} className="px-3 py-1.5 rounded-full text-accent font-medium hover:bg-card-hover">
            Deshacer
          </button>
        </p>
      )}

      {editing === 'new' && (
        <div className={`${card} p-4 mb-4`}>
          <ItemForm onDone={done} onCancel={() => setEditing(null)} />
        </div>
      )}

      <ul className="space-y-3">
        {pending.map((item, index) =>
          editing === item.id ? (
            <li key={item.id} className={`${card} p-4`}>
              <ItemForm item={item} onDone={done} onCancel={() => setEditing(null)} />
            </li>
          ) : (
            <li key={item.id} className={`${card} p-3 flex gap-3`}>
              <Thumb src={item.imageUrl} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-ink break-words">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                        {item.name} <ExternalLink size={14} className="inline -mt-0.5 text-accent" />
                      </a>
                    ) : (
                      item.name
                    )}
                  </h3>
                  <span className="font-semibold text-ink whitespace-nowrap">{formatCLP(item.price)}</span>
                </div>
                {item.note && <p className="text-sm text-ink-muted mt-0.5 break-words">{item.note}</p>}
                <p className="text-xs text-ink-muted mt-1">Agregado por {author(item)}</p>
                <div className="flex flex-wrap items-center gap-0.5 mt-1 -ml-2">
                  <button aria-label="Subir" disabled={index === 0} onClick={() => move(index, -1)} className={iconButton}>
                    <ArrowUp size={18} />
                  </button>
                  <button aria-label="Bajar" disabled={index === pending.length - 1} onClick={() => move(index, 1)} className={iconButton}>
                    <ArrowDown size={18} />
                  </button>
                  <button aria-label="Editar" onClick={() => setEditing(item.id)} className={iconButton}>
                    <Pencil size={18} />
                  </button>
                  <button
                    aria-label="Borrar"
                    onClick={() => confirm(`¿Borrar "${item.name}"?`) && run(async () => {
                        await api(`/api/wishlist/${item.id}`, { method: 'DELETE' });
                        feel('triste', { message: `Adiós, "${item.name}". Te quería…`, cooldownMs: 0 });
                      })
                    }
                    className={iconButton}
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={() => markBought(item)}
                    className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-full border border-line text-sm text-ink-soft whitespace-nowrap hover:text-ink hover:bg-card-hover"
                  >
                    <ShoppingBag size={16} className="shrink-0" /> Marcar comprado
                  </button>
                </div>
              </div>
            </li>
          ),
        )}
      </ul>

      {data && pending.length === 0 && editing !== 'new' && (
        <div className={`${card} p-8 text-center text-ink-muted`}>
          <Gift className="mx-auto mb-2 text-accent" size={32} />
          Agreguen lo que quieren comprar: pega el link de la tienda y se completa solo.
        </div>
      )}

      {bought.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-ink-muted hover:text-accent">Comprados ({bought.length})</summary>
          <ul className={`${card} mt-3 divide-y divide-line-soft`}>
            {bought.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="flex-1 min-w-0 truncate text-ink">{item.name}</span>
                <span className="text-ink-muted whitespace-nowrap">{formatCLP(item.price)}</span>
                {item.boughtAt && <span className="hidden sm:inline text-xs text-ink-muted">{item.boughtAt.slice(0, 10).split('-').reverse().join('/')}</span>}
                <button
                  aria-label="Volver a pendiente"
                  title="Volver a pendiente"
                  onClick={() => setStatus(item, 'pending')}
                  className={iconButton}
                >
                  <RotateCcw size={16} />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

/** Imagen de la tienda; si no carga (o no hay), un ícono. */
function Thumb({ src }: { src: string | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  const show = src && failed !== src;
  return (
    <div className="size-20 sm:size-24 shrink-0 rounded-xl bg-soft overflow-hidden flex items-center justify-center">
      {show ? (
        <img src={src} alt="" referrerPolicy="no-referrer" loading="lazy" onError={() => setFailed(src)} className="size-full object-cover" />
      ) : (
        <Gift className="text-ink-faint" size={28} />
      )}
    </div>
  );
}

/** "49.990" → 49990 */
const parseCLP = (s: string) => Number(s.replace(/\D/g, '') || NaN);

function ItemForm({ item, onDone, onCancel }: { item?: WishlistItem; onDone: () => void; onCancel: () => void }) {
  const [url, setUrl] = useState(item?.url ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(item ? item.price.toLocaleString('es-CL') : '');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? '');
  const [note, setNote] = useState(item?.note ?? '');
  const [reading, setReading] = useState<'idle' | 'reading' | 'done' | 'empty'>('idle');
  const [lastRead, setLastRead] = useState(item?.url ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  /** Completa lo que esté vacío con lo que se pueda leer de la página. */
  async function readLink(value = url) {
    const link = value.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(link) || link === lastRead) return;
    setLastRead(link);
    setReading('reading');
    try {
      const meta = await api<ProductMeta>('/api/wishlist/preview', { method: 'POST', body: { url: link } });
      if (meta.title) setName((n) => n || meta.title!);
      if (meta.price != null) setPrice((p) => p || meta.price!.toLocaleString('es-CL'));
      if (meta.imageUrl) setImageUrl((i) => i || meta.imageUrl!);
      setReading(meta.title || meta.imageUrl || meta.price != null ? 'done' : 'empty');
    } catch {
      setReading('empty');
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const value = parseCLP(price);
    if (!Number.isSafeInteger(value)) return setError('Escribe el precio en pesos');
    const body: ItemInput = { name, price: value, url: url.trim() || null, imageUrl: imageUrl.trim() || null, note: note.trim() || null };
    setSaving(true);
    setError(undefined);
    try {
      await (item ? api(`/api/wishlist/${item.id}`, { method: 'PATCH', body }) : api('/api/wishlist', { method: 'POST', body }));
      if (!item) feel('enamorado', { cooldownMs: 0 });
      onDone();
    } catch (err) {
      setError(errorText(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <label className="block space-y-1">
        <span className="text-sm text-ink-soft">Link de la tienda (opcional)</span>
        <div className="flex gap-2">
          <input
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={(e) => readLink(e.clipboardData.getData('text'))}
            onBlur={() => readLink()}
            className={input}
          />
          <button type="button" onClick={() => readLink()} aria-label="Leer link" className="px-3 rounded-lg border border-line text-accent hover:bg-card-hover">
            <Link2 size={18} />
          </button>
        </div>
        <span className="block text-xs text-ink-muted">
          {reading === 'reading' && 'Leyendo la página…'}
          {reading === 'done' && 'Listo: revisa lo que se completó.'}
          {reading === 'empty' && 'Esta tienda no entregó datos; complétalos a mano.'}
          {reading === 'idle' && 'Al pegarlo se completan el nombre, la imagen y el precio, si la tienda los publica.'}
        </span>
      </label>

      <div className="flex gap-3">
        <Thumb src={imageUrl.trim() || null} />
        <div className="flex-1 space-y-3">
          <input required placeholder="Nombre" aria-label="Nombre" value={name} onChange={(e) => setName(e.target.value)} className={input} />
          <input required inputMode="numeric" placeholder="Precio" aria-label="Precio en pesos" value={price} onChange={(e) => setPrice(e.target.value)} className={input} />
        </div>
      </div>

      <input placeholder="Link de la imagen (opcional)" aria-label="Link de la imagen" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={input} />
      <textarea placeholder="Nota (opcional): talla, color, para qué…" aria-label="Nota" value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={input} />

      {error && <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm bg-card text-ink border border-line rounded-full hover:bg-card-hover">
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-accent text-on-accent rounded-full font-medium hover:bg-accent-hover disabled:opacity-50">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
