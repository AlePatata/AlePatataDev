import { useSyncExternalStore } from 'react';

// Tema claro (rosado) u oscuro (Catppuccin Mocha). Ver plan/08-modo-oscuro.md.
// El script de index.html repite resolveTheme para poner la clase antes de que cargue React:
// si cambias la clave o la lógica, cámbiala allá también.

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

// Color de la barra del navegador en el celular (meta theme-color): rose-50 y Catppuccin Mantle
const BROWSER_BAR: Record<Theme, string> = { light: '#fff1f2', dark: '#181825' };

/** La elección guardada manda; si no hay una válida, se sigue al sistema. */
export function resolveTheme(stored: string | null, systemPrefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return systemPrefersDark ? 'dark' : 'light';
}

const listeners = new Set<() => void>();
let followingSystem = false;

function readStored(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null; // localStorage bloqueado (modo privado estricto)
  }
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BROWSER_BAR[theme]);
  listeners.forEach((notify) => notify());
}

function getTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  // Si nunca se eligió un tema, seguir los cambios del sistema mientras la página está abierta
  if (!followingSystem) {
    followingSystem = true;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', () => apply(resolveTheme(readStored(), media.matches)));
  }
  return () => {
    listeners.delete(notify);
  };
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Sin localStorage el cambio vale solo para esta visita
  }
  apply(theme);
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => 'light');
}
