import { Heart, LayoutDashboard, Receipt, Settings, Upload, type LucideIcon } from 'lucide-react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { ComingSoon } from './ComingSoon';
import { ExpensesPage } from './pages/ExpensesPage';
import { ImportPage } from './pages/ImportPage';
import { useMe, type Me, type Role } from './useMe';

interface Section {
  path: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  page?: () => React.ReactNode;
}

const sections: Section[] = [
  { path: '', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner'] },
  { path: 'gastos', label: 'Gastos', icon: Receipt, roles: ['owner'], page: ExpensesPage },
  { path: 'importar', label: 'Importar', icon: Upload, roles: ['owner'], page: ImportPage },
  { path: 'wishlist', label: 'Wishlist', icon: Heart, roles: ['owner', 'partner'] },
  { path: 'ajustes', label: 'Ajustes', icon: Settings, roles: ['owner'] },
];

export default function AppShell() {
  const { me, error } = useMe();

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-rose-900">No se pudo verificar tu sesión.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!me) {
    return <div className="min-h-screen flex items-center justify-center text-pink-500">Cargando…</div>;
  }

  const allowed = sections.filter((s) => s.roles.includes(me.role));
  const home = me.role === 'owner' ? '/app' : '/app/wishlist';

  return (
    <div className="min-h-screen md:flex">
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-rose-50/90 backdrop-blur-md border-t border-pink-200 md:static md:w-56 md:min-h-screen md:border-t-0 md:border-r md:bg-rose-50">
        <a href="/" className="hidden md:block px-6 py-5 text-xl font-bold text-pink-500">
          &lt;div&gt;
        </a>
        <ul className="flex justify-around md:flex-col md:gap-1 md:px-3">
          {allowed.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path ? `/app/${path}` : '/app'}
                end
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-2 text-xs md:flex-row md:gap-3 md:text-base md:rounded-lg transition-colors ${
                    isActive ? 'text-pink-500 md:bg-pink-100' : 'text-rose-900 hover:text-pink-500'
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
          {allowed.map(({ path, label, page: Page }) => (
            <Route
              key={path}
              index={path === ''}
              path={path || undefined}
              element={path === '' ? <Dashboard me={me} /> : Page ? <Page /> : <ComingSoon title={label} />}
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
      <p className="text-rose-700 text-sm">
        Sesión: {me.email} ({me.role === 'owner' ? 'dueña' : 'pololo'})
      </p>
    </ComingSoon>
  );
}
