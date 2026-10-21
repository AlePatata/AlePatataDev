import { describe, expect, it } from 'vitest';
import type { WordleDay } from '../shared/hobbies';
import { scoreGuess, toWordleDay, wordleDate, wordleNumber, wordleStats, wordleSummary } from './wordleLogic';

describe('scoreGuess', () => {
  it('pinta verdes, amarillos y grises', () => {
    expect(scoreGuess('crane', 'crane')).toBe('GGGGG');
    expect(scoreGuess('nacre', 'crane')).toBe('YYYYG');
    expect(scoreGuess('dusty', 'crane')).toBe('BBBBB');
  });

  it('no pinta de más las letras repetidas', () => {
    // Una sola "e" en la solución y la última "e" del intento ya la usa en verde: las otras quedan grises
    expect(scoreGuess('eerie', 'crane')).toBe('BBYBG');
    // La "l" verde gasta la única "l"; la otra queda gris
    expect(scoreGuess('hello', 'world')).toBe('BBBGY');
    expect(scoreGuess('llama', 'hello')).toBe('YYBBB');
  });

  it('no distingue mayúsculas', () => {
    expect(scoreGuess('CRANE', 'crane')).toBe('GGGGG');
  });
});

describe('wordleNumber / wordleDate', () => {
  it('el 0 es el 2021-06-19', () => {
    expect(wordleNumber('2021-06-19')).toBe(0);
    expect(wordleNumber('2026-10-20')).toBe(1949);
    expect(wordleDate(1949)).toBe('2026-10-20');
  });
});

describe('toWordleDay', () => {
  const puzzle = { id: 829, solution: 'crane', print_date: '2026-10-20', days_since_launch: 1949 };

  it('guarda solo colores de una partida ganada', () => {
    const day = toWordleDay(puzzle, {
      puzzle_id: '829',
      game_data: { boardState: ['dusty', 'nacre', 'crane', '', '', ''], currentRowIndex: 3, hardMode: true, status: 'WIN' },
    });
    expect(day).toEqual({ number: 1949, date: '2026-10-20', result: 3, hardMode: true, rows: ['BBBBB', 'YYYYG', 'GGGGG'] });
    expect(JSON.stringify(day)).not.toMatch(/crane|dusty|nacre/);
  });

  it('una partida perdida no tiene resultado', () => {
    const day = toWordleDay(puzzle, {
      puzzle_id: 829,
      game_data: { boardState: Array(6).fill('dusty'), currentRowIndex: 6, status: 'FAIL' },
    });
    expect(day?.result).toBeNull();
    expect(day?.rows).toHaveLength(6);
  });

  it('ignora partidas sin terminar', () => {
    expect(toWordleDay(puzzle, { puzzle_id: 829, game_data: { boardState: ['dusty'], status: 'IN_PROGRESS' } })).toBeNull();
    expect(toWordleDay(puzzle, { puzzle_id: 829 })).toBeNull();
  });
});

describe('wordleSummary', () => {
  it('se escribe como al compartir', () => {
    expect(wordleSummary({ number: 1, date: '', result: 4, hardMode: false, rows: [] })).toBe('4/6');
    expect(wordleSummary({ number: 1, date: '', result: null, hardMode: true, rows: [] })).toBe('X/6*');
  });
});

describe('wordleStats', () => {
  const day = (number: number, result: number | null): WordleDay => ({ number, date: '', result, hardMode: false, rows: [] });

  it('cuenta jugadas, victorias y la distribución', () => {
    const stats = wordleStats([day(1, 3), day(2, 4), day(3, null), day(4, 4)], 4);
    expect(stats).toMatchObject({ played: 4, won: 3, distribution: [0, 0, 1, 2, 0, 0] });
  });

  it('la racha actual termina hoy, o ayer si hoy no he jugado', () => {
    const days = [day(10, 3), day(11, 4), day(12, 2)];
    expect(wordleStats(days, 12).currentStreak).toBe(3);
    expect(wordleStats(days, 13).currentStreak).toBe(3);
    expect(wordleStats(days, 14).currentStreak).toBe(0);
  });

  it('un día perdido o sin jugar corta la racha', () => {
    const days = [day(1, 3), day(2, 3), day(3, 3), day(4, null), day(5, 2), day(7, 4), day(8, 5)];
    const stats = wordleStats(days, 8);
    expect(stats.currentStreak).toBe(2);
    expect(stats.maxStreak).toBe(3);
  });
});
