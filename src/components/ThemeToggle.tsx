import { Moon, Sun } from 'lucide-react';
import { setTheme, useTheme } from '../theme';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  const label = next === 'dark' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro';

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className={`p-2 rounded-full text-ink hover:text-accent hover:bg-soft transition-colors ${className}`}
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
