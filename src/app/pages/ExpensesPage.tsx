import { ChevronLeft, ChevronRight, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AccountFilter, Transaction, TransactionInput, TransactionsResponse } from '../../shared/transactions';
import { api } from '../api';
import { formatCLP, formatDate } from '../format';
import { PageTitle } from '../PageTitle';

const ACCOUNT_SHORT: Record<string, string> = {
  cuenta_vista: 'Cuenta',
  cuenta_corriente: 'Cuenta corriente',
  tarjeta_credito: 'Tarjeta',
  manual: 'Manual',
};

const today = () => new Date().toLocaleDateString('sv-SE'); // aaaa-mm-dd en hora local
const currentMonth = () => today().slice(0, 7);

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** '2026-10' → 'Octubre de 2026' */
function monthLabel(month: string) {
  const label = new Date(`${month}-01T12:00:00`).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function ExpensesPage() {
  const [month, setMonth] = useState(currentMonth);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [account, setAccount] = useState<AccountFilter | ''>('');
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: TransactionsResponse; error?: string } | null>(null);
  const [editing, setEditing] = useState<number | 'new' | null>(null);

  // Espera a que deje de escribir antes de buscar
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const params = new URLSearchParams({ month, ...(q ? { q } : {}), ...(account ? { account } : {}) });
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
  const done = () => {
    setEditing(null);
    setReload((n) => n + 1);
  };

  return (
    <section className="max-w-5xl">
      <PageTitle>Gastos</PageTitle>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1 bg-white rounded-full border border-pink-100 px-1">
          <button aria-label="Mes anterior" onClick={() => setMonth(shiftMonth(month, -1))} className="p-2 text-rose-700 hover:text-pink-500">
            <ChevronLeft size={18} />
          </button>
          <span className="w-36 text-center text-rose-900 font-medium">{monthLabel(month)}</span>
          <button aria-label="Mes siguiente" onClick={() => setMonth(shiftMonth(month, 1))} className="p-2 text-rose-700 hover:text-pink-500">
            <ChevronRight size={18} />
          </button>
        </div>
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
        <select
          aria-label="Cuenta"
          value={account}
          onChange={(e) => setAccount(e.target.value as AccountFilter | '')}
          className="bg-white rounded-full border border-pink-100 px-4 py-2 text-rose-900"
        >
          <option value="">Todas las cuentas</option>
          <option value="cuenta_vista">Cuenta vista</option>
          <option value="tarjeta_credito">Tarjeta de crédito</option>
          <option value="manual">Manuales</option>
        </select>
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-3 mb-2">
          <Total label="Gastado" amount={data.totals.spent} />
          <Total label="Abonos" amount={data.totals.received} />
          <Total label="Neto" amount={data.totals.net} />
        </div>
      )}
      {data && data.totals.internalCount > 0 && (
        <p className="text-xs text-rose-700 mb-6">
          Sin contar {data.totals.internalCount} movimientos internos (pagos de tarjeta y traspasos entre tus cuentas).
        </p>
      )}

      <div className="flex justify-end mb-3">
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full text-sm font-medium hover:bg-pink-600 transition-colors"
        >
          <Plus size={16} /> Agregar movimiento
        </button>
      </div>

      {editing === 'new' && (
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-4 mb-4">
          <TransactionForm onDone={done} onCancel={() => setEditing(null)} />
        </div>
      )}

      {result?.error && <p className="text-sm text-rose-700 bg-rose-100 rounded-lg px-4 py-3">{result.error}</p>}

      <ul className={`bg-white rounded-2xl border border-pink-100 shadow-sm divide-y divide-pink-50 ${loading ? 'opacity-60' : ''}`}>
        {data?.transactions.length === 0 && (
          <li className="px-4 py-8 text-center text-rose-700">
            {q ? 'No hay movimientos que calcen con la búsqueda.' : 'No hay movimientos este mes. Importa una cartola para empezar.'}
          </li>
        )}
        {data?.transactions.map((t) =>
          editing === t.id ? (
            <li key={t.id} className="p-4 bg-rose-50/50">
              <TransactionForm transaction={t} onDone={done} onCancel={() => setEditing(null)} />
            </li>
          ) : (
            <li key={t.id}>
              <button
                onClick={() => setEditing(t.id)}
                className={`w-full grid grid-cols-[1fr_auto] md:grid-cols-[6.5rem_1fr_auto_8rem] items-center gap-x-3 gap-y-1 px-4 py-3 text-left hover:bg-rose-50/60 ${t.internal ? 'opacity-60' : ''}`}
              >
                <span className="text-xs md:text-sm text-rose-700">{formatDate(t.date)}</span>
                <span className="row-start-2 md:row-start-1 md:col-start-2 text-rose-900 min-w-0 truncate">{t.description}</span>
                <span className="row-start-3 md:row-start-1 md:col-start-3 flex gap-2 text-xs">
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

const inputClass =
  'w-full bg-white rounded-lg border border-pink-200 px-3 py-2 text-rose-900 focus:border-pink-400 focus:outline-none';

/** Crear (sin `transaction`) o editar un movimiento. */
function TransactionForm({ transaction, onDone, onCancel }: { transaction?: Transaction; onDone: () => void; onCancel: () => void }) {
  const [date, setDate] = useState(transaction?.date ?? today());
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [amount, setAmount] = useState(transaction ? String(Math.abs(transaction.amount)) : '');
  const [kind, setKind] = useState<'gasto' | 'abono'>(transaction && transaction.amount > 0 ? 'abono' : 'gasto');
  const [internal, setInternal] = useState(transaction?.internal ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function run(action: () => Promise<unknown>) {
    setSaving(true);
    setError(undefined);
    try {
      await action();
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount.replace(/\D/g, ''));
    const body: TransactionInput = { date, description, amount: kind === 'gasto' ? -value : value, internal };
    return run(() =>
      transaction
        ? api(`/api/transactions/${transaction.id}`, { method: 'PATCH', body })
        : api('/api/transactions', { method: 'POST', body }),
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
      <label className="flex items-center gap-2 text-sm text-rose-800 md:col-span-2">
        <input type="checkbox" className="accent-pink-500 size-4" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
        Interno (no cuenta en los totales)
      </label>
      <div className="flex flex-wrap gap-2 md:col-span-2 md:justify-end">
        {transaction && (
          <button type="button" onClick={remove} disabled={saving} className="mr-auto md:mr-0 flex items-center gap-1 px-3 py-2 text-sm text-rose-700 hover:text-rose-900">
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
