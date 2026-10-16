import type { Category, CategoryKind, RuleInfo, Settings } from '../shared/summary';
import { normalizeDescription } from './dedupe';

const KINDS: CategoryKind[] = ['expense', 'refund', 'income'];

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Valida una categoría a crear (`partial = false`) o los campos a cambiar. Devuelve el error o `null`. */
export function validateCategory(body: unknown, partial: boolean): string | null {
  if (!isObject(body)) return 'Cuerpo inválido';
  const b = body as Partial<Category>;
  if (partial && b.name === undefined && b.color === undefined && b.kind === undefined) return 'No hay nada que cambiar';
  if ((!partial || b.name !== undefined) && (typeof b.name !== 'string' || !b.name.trim() || b.name.length > 40)) {
    return 'Nombre inválido';
  }
  if ((!partial || b.color !== undefined) && (typeof b.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(b.color))) {
    return 'Color inválido';
  }
  if ((!partial || b.kind !== undefined) && !KINDS.includes(b.kind as CategoryKind)) return 'Tipo inválido';
  return null;
}

export function validateRule(body: unknown): string | null {
  if (!isObject(body)) return 'Cuerpo inválido';
  const b = body as Partial<RuleInfo>;
  if (typeof b.pattern !== 'string' || !normalizeDescription(b.pattern) || b.pattern.length > 100) return 'Patrón inválido';
  if (!Number.isSafeInteger(b.categoryId)) return 'Categoría inválida';
  return null;
}

export function validateSettings(body: unknown): string | null {
  if (!isObject(body)) return 'Cuerpo inválido';
  for (const key of ['monthlyIncome', 'monthlyBudget'] as const) {
    const v = (body as Partial<Settings>)[key];
    if (v !== undefined && v !== null && (!Number.isSafeInteger(v) || v < 0)) return `${key} inválido`;
  }
  return null;
}
