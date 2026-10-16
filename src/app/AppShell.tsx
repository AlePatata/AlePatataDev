import { Heart, LayoutDashboard, Receipt, Settings, Upload, type LucideIcon } from 'lucide-react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { ComingSoon } from './ComingSoon';
import { useMe, type Me, type Role } from './useMe';

interface Section {
  path: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

const sections: Section[] = [
  { path: '', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner'] },
  { path: 'gastos', label: 'Gastos', icon: Receipt, roles: ['owner'] },
  { path: 'importar', label: 'Importar', icon: Upload, roles: ['owner'] },
  { path: 'wishlist', label: 'Wishlist', icon: Heart, roles: ['owner', 'partner'] },
  { path: 'ajustes', label: 'Ajustes', icon: Settings, roles: ['owner'] },
];

export default function AppShell() {
  const { me, error } = useMe();

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-ink">No se pudo verificar tu sesión.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-accent text-on-accent rounded-full font-medium hover:bg-accent-hover transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!me) {
    return <div className="min-h-screen flex items-center justify-center text-accent">Cargando…</div>;
  }

  const allowed = sections.filter((s) => s.roles.includes(me.role));
  const home = me.role === 'owner' ? '/app' : '/app/wishlist';

  return (
    <div className="min-h-screen md:flex">
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-line bg-bar">
        <a href="/" className="text-xl font-bold text-accent">
          &lt;div&gt;
        </a>
        <ThemeToggle />
      </header>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-bar/90 backdrop-blur-md border-t border-line md:static md:w-56 md:min-h-screen md:border-t-0 md:border-r md:bg-bar">
        <div className="hidden md:flex items-center justify-between pl-6 pr-3 py-4">
          <a href="/" className="text-xl font-bold text-accent">
            &lt;div&gt;
          </a>
          <ThemeToggle />
        </div>
        <ul className="flex justify-around md:flex-col md:gap-1 md:px-3">
          {allowed.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path ? `/app/${path}` : '/app'}
                end
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-2 text-xs md:flex-row md:gap-3 md:text-base md:rounded-lg transition-colors ${
                    isActive ? 'text-accent md:bg-soft' : 'text-ink hover:text-accent'
                  }`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main className="flex-1 px-4 pt-8 pb-24 md:px-10 md:pb-8">
        <Routes>
          {allowed.map(({ path, label }) => (
            <Route
              key={path}
              index={path === ''}
              path={path || undefined}
              element={path === '' ? <Dashboard me={me} /> : <ComingSoon title={label} />}
            />
          ))}
          <Route path="*" element={<Navigate to={home} replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Dashboard({ me }: { me: Me }) {
  return (
    <ComingSoon title="Dashboard">
      <p className="text-ink-muted text-sm">
        Sesión: {me.email} ({me.role === 'owner' ? 'dueña' : 'pololo'})
      </p>
    </ComingSoon>
  );
}
