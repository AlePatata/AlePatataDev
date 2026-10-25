import { createMiddleware } from 'hono/factory';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { canAccess, roleFor, type Role } from './roles';

/** Secretos: `wrangler secret put` en producción, `.dev.vars` en local. */
export interface Secrets {
  OWNER_EMAIL: string;
  PARTNER_EMAIL: string;
  /** Solo en `.dev.vars`: salta la validación del JWT. Nunca se define en producción. */
  DEV_AUTH_EMAIL?: string;
  /** Cookie de nytimes.com (`NYT-S=...`) para leer mis partidas de Wordle. Ver plan/13-hobbies.md. */
  NYT_COOKIE?: string;
  /** ApeKey de Monkeytype (monkeytype.com → Account → Ape Keys), solo lectura. */
  MONKEYTYPE_APE_KEY?: string;
  /** ID con que csTimer exporta a su servidor. Es una contraseña: quien lo tenga lee y sobrescribe mis tiempos. */
  CSTIMER_ID?: string;
}

export type AppEnv = {
  Bindings: Env & Secrets;
  Variables: { email: string; role: Role };
};

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

async function emailFromAccessJwt(token: string, env: Env): Promise<string | null> {
  jwks ??= createRemoteJWKSet(new URL(`${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`));
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: env.ACCESS_TEAM_DOMAIN,
      audience: env.ACCESS_AUD,
    });
    return typeof payload.email === 'string' ? payload.email : null;
  } catch {
    return null;
  }
}

/** Exige un JWT válido de Cloudflare Access y un email autorizado con permiso para la ruta. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  let email: string | null;
  if (c.env.DEV_AUTH_EMAIL) {
    console.warn(`DEV_AUTH_EMAIL activo: se omite Cloudflare Access (${c.env.DEV_AUTH_EMAIL})`);
    email = c.env.DEV_AUTH_EMAIL;
  } else {
    const token = c.req.header('Cf-Access-Jwt-Assertion');
    if (!token) return c.json({ error: 'unauthorized' }, 401);
    email = await emailFromAccessJwt(token, c.env);
    if (!email) return c.json({ error: 'unauthorized' }, 401);
  }

  const role = roleFor(email, c.env);
  if (!role || !canAccess(role, c.req.path)) return c.json({ error: 'forbidden' }, 403);

  c.set('email', email);
  c.set('role', role);
  await next();
});
