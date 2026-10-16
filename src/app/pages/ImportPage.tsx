import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react';
import { useState } from 'react';
import type { ImportRequest, ImportResponse, RowStatus } from '../../shared/import';
import { api } from '../api';
import { ACCOUNT_LABEL, formatCLP, formatDate } from '../format';
import { CartolaError, parseCartola, type Cell, type ParsedCartola } from '../import/parseCartola';
import { PageTitle } from '../PageTitle';

interface Row {
  date: string;
  originalDescription: string;
  description: string;
  amount: number;
  installment?: string;
  internal: boolean;
  include: boolean;
  status: RowStatus;
}

type State =
  | { step: 'pick'; error?: string }
  | { step: 'loading' }
  | { step: 'preview'; filename: string; cartola: ParsedCartola; rows: Row[]; saving?: boolean; error?: string }
  | { step: 'done'; inserted: number; skipped: number };

const STATUS: Record<RowStatus, { label: string; className: string }> = {
  new: { label: 'Nueva', className: 'bg-pink-100 text-pink-600' },
  duplicate: { label: 'Ya importada', className: 'bg-gray-100 text-gray-500' },
  possible: { label: 'Posible duplicado', className: 'bg-amber-100 text-amber-700' },
};

/** Lee el Excel en el navegador: el archivo nunca se sube, solo los movimientos confirmados. */
async function readSheet(file: File): Promise<Cell[][]> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, raw: true, defval: null });
}

function buildRequest(filename: string, cartola: ParsedCartola, rows: Row[], dryRun: boolean): ImportRequest {
  return {
    dryRun,
    statement: {
      filename,
      accountType: cartola.accountType,
      periodStart: cartola.periodStart,
      periodEnd: cartola.periodEnd,
      closingBalance: cartola.closingBalance,
    },
    transactions: rows.map(({ date, originalDescription, description, amount, installment, internal, include }) => ({
      date,
      originalDescription,
      description: description.trim() || originalDescription,
      amount,
      ...(installment ? { installment } : {}),
      internal,
      include,
    })),
  };
}

