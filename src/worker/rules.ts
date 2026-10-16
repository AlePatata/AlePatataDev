import { normalizeDescription } from '../shared/text';

export interface Rule {
  id: number;
  pattern: string;
  categoryId: number;
}

/**
 * Categoría de la regla que calza con la descripción (la descripción normalizada contiene el patrón).
 * Si calzan varias gana el patrón más largo, así `uber eats` le gana a `uber`; en un empate, la más antigua.
 */
export function matchCategory(description: string, rules: Rule[]): number | null {
  const text = normalizeDescription(description);
  let best: { rule: Rule; length: number } | null = null;
  for (const rule of rules) {
    const pattern = normalizeDescription(rule.pattern);
    if (!pattern || !text.includes(pattern)) continue;
    if (!best || pattern.length > best.length || (pattern.length === best.length && rule.id < best.rule.id)) {
      best = { rule, length: pattern.length };
    }
  }
  return best?.rule.categoryId ?? null;
}
