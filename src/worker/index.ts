import { Hono } from 'hono';
import { requireAuth, type AppEnv, type Secrets } from './auth';
import { categories, rules } from './categories';
import { settings, summary, trends } from './dashboard';
import { hobbiesAdmin, publicHobbies } from './hobbies';
import { statements } from './statements';
import { runSync } from './sync';
import { transactions } from './transactions';
import { wishlist } from './wishlist';

const app = new Hono<AppEnv>().basePath('/api');

// Pública: se registra antes del middleware de autenticación
app.get('/health', async (c) => {
  // Confirma que el binding de D1 responde
  await c.env.DB.prepare('SELECT 1').first();
  return c.json({ ok: true });
});

// Lo de /hobbies, también público (Access tiene un Bypass solo para /api/public/*)
app.route('/public/hobbies', publicHobbies);

app.use('*', requireAuth);

app.get('/me', (c) => c.json({ email: c.get('email'), role: c.get('role') }));
app.route('/statements', statements);
app.route('/transactions', transactions);
app.route('/categories', categories);
app.route('/rules', rules);
app.route('/settings', settings);
app.route('/summary', summary);
app.route('/trends', trends);
app.route('/wishlist', wishlist);
app.route('/hobbies', hobbiesAdmin);

app.notFound((c) => c.json({ error: 'not_found' }, 404));

export default {
  fetch: app.fetch,
  // Cron de wrangler.jsonc: trae los datos de los hobbies (ver plan/13-hobbies.md)
  scheduled(_controller, env, ctx) {
    ctx.waitUntil(runSync(env));
  },
} satisfies ExportedHandler<Env & Secrets>;
