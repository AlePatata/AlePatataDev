import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SyncStatus } from '../../../shared/hobbies';
import { api } from '../../api';
import { card, errorText, primary } from './ui';

const SOURCE_LABEL: Record<SyncStatus['source'], string> = {
  codeforces: 'Codeforces',
  monkeytype: 'Monkeytype',
  trakt: 'Trakt',
  wordle: 'Wordle',
  cube: 'csTimer',
  claude: 'GitHub (vibe coding)',
};

const when = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'medium', timeStyle: 'short' });

/** Estado de lo que se sincroniza solo para /hobbies (cada 2 horas) y un botón para hacerlo ahora. */
export function HobbySettings() {
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
