import { normalizeDescription } from './dedupe';

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

// Intermediarios de pago que el banco antepone al comercio: `MERPAGO*COMERCIO`, `payu *uber Eats`
const PAYMENT_PROCESSOR = /^(merpago|mercadopago|tuu|payu|flow|fudo|haulmer|sumup|getnet)\s*\*\s*/;

/**
 * Patrón sugerido al recategorizar a mano. En los pagos se queda solo el comercio
 * (`Pago:merpago*cafe Prueba` → `cafe prueba`). En las transferencias se mantiene el prefijo, porque
 * `traspaso a:` (le pagué) y `traspaso de:` (me pagó) significan cosas distintas.
 */
export function suggestPattern(description: string): string {
  let text = normalizeDescription(description);
  if (!text.startsWith('traspaso')) {
    text = text.replace(/^pago\s*:\s*/, '').replace(PAYMENT_PROCESSOR, '');
  }
  return text.replace(/[\s*]+$/, '').trim();
}
