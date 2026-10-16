// Funciones de texto compartidas entre la app y el Worker.

/**
 * Los dos formatos de la cuenta vista escriben la misma descripción con distintas mayúsculas y espacios
 * (`PAGO:EL COMERCIO` / `Pago:el Comercio`), así que se comparan en minúsculas, sin tildes y con los
 * espacios colapsados.
 */
export function normalizeDescription(description: string): string {
  return description
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
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
