import { Hono } from 'hono';
import { requireAuth, type AppEnv } from './auth';
import { categories, rules } from './categories';
import { settings, summary, trends } from './dashboard';
import { statements } from './statements';
import { transactions } from './transactions';

const app = new Hono<AppEnv>().basePath('/api');

// Pública: se registra antes del middleware de autenticación
app.get('/health', async (c) => {
  // Confirma que el binding de D1 responde
  await c.env.DB.prepare('SELECT 1').first();
  return c.json({ ok: true });
});

app.use('*', requireAuth);

app.get('/me', (c) => c.json({ email: c.get('email'), role: c.get('role') }));
app.route('/statements', statements);
app.route('/transactions', transactions);
app.route('/categories', categories);
app.route('/rules', rules);
app.route('/settings', settings);
app.route('/summary', summary);
app.route('/trends', trends);

app.notFound((c) => c.json({ error: 'not_found' }, 404));

export default app;
