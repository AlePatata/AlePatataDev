import { describe, expect, it } from 'vitest';
import type { ActivityDay } from '../shared/hobbies';
import { buildHeatmap, levelsBySource } from './heatmap';

const day = (date: string, source: ActivityDay['source'], count: number): ActivityDay => ({ date, source, count, summary: null });

describe('levelsBySource', () => {
  it('reparte los niveles por orden, sin que un día enorme aplaste al resto', () => {
    const level = levelsBySource([1, 2, 3, 4, 80].map((n, i) => day(`2026-10-0${i + 1}`, 'cube', n))).get('cube')!;
    expect([0, 1, 2, 3, 4, 80].map(level)).toEqual([0, 1, 2, 3, 3, 4]);
  });

  it('si todas las cantidades son iguales, van al nivel 2', () => {
    const level = levelsBySource([day('2026-10-01', 'wordle', 1), day('2026-10-02', 'wordle', 1)]).get('wordle')!;
    expect(level(1)).toBe(2);
  });

  it('cada hobby tiene su propia escala', () => {
    const levels = levelsBySource([day('2026-10-01', 'cube', 10), day('2026-10-02', 'cube', 50), day('2026-10-01', 'codeforces', 2)]);
    expect(levels.get('cube')!(10)).toBe(1);
    expect(levels.get('codeforces')!(2)).toBe(2);
  });
});

describe('buildHeatmap', () => {
  it('arma semanas de lunes a domingo y deja fuera lo que no está en el rango', () => {
    // 2026-10-14 es miércoles y 2026-10-20 es martes
    const { weeks } = buildHeatmap('2026-10-14', '2026-10-20', []);
    expect(weeks).toHaveLength(2);
    expect(weeks[0].map((c) => c?.date ?? null)).toEqual([
      null, null, '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18',
    ]);
    expect(weeks[1].map((c) => c?.date ?? null)).toEqual(['2026-10-19', '2026-10-20', null, null, null, null, null]);
  });

  it('marca la semana donde empieza cada mes', () => {
    const { months } = buildHeatmap('2026-09-28', '2026-11-03', []);
    expect(months).toEqual([
      { week: 0, label: 'oct' },
      { week: 4, label: 'nov' }, // el 1 de noviembre de 2026 es domingo
    ]);
  });

  it('el nivel del día es el más alto entre sus hobbies, y el filtro deja solo los elegidos', () => {
    const days = [
      day('2026-10-19', 'cube', 5),
      day('2026-10-20', 'cube', 40),
      day('2026-10-20', 'wordle', 1),
      day('2026-10-19', 'codeforces', 0),
    ];
    const all = buildHeatmap('2026-10-19', '2026-10-20', days).weeks[0];
    expect(all[0]).toMatchObject({ level: 1, days: [days[0]] });
    expect(all[1]).toMatchObject({ level: 4, days: [days[1], days[2]] });

    const onlyCube = buildHeatmap('2026-10-19', '2026-10-20', days, ['cube']).weeks[0];
    expect(onlyCube[1]).toMatchObject({ level: 4, days: [days[1]] });
    const onlyCodeforces = buildHeatmap('2026-10-19', '2026-10-20', days, ['codeforces']).weeks[0];
    expect(onlyCodeforces[0]).toMatchObject({ level: 0, days: [] });
  });
});
