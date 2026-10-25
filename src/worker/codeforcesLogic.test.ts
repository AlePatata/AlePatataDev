import { describe, expect, it } from 'vitest';
import type { CfContest } from '../shared/hobbies';
import { acStreak, codeforcesDays, codeforcesDetail, firstSolves, toContest, toSubmissionRow, type SubmissionRow } from './codeforcesLogic';

let nextId = 1;
const sub = (date: string, verdict: string | null, problem = 'A', rating: number | null = 800, tags = ['math']): SubmissionRow => ({
  id: nextId++,
  timestamp: Date.parse(`${date}T15:00:00Z`) / 1000 + nextId,
  date,
  contestId: 100,
  index: problem,
  name: `Problema ${problem}`,
  rating,
  tags,
  verdict,
  participantType: 'PRACTICE',
});

const contest = (contestId: number, date: string, newRating: number): CfContest => ({
  contestId,
  name: `Round ${contestId}`,
  date,
  rank: 5000,
  oldRating: 0,
  newRating,
});

describe('toSubmissionRow', () => {
  it('usa la fecha de Chile y deja lo que se muestra', () => {
    const row = toSubmissionRow({
      id: 7,
      contestId: 2261,
      // 2026-10-21 02:00 UTC = 2026-10-20 23:00 en Chile
      creationTimeSeconds: Date.UTC(2026, 9, 21, 2) / 1000,
      problem: { contestId: 2261, index: 'C', name: 'Un problema', rating: 1000, tags: ['games'] },
      author: { participantType: 'CONTESTANT' },
      verdict: 'OK',
    });
    expect(row).toMatchObject({ id: 7, date: '2026-10-20', contestId: 2261, index: 'C', rating: 1000, verdict: 'OK' });
  });

  it('un problema sin dificultad ni veredicto queda en null', () => {
    const row = toSubmissionRow({
      id: 8,
      creationTimeSeconds: 0,
      problem: { index: 'A', name: 'x', tags: [] },
      author: { participantType: 'PRACTICE' },
    });
    expect(row).toMatchObject({ contestId: null, rating: null, verdict: null });
  });
});

describe('toContest', () => {
  it('toma la fecha de la actualización del rating', () => {
    expect(
      toContest({
        contestId: 1,
        contestName: 'Div. 2',
        rank: 10,
        ratingUpdateTimeSeconds: Date.UTC(2026, 9, 20, 18) / 1000,
        oldRating: 1000,
        newRating: 1016,
      }),
    ).toMatchObject({ date: '2026-10-20', name: 'Div. 2', newRating: 1016 });
  });
});

describe('firstSolves', () => {
  it('cuenta cada problema una vez, en su primer AC', () => {
    const solved = firstSolves([
      sub('2026-10-02', 'OK', 'A'),
      sub('2026-10-01', 'WRONG_ANSWER', 'A'),
      sub('2026-10-01', 'OK', 'A'),
      sub('2026-10-03', 'OK', 'B'),
    ]);
    expect(solved.map((s) => [s.index, s.date])).toEqual([
      ['A', '2026-10-01'],
      ['B', '2026-10-03'],
    ]);
  });
});

describe('acStreak', () => {
  it('cuenta la racha actual si el último AC fue hoy o ayer', () => {
    const dates = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-05', '2026-10-06'];
    expect(acStreak(dates, '2026-10-06')).toEqual({ current: 2, max: 3 });
    expect(acStreak(dates, '2026-10-07')).toEqual({ current: 2, max: 3 });
    expect(acStreak(dates, '2026-10-08')).toEqual({ current: 0, max: 3 });
  });

  it('cruza fin de mes y repetidos', () => {
    expect(acStreak(['2026-09-30', '2026-10-01', '2026-10-01'], '2026-10-01')).toEqual({ current: 2, max: 2 });
  });

  it('sin AC no hay racha', () => {
    expect(acStreak([], '2026-10-01')).toEqual({ current: 0, max: 0 });
  });
});

describe('codeforcesDetail', () => {
  it('junta rating, resueltos, dificultades y tags', () => {
    const d = codeforcesDetail(
      'yo',
      [
        sub('2026-10-01', 'OK', 'A', 800, ['math', 'greedy']),
        sub('2026-10-01', 'OK', 'A', 800, ['math', 'greedy']),
        sub('2026-10-02', 'OK', 'B', 1200, ['greedy']),
        sub('2026-10-02', 'WRONG_ANSWER', 'C', 1500, ['dp']),
        sub('2026-10-03', 'OK', 'D', null, ['implementation']),
      ],
      [contest(2, '2026-10-10', 1016), contest(1, '2026-09-01', 1049)],
      '2026-10-03',
    );
    expect(d).toMatchObject({ rating: 1016, maxRating: 1049, submissions: 5, solved: 3, streak: { current: 3, max: 3 } });
    expect(d.contests.map((c) => c.contestId)).toEqual([1, 2]);
    expect(d.byRating).toEqual([
      { rating: 800, count: 1 },
      { rating: 1200, count: 1 },
      { rating: null, count: 1 },
    ]);
    expect(d.tags).toEqual([
      { tag: 'greedy', count: 2 },
      { tag: 'implementation', count: 1 },
      { tag: 'math', count: 1 },
    ]);
    expect(d.recent.map((s) => s.index)).toEqual(['D', 'B', 'A']);
  });

  it('sin concursos no hay rating', () => {
    expect(codeforcesDetail('yo', [], [], '2026-10-01')).toMatchObject({ rating: null, maxRating: null, solved: 0 });
  });
});

describe('codeforcesDays', () => {
  it('resume cada día', () => {
    expect(
      codeforcesDays([
        sub('2026-10-02', 'WRONG_ANSWER'),
        sub('2026-10-01', 'OK', 'A', 800),
        sub('2026-10-01', 'OK', 'B', 1300),
        sub('2026-10-01', 'WRONG_ANSWER', 'C'),
        sub('2026-10-03', 'OK', 'D', null),
      ]),
    ).toEqual([
      { date: '2026-10-01', count: 3, summary: '2 AC de 3 envíos, máx 1300' },
      { date: '2026-10-02', count: 1, summary: '1 envío, sin AC' },
      { date: '2026-10-03', count: 1, summary: '1 AC de 1 envío' },
    ]);
  });
});
