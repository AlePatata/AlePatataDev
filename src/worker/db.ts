import type { Category, Settings } from '../shared/summary';
import { matchCategory, type Rule } from './rules';

export async function loadCategories(db: D1Database): Promise<Category[]> {
  const { results } = await db.prepare('SELECT id, name, color, kind FROM categories ORDER BY id').all<Category>();
  return results;
}

export async function loadRules(db: D1Database): Promise<Rule[]> {
  const { results } = await db
    .prepare('SELECT id, pattern, category_id AS categoryId FROM category_rules ORDER BY id')
    .all<Rule>();
  return results;
}

const SETTING_KEYS = {
  monthlyIncome: 'monthly_income',
  monthlyBudget: 'monthly_budget',
} as const;

export async function loadSettings(db: D1Database): Promise<Settings> {
  const { results } = await db.prepare('SELECT key, value FROM settings').all<{ key: string; value: string | null }>();
  const get = (key: string) => {
    const v = results.find((r) => r.key === key)?.value;
    return v == null || v === '' ? null : v;
  };
  const money = (key: string) => (get(key) == null ? null : Number(get(key)));
  return {
    monthlyIncome: money(SETTING_KEYS.monthlyIncome),
    monthlyBudget: money(SETTING_KEYS.monthlyBudget),
  };
}

export async function saveSettings(db: D1Database, settings: Partial<Settings>): Promise<void> {
  const upsert = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  );
  const changes = (Object.keys(SETTING_KEYS) as (keyof Settings)[])
    .filter((k) => settings[k] !== undefined)
    .map((k) => {
      const v = settings[k];
      return upsert.bind(SETTING_KEYS[k], v == null ? null : String(v));
    });
  if (changes.length) await db.batch(changes);
}

/** Aplica las reglas a los movimientos sin categoría. Devuelve cuántos categorizó. */
export async function applyRulesToUncategorized(db: D1Database): Promise<number> {
  const rules = await loadRules(db);
  if (!rules.length) return 0;
  const { results } = await db
    .prepare('SELECT id, description FROM transactions WHERE category_id IS NULL AND internal = 0')
    .all<{ id: number; description: string }>();
  const update = db.prepare('UPDATE transactions SET category_id = ? WHERE id = ? AND category_id IS NULL');
  const changes = results.flatMap((t) => {
    const categoryId = matchCategory(t.description, rules);
    return categoryId == null ? [] : [update.bind(categoryId, t.id)];
  });
  if (changes.length) await db.batch(changes);
  return changes.length;
}

/** Fecha de hoy en Chile (el Worker corre en UTC). */
export const todayInChile = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Santiago' });
