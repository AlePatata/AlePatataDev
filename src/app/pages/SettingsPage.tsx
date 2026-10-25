import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { PageTitle } from '../PageTitle';
import { CatsSettings } from './settings/CatsSettings';
import { HobbySettings } from './settings/HobbySettings';
import { MoneySettings } from './settings/MoneySettings';

/** Pestañas de Ajustes, cada una con su ruta (/app/ajustes, /app/ajustes/gatitos…). */
const TABS = [
  { path: '', label: 'Plata', page: MoneySettings },
  { path: 'gatitos', label: 'Gatitos', page: CatsSettings },
  { path: 'hobbies', label: 'Hobbies', page: HobbySettings },
];

export function SettingsPage() {
  return (
    <section className="max-w-3xl space-y-6">
      <PageTitle>Ajustes</PageTitle>
      <nav aria-label="Secciones de ajustes" className="flex gap-2 overflow-x-auto">
        {TABS.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path ? `/app/ajustes/${path}` : '/app/ajustes'}
            end
            className={({ isActive }) =>
              `min-h-10 px-4 flex items-center rounded-full border text-sm transition-colors ${
                isActive ? 'bg-accent text-on-accent border-accent' : 'border-line text-ink-soft hover:text-accent hover:border-accent'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        {TABS.map(({ path, page: Page }) => (
          <Route key={path} index={!path} path={path || undefined} element={<Page />} />
        ))}
        <Route path="*" element={<Navigate to="/app/ajustes" replace />} />
      </Routes>
    </section>
  );
}
