export type Role = 'owner' | 'partner';

interface RoleEnv {
  OWNER_EMAIL: string;
  PARTNER_EMAIL: string;
}

const normalize = (email: string) => email.trim().toLowerCase();

/** Rol según el email autenticado; `null` si no es ninguno de los dos autorizados. */
export function roleFor(email: string, env: RoleEnv): Role | null {
  const e = normalize(email);
  if (!e) return null;
  if (env.OWNER_EMAIL && e === normalize(env.OWNER_EMAIL)) return 'owner';
  if (env.PARTNER_EMAIL && e === normalize(env.PARTNER_EMAIL)) return 'partner';
  return null;
}

/** La dueña ve todo; el pololo solo `/api/me` y `/api/wishlist*`. */
export function canAccess(role: Role, path: string): boolean {
  if (role === 'owner') return true;
  return path === '/api/me' || path === '/api/wishlist' || path.startsWith('/api/wishlist/');
}
