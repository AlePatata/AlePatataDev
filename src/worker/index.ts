import { Hono } from 'hono';
import { requireAuth, type AppEnv } from './auth';

const app = new Hono<AppEnv>().basePath('/api');

// Pública: se registra antes del middleware de autenticación
app.get('/health', (c) => c.json({ ok: true }));

app.use('*', requireAuth);

app.get('/me', (c) => c.json({ email: c.get('email'), role: c.get('role') }));

app.notFound((c) => c.json({ error: 'not_found' }, 404));

export default app;