export function ImportPage() {
  const [state, setState] = useState<State>({ step: 'pick' });

  async function onFile(file: File) {
    setState({ step: 'loading' });
    try {
      const cartola = parseCartola(await readSheet(file));
      if (cartola.transactions.length === 0) throw new CartolaError('La cartola no tiene movimientos.');
      const rows: Row[] = cartola.transactions.map((t) => ({
        ...t,
        originalDescription: t.description,
        include: true,
        status: 'new',
      }));
      const { statuses } = await api<ImportResponse>('/api/statements/commit', {
        method: 'POST',
        body: buildRequest(file.name, cartola, rows, true),
      });
      // Solo las nuevas vienen marcadas; los posibles duplicados los decido yo
      rows.forEach((r, i) => {
        r.status = statuses[i];
        r.include = statuses[i] === 'new';
      });
      setState({ step: 'preview', filename: file.name, cartola, rows });
    } catch (e) {
      const message =
        e instanceof CartolaError ? e.message : `No se pudo leer el archivo (${e instanceof Error ? e.message : e}).`;
      setState({ step: 'pick', error: message });
    }
  }

  async function onImport() {
    if (state.step !== 'preview') return;
    setState({ ...state, saving: true, error: undefined });
    try {
      const res = await api<ImportResponse>('/api/statements/commit', {
        method: 'POST',
        body: buildRequest(state.filename, state.cartola, state.rows, false),
      });
      setState({ step: 'done', inserted: res.inserted, skipped: res.skipped });
    } catch (e) {
      setState({ ...state, saving: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  function updateRow(i: number, patch: Partial<Row>) {
    if (state.step !== 'preview') return;
    setState({ ...state, rows: state.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  }

  return (
    <section className="max-w-5xl">
      <PageTitle>Importar</PageTitle>

      {(state.step === 'pick' || state.step === 'loading') && (
        <FilePicker onFile={onFile} loading={state.step === 'loading'} error={state.step === 'pick' ? state.error : undefined} />
      )}

      {state.step === 'preview' && (
        <Preview
          state={state}
          onChange={updateRow}
          onImport={onImport}
          onCancel={() => setState({ step: 'pick' })}
        />
      )}

      {state.step === 'done' && (
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6 space-y-4">
          <p className="flex items-center gap-2 text-rose-900 font-medium">
            <CheckCircle2 className="text-pink-500" size={22} />
            Se guardaron {state.inserted} movimientos
            {state.skipped > 0 && `, se omitieron ${state.skipped} duplicados`}.
          </p>
          <button
            onClick={() => setState({ step: 'pick' })}
            className="px-5 py-2.5 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors"
          >
            Importar otro archivo
          </button>
        </div>
      )}
    </section>
  );
}

function FilePicker({ onFile, loading, error }: { onFile: (f: File) => void; loading: boolean; error?: string }) {
  return (
    <div className="space-y-4">
      <label className="flex flex-col items-center justify-center gap-3 p-10 bg-white rounded-2xl border-2 border-dashed border-pink-200 text-center cursor-pointer hover:border-pink-400 transition-colors">
        <FileSpreadsheet className="text-pink-400" size={40} />
        <span className="text-rose-900 font-medium">
          {loading ? 'Leyendo la cartola…' : 'Elegir la cartola en Excel (.xls)'}
        </span>
        <span className="text-sm text-rose-700">
          Cuenta vista (cartola histórica o movimientos) o tarjeta de crédito (movimientos no facturados).
          El archivo se lee en tu dispositivo y no se sube.
        </span>
        <input
          type="file"
          accept=".xls,.xlsx"
          className="sr-only"
          disabled={loading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onFile(file);
          }}
        />
      </label>
      {error && <p className="text-sm text-rose-700 bg-rose-100 rounded-lg px-4 py-3">{error}</p>}
    </div>
  );
}

function Preview({
  state,
  onChange,
  onImport,
  onCancel,
}: {
  state: Extract<State, { step: 'preview' }>;
  onChange: (i: number, patch: Partial<Row>) => void;
  onImport: () => void;
  onCancel: () => void;
}) {
  const { cartola, rows } = state;
  const count = (s: RowStatus) => rows.filter((r) => r.status === s).length;
  const selected = rows.filter((r) => r.include && r.status !== 'duplicate').length;
  const isCard = cartola.accountType === 'tarjeta_credito';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-5 grid gap-4 sm:grid-cols-3 text-sm">
        <div>
          <p className="text-rose-700">{ACCOUNT_LABEL[cartola.accountType]}</p>
          <p className="text-rose-900 font-medium break-all">{state.filename}</p>
        </div>
        <div>
          <p className="text-rose-700">Período</p>
          <p className="text-rose-900 font-medium">
            {cartola.periodStart ? formatDate(cartola.periodStart) : '?'} – {cartola.periodEnd ? formatDate(cartola.periodEnd) : '?'}
          </p>
        </div>
        <div>
          <p className="text-rose-700">{isCard ? 'Deuda (cupo utilizado)' : 'Saldo final'}</p>
          <p className="text-rose-900 font-medium">
            {cartola.closingBalance == null ? '—' : formatCLP(isCard ? -cartola.closingBalance : cartola.closingBalance)}
          </p>
        </div>
        <p className="sm:col-span-3 text-rose-800">
          {count('new')} nuevas · {count('duplicate')} ya importadas
          {count('possible') > 0 && ` · ${count('possible')} posibles duplicados (revísalos)`}
        </p>
      </div>

      {cartola.warnings.length > 0 && (
        <ul className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1 text-sm text-amber-800">
          {cartola.warnings.map((w) => (
            <li key={w} className="flex gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {w}
            </li>
          ))}
        </ul>
      )}

      <ul className="bg-white rounded-2xl border border-pink-100 shadow-sm divide-y divide-pink-50">
        {rows.map((r, i) => {
          const duplicate = r.status === 'duplicate';
          return (
            <li
              key={i}
              className={`grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_6.5rem_1fr_auto_8rem] items-center gap-x-3 gap-y-1 px-4 py-3 ${duplicate ? 'opacity-50' : ''}`}
            >
              {/* Celular: casilla, fecha y monto arriba; descripción y etiquetas abajo. Escritorio: todo en una fila */}
              <input
                type="checkbox"
                aria-label="Incluir"
                className="row-start-1 col-start-1 accent-pink-500 size-4"
                checked={r.include && !duplicate}
                disabled={duplicate}
                onChange={(e) => onChange(i, { include: e.target.checked })}
              />
              <span className="row-start-1 col-start-2 text-xs text-rose-700 md:text-sm">{formatDate(r.date)}</span>
              <span
                className={`row-start-1 col-start-3 md:col-start-5 justify-self-end font-medium tabular-nums ${r.amount < 0 ? 'text-rose-900' : 'text-emerald-600'}`}
              >
                {formatCLP(r.amount)}
              </span>
              <input
                className="row-start-2 col-start-2 col-span-2 md:row-start-1 md:col-start-3 md:col-span-1 min-w-0 bg-transparent text-rose-900 rounded px-1 -mx-1 border border-transparent hover:border-pink-200 focus:border-pink-400 focus:outline-none"
                value={r.description}
                disabled={duplicate}
                title={r.originalDescription}
                onChange={(e) => onChange(i, { description: e.target.value })}
              />
              <div className="row-start-3 col-start-2 col-span-2 md:row-start-1 md:col-start-4 md:col-span-1 flex flex-wrap gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full ${STATUS[r.status].className}`}>{STATUS[r.status].label}</span>
                {r.installment && <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">Cuota {r.installment}</span>}
                <button
                  type="button"
                  disabled={duplicate}
                  onClick={() => onChange(i, { internal: !r.internal })}
                  title="Los movimientos internos (pago de la tarjeta, traspasos entre tus cuentas) no cuentan en los totales"
                  className={`px-2 py-0.5 rounded-full border ${r.internal ? 'border-rose-300 bg-rose-100 text-rose-700' : 'border-pink-100 text-rose-300 hover:text-rose-600'}`}
                >
                  Interno
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {state.error && <p className="text-sm text-rose-700 bg-rose-100 rounded-lg px-4 py-3">{state.error}</p>}

      <div className="flex gap-3 sticky bottom-20 md:bottom-4">
        <button
          onClick={onImport}
          disabled={selected === 0 || state.saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 text-white rounded-full font-medium shadow-md hover:bg-pink-600 disabled:opacity-50 transition-colors"
        >
          <Upload size={18} />
          {state.saving ? (
            'Importando…'
          ) : (
            <span>
              Importar {selected}
              <span className="hidden sm:inline"> movimientos</span>
            </span>
          )}
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 bg-white text-rose-900 border border-pink-200 rounded-full font-medium hover:bg-pink-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
