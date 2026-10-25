import { Heart, LayoutDashboard, Receipt, Settings, Upload, type LucideIcon } from 'lucide-react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { CatAmountControl } from '../cats/CatAmountControl';
import { ThemeToggle } from '../components/ThemeToggle';
import { ComingSoon } from './ComingSoon';
import { ExpensesPage } from './pages/ExpensesPage';
import { DashboardPage } from './pages/DashboardPage';
import { ImportPage } from './pages/ImportPage';
import { SettingsPage } from './pages/SettingsPage';
import { WishlistPage } from './pages/WishlistPage';
import { useMe, type Role } from './useMe';

interface Section {
  path: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  page?: () => React.ReactNode;
}

const sections: Section[] = [
  { path: '', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner'], page: DashboardPage },
  { path: 'gastos', label: 'Gastos', icon: Receipt, roles: ['owner'], page: ExpensesPage },
  { path: 'importar', label: 'Importar', icon: Upload, roles: ['owner'], page: ImportPage },
  { path: 'wishlist', label: 'Wishlist', icon: Heart, roles: ['owner', 'partner'], page: WishlistPage },
  { path: 'ajustes', label: 'Ajustes', icon: Settings, roles: ['owner'], page: SettingsPage },
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
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] border-b border-line bg-bar/90 backdrop-blur-md">
        <a href="/" className="text-xl font-bold text-accent">
          &lt;div&gt;
        </a>
        <div className="flex items-center gap-1">
          <CatAmountControl />
          <ThemeToggle />
        </div>
      </header>

      <nav className="fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)] bg-bar/90 backdrop-blur-md border-t border-line md:static md:pb-0 md:w-56 md:min-h-screen md:border-t-0 md:border-r md:bg-bar">
        <div className="hidden md:flex items-center justify-between pl-6 pr-3 py-4">
          <a href="/" className="text-xl font-bold text-accent">
            &lt;div&gt;
          </a>
          <div className="flex items-center">
            <CatAmountControl align="left" />
            <ThemeToggle />
          </div>
        </div>
        <ul className="flex md:flex-col md:gap-1 md:px-3">
          {allowed.map(({ path, label, icon: Icon }) => (
            <li key={path} className="flex-1 min-w-0 md:flex-none">
              <NavLink
                to={path ? `/app/${path}` : '/app'}
                end={!path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-0 py-2 text-[0.6875rem] min-[360px]:text-xs md:flex-row md:px-3 md:gap-3 md:text-base md:rounded-lg transition-colors ${
                    isActive ? 'text-accent md:bg-soft' : 'text-ink hover:text-accent'
                  }`
                }
              >
                <Icon size={20} />
                <span className="max-w-full truncate">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main className="flex-1 min-w-0 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-10 md:pt-8 md:pb-8">
        <Routes>
          {allowed.map(({ path, label, page: Page }) => (
            <Route
              key={path}
              index={path === ''}
              path={path ? `${path}/*` : undefined}
              element={Page ? <Page /> : <ComingSoon title={label} />}
            />
          ))}
          <Route path="*" element={<Navigate to={home} replace />} />
        </Routes>
      </main>
    </div>
  );
}
