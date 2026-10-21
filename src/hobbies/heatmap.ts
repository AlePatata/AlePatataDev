import type { ActivityDay, HobbySource } from '../shared/hobbies';

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatCell {
  date: string; // yyyy-mm-dd
  level: HeatLevel;
  days: ActivityDay[]; // la actividad de ese día, un item por hobby
}

export interface Heatmap {
  weeks: (HeatCell | null)[][]; // columnas de lunes a domingo; null = fuera del rango
  months: { week: number; label: string }[]; // la semana donde empieza cada mes
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** 0 = lunes … 6 = domingo */
const weekday = (date: string) => (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;

/**
 * Nivel 1–4 de cada cantidad según su lugar entre las cantidades distintas del mismo hobby. Va por
 * orden y no por proporción del máximo, así un día con 80 resoluciones de cubo no deja pálido al resto;
 * si todas son iguales (un wordle al día), todas van al máximo.
 */
export function levelsBySource(days: ActivityDay[]): Map<HobbySource, (count: number) => HeatLevel> {
  const counts = new Map<HobbySource, number[]>();
  for (const d of days) if (d.count > 0) counts.set(d.source, [...(counts.get(d.source) ?? []), d.count]);
  const result = new Map<HobbySource, (count: number) => HeatLevel>();
  for (const [source, list] of counts) {
    const distinct = [...new Set(list)].sort((a, b) => a - b);
    result.set(source, (count) => {
      if (count <= 0) return 0;
      if (distinct.length === 1) return 4;
      const rank = distinct.filter((v) => v < count).length;
      return (1 + Math.round((3 * Math.min(rank, distinct.length - 1)) / (distinct.length - 1))) as HeatLevel;
    });
  }
  return result;
}

/**
 * Arma la grilla del heatmap entre `from` y `to` (incluidos), con semanas de lunes a domingo. Con
 * `sources` solo cuenta esos hobbies; el nivel de un día es el más alto entre sus hobbies.
 */
export function buildHeatmap(from: string, to: string, days: ActivityDay[], sources?: HobbySource[]): Heatmap {
  const shown = sources ? days.filter((d) => sources.includes(d.source)) : days;
  const levels = levelsBySource(shown);
  const byDate = new Map<string, ActivityDay[]>();
  for (const d of shown) if (d.count > 0) byDate.set(d.date, [...(byDate.get(d.date) ?? []), d]);

  const weeks: (HeatCell | null)[][] = [];
  const months: Heatmap['months'] = [];
  let date = addDays(from, -weekday(from));
  while (date <= to) {
    const week: (HeatCell | null)[] = [];
    for (let i = 0; i < 7; i++, date = addDays(date, 1)) {
      if (date < from || date > to) {
        week.push(null);
        continue;
      }
      const dayItems = byDate.get(date) ?? [];
      const level = Math.max(0, ...dayItems.map((d) => levels.get(d.source)!(d.count))) as HeatLevel;
      week.push({ date, level, days: dayItems });
      if (date.endsWith('-01')) months.push({ week: weeks.length, label: MONTHS[Number(date.slice(5, 7)) - 1] });
    }
    weeks.push(week);
  }
  return { weeks, months };
}
