import type { Category } from '../shared/summary';
import { normalizeDescription } from '../shared/text';

/** Un movimiento sin categoría, tal como sale de la base. */
export interface Uncategorized {
  id: number;
  description: string;
  amount: number;
}

/** Lo que se le pregunta a Claude: una descripción (sin repetir) y si es cargo o abono. */
export interface Question {
  description: string;
  charge: boolean;
  ids: number[]; // los movimientos que tienen esta descripción y este signo
}

/** Los traspasos traen nombres de personas: nunca salen de Cloudflare. */
export const isTransfer = (description: string) => normalizeDescription(description).startsWith('traspaso');

/** Agrupa por descripción normalizada y signo, sin los traspasos. */
export function buildQuestions(rows: Uncategorized[]): Question[] {
  const byKey = new Map<string, Question>();
  for (const row of rows) {
    if (isTransfer(row.description) || row.amount === 0) continue;
    const charge = row.amount < 0;
    const key = `${charge ? '-' : '+'}${normalizeDescription(row.description)}`;
    const question = byKey.get(key) ?? { description: row.description.trim(), charge, ids: [] };
    question.ids.push(row.id);
    byKey.set(key, question);
  }
  return [...byKey.values()];
}

/** Un cargo solo puede ir a un gasto; un abono, a un reembolso o un ingreso. */
const fits = (category: Category, charge: boolean) => (charge ? category.kind === 'expense' : category.kind !== 'expense');

export const SYSTEM_PROMPT = `Clasificas movimientos de una cuenta bancaria chilena (Banco de Chile) de una estudiante universitaria en Santiago.
Cada movimiento trae solo la descripción que pone el banco, a veces cortada o con el procesador de pago delante (MERPAGO*, TUU*, FLOW*, HAULMER*), y si es un cargo o un abono.
Elige la categoría que mejor corresponda de la lista. Un cargo solo puede ir a una categoría de tipo "expense"; un abono, a una de tipo "refund" o "income".
Si no puedes saber razonablemente qué es, responde null para ese movimiento: es mejor dejarlo sin categoría que adivinar.`;

/** El mensaje con las categorías y los movimientos numerados. */
export function buildPrompt(questions: Question[], categories: Category[]): string {
  const cats = categories.map((c) => `- ${c.id}: ${c.name} (${c.kind})`).join('\n');
  const items = questions.map((q, i) => `${i}. [${q.charge ? 'cargo' : 'abono'}] ${q.description}`).join('\n');
  return `Categorías (id: nombre (tipo)):\n${cats}\n\nMovimientos:\n${items}`;
}

/** JSON schema de la respuesta: un resultado por movimiento, con un id de la lista o null. */
export function resultSchema(categories: Category[]) {
  return {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            i: { type: 'integer', description: 'Número del movimiento' },
            categoryId: { anyOf: [{ type: 'integer', enum: categories.map((c) => c.id) }, { type: 'null' }] },
          },
          required: ['i', 'categoryId'],
          additionalProperties: false,
        },
      },
    },
    required: ['results'],
    additionalProperties: false,
  };
}

/**
 * Convierte la respuesta en `[categoría, ids de movimientos]`. No confía en Claude: ignora números
 * fuera de rango, ids que no existen y categorías cuyo tipo no calza con el signo.
 */
export function readAnswer(answer: unknown, questions: Question[], categories: Category[]): { categoryId: number; ids: number[] }[] {
  const results = (answer as { results?: unknown } | null)?.results;
  if (!Array.isArray(results)) return [];
  const byId = new Map(categories.map((c) => [c.id, c]));
  const seen = new Set<number>();
  return results.flatMap((r: { i?: unknown; categoryId?: unknown }) => {
    const question = typeof r?.i === 'number' ? questions[r.i] : undefined;
    const category = typeof r?.categoryId === 'number' ? byId.get(r.categoryId) : undefined;
    if (!question || !category || seen.has(r.i as number) || !fits(category, question.charge)) return [];
    seen.add(r.i as number);
    return [{ categoryId: category.id, ids: question.ids }];
  });
}
