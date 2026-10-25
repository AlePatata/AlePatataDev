import { describe, expect, it } from 'vitest';
import { formatTime, type CubeSolve } from '../shared/hobbies';
import { bestAverage, buildPuzzles, cubeDays, currentAverage, parseBackup, toSolve, type CsTime } from './cstimerLogic';

// 2026-10-20 15:00 en Chile, en segundos
const T0 = Date.UTC(2026, 9, 20, 18) / 1000;

const solve = (ms: number, penalty: CubeSolve['penalty'] = 0, i = 0): CubeSolve => ({
  timestamp: T0 + i * 60,
  date: '2026-10-20',
  ms,
  penalty,
});
const solves = (list: (number | 'DNF')[]) => list.map((v, i) => (v === 'DNF' ? solve(99999, 2, i) : solve(v, 0, i)));

describe('parseBackup', () => {
  it('lee las sesiones con tiempos, su puzzle y sus tandas', () => {
    const sessions = parseBackup({
      properties: {
        sessionData: JSON.stringify({
          1: { name: 1, opt: {} },
          2: { name: 'Pirámide', opt: { scrType: 'pyrso' } },
          3: { name: 3, opt: {} },
        }),
      },
      session1: ['aaa', 'bbb'],
      session2: [[[0, 4000], 'R U', '', T0]],
      session3: [],
    });
    expect(sessions).toEqual([
      { key: 'session1', name: '1', puzzle: '333', slices: ['aaa', 'bbb'], inline: [] },
      { key: 'session2', name: 'Pirámide', puzzle: 'pyrso', slices: [], inline: [[[0, 4000], 'R U', '', T0]] },
    ]);
  });

  it('acepta sessionData como objeto', () => {
    const [s] = parseBackup({ properties: { sessionData: { 1: { name: 'x', opt: { scrType: '222so' } } } }, session1: ['h'] });
    expect(s.puzzle).toBe('222so');
  });
});

describe('toSolve', () => {
  const t = (penalty: number): CsTime => [[penalty, 12340], "R U R'", 'comentario', T0];

  it('usa la fecha de Chile y no guarda scramble ni comentario', () => {
    expect(toSolve(t(0))).toEqual({ timestamp: T0, date: '2026-10-20', ms: 12340, penalty: 0 });
  });

  it('suma el +2', () => {
    expect(toSolve(t(2000))).toMatchObject({ ms: 14340, penalty: 1 });
  });

  it('marca el DNF', () => {
    expect(toSolve(t(-1))).toMatchObject({ ms: 12340, penalty: 2 });
  });

  it('con fases, el total es el primer tiempo', () => {
    expect(toSolve([[0, 20000, 15000, 5000], '', '', T0]).ms).toBe(20000);
  });
});

describe('medias WCA', () => {
  it('ao5 saca el mejor y el peor', () => {
    expect(currentAverage(solves([10000, 12000, 11000, 30000, 9000]), 5)).toBe(11000);
  });

  it('un DNF cuenta como el peor y se saca', () => {
    expect(currentAverage(solves([10000, 12000, 11000, 'DNF', 9000]), 5)).toBe(11000);
  });

  it('con dos DNF la media es DNF', () => {
    expect(currentAverage(solves([10000, 'DNF', 11000, 'DNF', 9000]), 5)).toBe('DNF');
  });

  it('usa solo las últimas n', () => {
    expect(currentAverage(solves([1000, 10000, 12000, 11000, 30000, 9000]), 5)).toBe(11000);
  });

  it('sin suficientes resoluciones es null', () => {
    expect(currentAverage(solves([10000, 12000]), 5)).toBeNull();
    expect(bestAverage(solves([10000, 12000]), 5)).toBeNull();
  });

  it('ao100 saca 5 de cada lado', () => {
    // 5 muy rápidos, 90 de 20 s, 5 DNF: quedan solo los de 20 s
    const list: (number | 'DNF')[] = [...Array(5).fill(1000), ...Array(90).fill(20000), ...Array(5).fill('DNF')];
    expect(currentAverage(solves(list), 100)).toBe(20000);
    expect(currentAverage(solves([...list.slice(1), 'DNF']), 100)).toBe('DNF');
  });

  it('la mejor media busca en toda la historia', () => {
    expect(bestAverage(solves([20000, 20000, 20000, 20000, 20000, 10000, 10000, 10000, 10000, 10000, 30000]), 5)).toBe(10000);
  });
});

describe('formatTime', () => {
  it('muestra centésimas y minutos', () => {
    expect(formatTime(55314)).toBe('55,31');
    expect(formatTime(9000)).toBe('9,00');
    expect(formatTime(62340)).toBe('1:02,34');
    expect(formatTime(59999)).toBe('1:00,00');
  });
});

describe('buildPuzzles', () => {
  it('junta las sesiones del mismo puzzle y ordena por cantidad', () => {
    const [cube, pyra] = buildPuzzles([
      { puzzle: '333', name: '1', solves: solves([30000, 'DNF']) },
      { puzzle: 'pyrso', name: '2', solves: solves([5000]) },
      { puzzle: '333', name: '3', solves: solves([25000]).map((s) => ({ ...s, timestamp: T0 - 600 })) },
    ]);
    expect(cube).toMatchObject({ puzzle: '333', label: '3x3', count: 3, dnfs: 1, best: 25000 });
    expect(cube.solves.map((s) => s.ms)).toEqual([25000, 30000, 99999]);
    expect(pyra).toMatchObject({ label: 'Pyraminx', count: 1, best: 5000 });
  });

  it('sin tiempos válidos no hay mejor single', () => {
    const [p] = buildPuzzles([{ puzzle: '333', name: '1', solves: solves(['DNF']) }]);
    expect(p.best).toBeNull();
  });
});

describe('cubeDays', () => {
  it('resume cada día', () => {
    const day = solves([55314, 'DNF', 60000]).map((s) => ({ ...s, label: '3x3' }));
    const other = { ...solve(5000), date: '2026-10-21', label: 'Pyraminx' };
    expect(cubeDays([other, ...day, { ...other, label: '3x3' }])).toEqual([
      { date: '2026-10-20', count: 3, summary: '3 de 3x3, mejor 55,31 s' },
      { date: '2026-10-21', count: 2, summary: '2 resoluciones (Pyraminx, 3x3)' },
    ]);
  });

  it('un día con solo DNF no tiene mejor', () => {
    expect(cubeDays([{ ...solve(1, 2), label: '3x3' }])[0].summary).toBe('1 de 3x3');
  });
});
