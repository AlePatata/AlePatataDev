import { Hono } from 'hono';
import { requireAuth, type AppEnv } from './auth';
import { statements } from './statements';

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

app.notFound((c) => c.json({ error: 'not_found' }, 404));

export default app;
