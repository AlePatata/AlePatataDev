import { describe, expect, it } from 'vitest';
import { findFeatures, isWithClaude, vibeDays, vibeDetail, type GhCommit } from './vibeLogic';

const CLAUDE = '\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>';
// 18:00 UTC = 15:00 en Chile; 02:00 UTC del día siguiente sigue siendo el mismo día en Chile
const at = (day: number, hourUtc = 18) => new Date(Date.UTC(2026, 9, day, hourUtc)).toISOString();
const commit = (sha: string, parents: string[], message: string, date: string): GhCommit => ({
  sha,
  parents: parents.map((p) => ({ sha: p })),
  commit: { message, author: { date } },
});

// a ─ b ──────── m1 ─ d ─ m2      (más reciente a la derecha; GitHub los da al revés)
//      └ c1 ─ c2 ┘     └ e ┘
const history: GhCommit[] = [
  commit('m2', ['d', 'e'], "Merge branch 'gatitos'", at(22)),
  commit('e', ['d'], `Add cat images${CLAUDE}`, at(22, 2)),
  commit('d', ['m1'], 'Fix a typo by hand', at(21)),
  commit('m1', ['b', 'c2'], "Merge branch 'hobbies'", at(20)),
  commit('c2', ['c1'], `Show the heatmap${CLAUDE}`, at(20)),
  commit('c1', ['b'], `Plan hobbies${CLAUDE}`, at(19)),
  commit('b', ['a'], `Init${CLAUDE}`, at(18)),
  commit('a', [], 'First commit', at(17)),
];

describe('isWithClaude', () => {
  it('busca la línea Co-Authored-By de Claude', () => {
    expect(isWithClaude(`Algo${CLAUDE}`)).toBe(true);
    expect(isWithClaude('Algo\n\nco-authored-by: claude <x>')).toBe(true);
    expect(isWithClaude('Hablé con Claude de esto')).toBe(false);
  });
});

describe('findFeatures', () => {
  it('cada merge trae solo los commits de su rama, en orden', () => {
    expect(findFeatures(history)).toEqual([
      { branch: 'gatitos', date: '2026-10-22', sha: 'm2', commits: ['Add cat images'] },
      { branch: 'hobbies', date: '2026-10-20', sha: 'm1', commits: ['Plan hobbies', 'Show the heatmap'] },
    ]);
  });

  it('un merge sin el resto del historial no se cae', () => {
    expect(findFeatures([history[0]])).toEqual([{ branch: 'gatitos', date: '2026-10-22', sha: 'm2', commits: [] }]);
  });
});

describe('vibeDays', () => {
  it('cuenta por día en Chile los commits con Claude y dice qué se terminó', () => {
    expect(vibeDays(history, findFeatures(history))).toEqual([
      { date: '2026-10-18', count: 1, summary: '1 commit con Claude' },
      { date: '2026-10-19', count: 1, summary: '1 commit con Claude' },
      { date: '2026-10-20', count: 1, summary: '1 commit con Claude · terminamos hobbies' },
      // "Add cat images" fue a las 02:00 UTC del 22 = 23:00 del 21 en Chile
      { date: '2026-10-21', count: 1, summary: '1 commit con Claude' },
    ]);
  });

  it('con más de dos features en un día, solo dice cuántas', () => {
    const feature = (branch: string) => ({ branch, date: '2026-10-18', sha: branch, commits: [] });
    expect(vibeDays(history, [feature('nombres-fijos'), feature('b')])[0].summary).toBe('1 commit con Claude · terminamos nombres fijos y b');
    expect(vibeDays(history, [feature('a'), feature('b'), feature('c')])[0].summary).toBe('1 commit con Claude · terminamos 3 features');
  });
});

describe('vibeDetail', () => {
  it('suma sin contar los merges', () => {
    const d = vibeDetail(history);
    expect(d.totals).toEqual({ commits: 6, withClaude: 4, features: 2, days: 4, since: '2026-10-18' });
    expect(d.features[0].branch).toBe('gatitos');
    expect(d.recent.map((r) => r.subject)).toEqual(['Add cat images', 'Show the heatmap', 'Plan hobbies', 'Init']);
  });

  it('sin commits', () => {
    expect(vibeDetail([]).totals).toEqual({ commits: 0, withClaude: 0, features: 0, days: 0, since: null });
  });
});
