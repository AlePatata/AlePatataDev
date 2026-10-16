import { Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Category } from '../../shared/summary';
import { suggestPattern } from '../../shared/text';
import type { AccountFilter, Transaction, TransactionInput, TransactionsResponse } from '../../shared/transactions';
import { api } from '../api';
import { CategoryChip, CategorySelect } from '../categories';
import { formatCLP, formatDate } from '../format';
import { MonthPicker } from '../MonthPicker';
import { currentMonth, today } from '../months';
import { PageTitle } from '../PageTitle';
import { useCategories } from '../useCategories';

const ACCOUNT_SHORT: Record<string, string> = {
  cuenta_vista: 'Cuenta',
  cuenta_corriente: 'Cuenta corriente',
  tarjeta_credito: 'Tarjeta',
  manual: 'Manual',
};

const selectClass = 'bg-white rounded-full border border-pink-100 px-4 py-2 text-rose-900';

/** Recién categoricé un movimiento a mano: ¿crear una regla para los parecidos? */
interface PendingRule {
  description: string;
  categoryId: number;
}

export function ExpensesPage() {
  // El dashboard abre esta página con ?month=…&category=…
  const [searchParams] = useSearchParams();
  const [month, setMonth] = useState(() => searchParams.get('month') ?? currentMonth());
  const [category, setCategory] = useState(() => searchParams.get('category') ?? '');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [account, setAccount] = useState<AccountFilter | ''>('');
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: TransactionsResponse; error?: string } | null>(null);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [pendingRule, setPendingRule] = useState<PendingRule | null>(null);
  const { categories, byId } = useCategories();

  // Espera a que deje de escribir antes de buscar
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const params = new URLSearchParams({
    month,
    ...(q ? { q } : {}),
    ...(account ? { account } : {}),
    ...(category ? { category } : {}),
  });
  const key = `${params}#${reload}`;

  useEffect(() => {
    let cancelled = false;
    api<TransactionsResponse>(`/api/transactions?${params}`)
      .then((data) => !cancelled && setResult({ key, data }))
      .catch((e: Error) => !cancelled && setResult({ key, error: e.message }));
    return () => {
      cancelled = true;
    };
    // `params` se deriva de `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loading = result?.key !== key;
  const data = result?.data;
  const refresh = () => setReload((n) => n + 1);
  const done = (categorized?: PendingRule) => {
    setEditing(null);
    if (categorized) setPendingRule(categorized);
    refresh();
  };
  // Con el filtro "Sin categoría", cada fila trae el selector a la vista para categorizar rápido
  const quickMode = category === 'none';

  async function quickCategorize(t: Transaction, categoryId: number | null) {
    await api(`/api/transactions/${t.id}`, { method: 'PATCH', body: { categoryId } });
    done(categoryId == null ? undefined : { description: t.description, categoryId });
  }

  return (
    <section className="max-w-5xl">
      <PageTitle>Gastos</PageTitle>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <MonthPicker month={month} onChange={setMonth} />
        <label className="flex flex-1 min-w-48 items-center gap-2 bg-white rounded-full border border-pink-100 px-4 py-2">
          <Search size={16} className="text-pink-400" />
          <input
            type="search"
            placeholder="Buscar descripción"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-rose-900 placeholder:text-rose-300 focus:outline-none"
          />
        </label>
        <select aria-label="Cuenta" value={account} onChange={(e) => setAccount(e.target.value as AccountFilter | '')} className={selectClass}>
          <option value="">Todas las cuentas</option>
          <option value="cuenta_vista">Cuenta vista</option>
          <option value="tarjeta_credito">Tarjeta de crédito</option>
          <option value="manual">Manuales</option>
        </select>
        <select aria-label="Filtrar por categoría" value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
          <option value="">Todas las categorías</option>
          <option value="none">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-3 mb-2">
          <Total label="Cargos" amount={data.totals.spent} />
          <Total label="Abonos" amount={data.totals.received} />
          <Total label="Neto" amount={data.totals.net} />
        </div>
      )}
      {data && data.totals.internalCount > 0 && (
        <p className="text-xs text-rose-700 mb-6">
          Sin contar {data.totals.internalCount} movimientos internos (pagos de tarjeta y traspasos entre tus cuentas).
        </p>
      )}

      {pendingRule && (
        <RuleSuggestion
          pending={pendingRule}
          category={byId(pendingRule.categoryId)}
          onClose={() => setPendingRule(null)}
          onApplied={refresh}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p className="text-sm text-rose-700">
          {quickMode
            ? 'Elige la categoría de cada movimiento; después puedes crear una regla para los parecidos.'
            : category === '' && (
                <button onClick={() => setCategory('none')} className="underline decoration-pink-300 hover:text-pink-500">
                  Ver solo los sin categoría
                </button>
              )}
        </p>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full text-sm font-medium hover:bg-pink-600 transition-colors"
        >
          <Plus size={16} /> Agregar movimiento
        </button>
      </div>

      {editing === 'new' && (
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-4 mb-4">
          <TransactionForm categories={categories} onDone={done} onCancel={() => setEditing(null)} />
        </div>
      )}

      {result?.error && <p className="text-sm text-rose-700 bg-rose-100 rounded-lg px-4 py-3">{result.error}</p>}

      <ul className={`bg-white rounded-2xl border border-pink-100 shadow-sm divide-y divide-pink-50 ${loading ? 'opacity-60' : ''}`}>
        {data?.transactions.length === 0 && (
          <li className="px-4 py-8 text-center text-rose-700">
            {quickMode
              ? 'No quedan movimientos sin categoría este mes.'
              : q || category || account
                ? 'No hay movimientos con estos filtros.'
                : 'No hay movimientos este mes. Importa una cartola para empezar.'}
          </li>
        )}
        {data?.transactions.map((t) =>
          editing === t.id ? (
            <li key={t.id} className="p-4 bg-rose-50/50">
              <TransactionForm transaction={t} categories={categories} onDone={done} onCancel={() => setEditing(null)} />
            </li>
          ) : (
            <li key={t.id} className={`flex flex-col md:flex-row md:items-center hover:bg-rose-50/60 ${t.internal ? 'opacity-60' : ''}`}>
              <button
                onClick={() => setEditing(t.id)}
                className="md:flex-1 min-w-0 grid grid-cols-[1fr_auto] md:grid-cols-[6.5rem_1fr_auto_8rem] items-center gap-x-3 gap-y-1 px-4 py-3 text-left"
              >
                <span className="text-xs md:text-sm text-rose-700">{formatDate(t.date)}</span>
                <span className="row-start-2 md:row-start-1 md:col-start-2 text-rose-900 min-w-0 truncate">{t.description}</span>
                <span className="row-start-3 md:row-start-1 md:col-start-3 flex flex-wrap gap-2 text-xs">
                  {!t.internal && !quickMode && <CategoryChip category={byId(t.categoryId)} />}
                  <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-600">{ACCOUNT_SHORT[t.account ?? t.source]}</span>
                  {t.installment && <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">Cuota {t.installment}</span>}
                  {t.internal && <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Interno</span>}
                </span>
                <span
                  className={`row-start-1 col-start-2 md:col-start-4 justify-self-end font-medium tabular-nums ${t.amount < 0 ? 'text-rose-900' : 'text-emerald-600'}`}
                >
                  {formatCLP(t.amount)}
                </span>
              </button>
              {quickMode && !t.internal && (
                <CategorySelect
                  categories={categories}
                  value={null}
                  emptyLabel="Elegir…"
                  onChange={(id) => quickCategorize(t, id)}
                  className="mx-4 mb-3 md:m-0 md:mr-3 md:w-44 shrink-0 bg-white rounded-lg border border-amber-300 px-2 py-1.5 text-sm text-rose-900"
                />
              )}
            </li>
          ),
        )}
      </ul>
    </section>
  );
}

function Total({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="bg-white rounded-2xl border border-pink-100 shadow-sm px-3 sm:px-4 py-3 min-w-0">
      <p className="text-xs text-rose-700">{label}</p>
      <p className={`text-sm sm:text-base md:text-xl font-semibold tabular-nums whitespace-nowrap ${amount < 0 ? 'text-rose-900' : 'text-emerald-600'}`}>
        {formatCLP(amount)}
      </p>
    </div>
  );
}

/** Ofrece crear una regla con el patrón sugerido (editable) y, si quiero, aplicarla a los sin categoría. */
function RuleSuggestion({
  pending,
  category,
  onClose,
  onApplied,
}: {
  pending: PendingRule;
  category?: Category;
  onClose: () => void;
  onApplied: () => void;
}) {
  const [pattern, setPattern] = useState(() => suggestPattern(pending.description));
  const [status, setStatus] = useState<{ saving?: boolean; message?: string; error?: string }>({});

  async function create(apply: boolean) {
    setStatus({ saving: true });
    try {
      await api('/api/rules', { method: 'POST', body: { pattern, categoryId: pending.categoryId } });
      if (!apply) return setStatus({ message: 'Regla creada. Se usará en las próximas importaciones.' });
      const { categorized } = await api<{ categorized: number }>('/api/rules/apply', { method: 'POST' });
      setStatus({ message: `Regla creada. Se categorizaron ${categorized} movimientos más.` });
      onApplied();
    } catch (e) {
      setStatus({ error: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-pink-200 shadow-sm p-4 mb-4 space-y-3 text-sm">
      <p className="flex items-start gap-2 text-rose-900">
        <Sparkles size={18} className="text-pink-500 shrink-0 mt-0.5" />
        <span>
          Categorizaste «{pending.description}» como <strong>{category?.name ?? '…'}</strong>. ¿Crear una regla para que los
          movimientos que contengan este texto se categoricen solos?
        </span>
      </p>
      {status.message ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-emerald-700">{status.message}</p>
          <button onClick={onClose} className="px-4 py-1.5 rounded-full border border-pink-200 text-rose-900 hover:bg-pink-50">
            Cerrar
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Patrón de la regla"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="flex-1 min-w-48 bg-white rounded-lg border border-pink-200 px-3 py-1.5 text-rose-900 focus:border-pink-400 focus:outline-none"
          />
          <button
            onClick={() => create(true)}
            disabled={status.saving || !pattern.trim()}
            className="px-4 py-1.5 rounded-full bg-pink-500 text-white font-medium hover:bg-pink-600 disabled:opacity-50"
          >
            Crear y aplicar
          </button>
          <button
            onClick={() => create(false)}
            disabled={status.saving || !pattern.trim()}
            className="px-4 py-1.5 rounded-full border border-pink-200 text-rose-900 hover:bg-pink-50 disabled:opacity-50"
          >
            Solo crear
          </button>
          <button onClick={onClose} className="px-3 py-1.5 text-rose-700 hover:text-rose-900">
            No
          </button>
        </div>
      )}
      {status.error && <p className="text-rose-700 bg-rose-100 rounded-lg px-3 py-2">{status.error}</p>}
    </div>
  );
}

const inputClass =
  'w-full bg-white rounded-lg border border-pink-200 px-3 py-2 text-rose-900 focus:border-pink-400 focus:outline-none';

/** Crear (sin `transaction`) o editar un movimiento. */
function TransactionForm({
  transaction,
  categories,
  onDone,
  onCancel,
}: {
  transaction?: Transaction;
  categories: Category[];
  onDone: (categorized?: PendingRule) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(transaction?.date ?? today());
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [amount, setAmount] = useState(transaction ? String(Math.abs(transaction.amount)) : '');
  const [kind, setKind] = useState<'gasto' | 'abono'>(transaction && transaction.amount > 0 ? 'abono' : 'gasto');
  const [categoryId, setCategoryId] = useState<number | null>(transaction?.categoryId ?? null);
  const [internal, setInternal] = useState(transaction?.internal ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function run(action: () => Promise<unknown>, categorized?: PendingRule) {
    setSaving(true);
    setError(undefined);
    try {
      await action();
      onDone(categorized);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount.replace(/\D/g, ''));
    const body: TransactionInput = {
      date,
      description,
      amount: kind === 'gasto' ? -value : value,
      internal,
      categoryId: internal ? null : categoryId,
    };
    // Solo vale la pena ofrecer una regla si cambié a mano la categoría de un movimiento importado
    const recategorized =
      transaction?.source === 'import' && !internal && categoryId != null && categoryId !== transaction.categoryId
        ? { description: transaction.description, categoryId }
        : undefined;
    return run(
      () =>
        transaction
          ? api(`/api/transactions/${transaction.id}`, { method: 'PATCH', body })
          : api('/api/transactions', { method: 'POST', body }),
      recategorized,
    );
  }

  function remove() {
    if (!transaction || !confirm(`¿Borrar "${transaction.description}"?`)) return;
    return run(() => api(`/api/transactions/${transaction.id}`, { method: 'DELETE' }));
  }

  return (
    <form onSubmit={save} className="grid gap-3 md:grid-cols-[10rem_1fr_9rem_9rem]">
      <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} aria-label="Fecha" />
      <input
        required
        placeholder="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={inputClass}
        aria-label="Descripción"
      />
      <select value={kind} onChange={(e) => setKind(e.target.value as 'gasto' | 'abono')} className={inputClass} aria-label="Tipo">
        <option value="gasto">Gasto</option>
        <option value="abono">Abono</option>
      </select>
      <input
        required
        inputMode="numeric"
        placeholder="Monto"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className={inputClass}
        aria-label="Monto en pesos"
      />
      <CategorySelect categories={categories} value={internal ? null : categoryId} onChange={setCategoryId} className={`${inputClass} md:col-span-2`} />
      <label className="flex items-center gap-2 text-sm text-rose-800 md:col-span-2">
        <input type="checkbox" className="accent-pink-500 size-4" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
        Interno (no cuenta en los totales)
      </label>
      <div className="flex flex-wrap gap-2 md:col-span-4 md:justify-end">
        {transaction && (
          <button type="button" onClick={remove} disabled={saving} className="mr-auto flex items-center gap-1 px-3 py-2 text-sm text-rose-700 hover:text-rose-900">
            <Trash2 size={16} /> Borrar
          </button>
        )}
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm bg-white text-rose-900 border border-pink-200 rounded-full hover:bg-pink-50">
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 disabled:opacity-50">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
      {error && <p className="md:col-span-4 text-sm text-rose-700 bg-rose-100 rounded-lg px-3 py-2">{error}</p>}
    </form>
  );
}
