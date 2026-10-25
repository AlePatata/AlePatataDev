import Anthropic from '@anthropic-ai/sdk';
import type { Secrets } from './auth';
import { buildPrompt, buildQuestions, readAnswer, resultSchema, SYSTEM_PROMPT, type Uncategorized } from './categorizeLogic';
import { loadCategories } from './db';

/** Más de esto por pasada se deja para la siguiente (una importación normal trae bastante menos). */
const MAX_QUESTIONS = 150;

/**
 * Le pide a Claude una categoría para los movimientos sin categoría (sin los internos ni los
 * traspasos). Devuelve cuántos movimientos quedaron categorizados. Ver plan/15-categorias-claude.md.
 */
export async function categorizeWithClaude(env: Env & Secrets): Promise<number> {
  if (!env.ANTHROPIC_API_KEY) throw new Error('Falta el secreto ANTHROPIC_API_KEY');

  const [{ results: rows }, categories] = await Promise.all([
    env.DB.prepare('SELECT id, description, amount FROM transactions WHERE category_id IS NULL AND internal = 0 ORDER BY date DESC')
      .all<Uncategorized>(),
    loadCategories(env.DB),
  ]);
  const questions = buildQuestions(rows).slice(0, MAX_QUESTIONS);
  if (!questions.length || !categories.length) return 0;

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: resultSchema(categories) } },
    messages: [{ role: 'user', content: buildPrompt(questions, categories) }],
  });
  if (response.stop_reason === 'refusal') throw new Error('Claude no quiso categorizar estos movimientos');
  if (response.stop_reason === 'max_tokens') throw new Error('La respuesta de Claude quedó cortada');

  const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  const answers = readAnswer(JSON.parse(text), questions, categories);

  // `category_id IS NULL`: si mientras tanto lo categoricé a mano, gana lo mío
  const update = env.DB.prepare('UPDATE transactions SET category_id = ? WHERE id = ? AND category_id IS NULL AND internal = 0');
  const statements = answers.flatMap((a) => a.ids.map((id) => update.bind(a.categoryId, id)));
  if (!statements.length) return 0;
  const results = await env.DB.batch(statements);
  return results.reduce((n, r) => n + (r.meta.changes ?? 0), 0);
}
