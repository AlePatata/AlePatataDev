import { useEffect, useState } from 'react';

export type Role = 'owner' | 'partner';

export interface Me {
  email: string;
  role: Role;
}

const RELOAD_FLAG = 'me-reloaded';

/**
 * Pide `/api/me`. Si falla (p. ej. venció la sesión de Access), recarga la página una vez
 * para que Access vuelva a pedir el código; si sigue fallando, devuelve el error.
 */
export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => (res.ok ? (res.json() as Promise<Me>) : Promise.reject(res.status)))
      .then((data) => {
        sessionStorage.removeItem(RELOAD_FLAG);
        setMe(data);
      })
      .catch(() => {
        if (!sessionStorage.getItem(RELOAD_FLAG)) {
          sessionStorage.setItem(RELOAD_FLAG, '1');
          window.location.reload();
        } else {
          setError(true);
        }
      });
  }, []);

  return { me, error };
}
