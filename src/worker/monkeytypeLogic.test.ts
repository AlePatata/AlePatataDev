import { describe, expect, it } from 'vitest';
import type { TypingTest } from '../shared/hobbies';
import { bestPbs, dateInChile, lastAverage, toTypingTest, typingDaySummary } from './monkeytypeLogic';

const test = (wpm: number, acc = 90): TypingTest => ({
  id: String(wpm),
  timestamp: 0,
  date: '',
  wpm,
  raw: wpm,
  acc,
  consistency: 0,
  mode: 'time',
  mode2: '30',
});

describe('dateInChile', () => {
  it('usa la fecha de Chile, no la UTC', () => {
    // 2026-10-21 02:00 UTC = 2026-10-20 23:00 en Chile (UTC-3)
    expect(dateInChile(Date.UTC(2026, 9, 21, 2))).toBe('2026-10-20');
  });
});

describe('toTypingTest', () => {
  it('no guarda el uid de la cuenta', () => {
    const t = toTypingTest({
      _id: 'abc',
      uid: 'secreto',
      wpm: 41.2,
      rawWpm: 46.8,
      acc: 92.62,
      consistency: 57.95,
      mode: 'time',
      mode2: '30',
      timestamp: Date.UTC(2026, 9, 20, 15),
    });
    expect(t).toEqual({
      id: 'abc',
      timestamp: Date.UTC(2026, 9, 20, 15),
      date: '2026-10-20',
      wpm: 41.2,
      raw: 46.8,
      acc: 92.62,
      consistency: 57.95,
      mode: 'time',
      mode2: '30',
    });
    expect(JSON.stringify(t)).not.toContain('secreto');
  });
});

describe('typingDaySummary', () => {
  it('escribe cuántos tests y el máximo con coma decimal', () => {
    expect(typingDaySummary(18, 55.58)).toBe('18 tests, máx 55,6 wpm');
    expect(typingDaySummary(1, 40)).toBe('1 test, máx 40 wpm');
  });
});

describe('lastAverage', () => {
  it('promedia los últimos 10', () => {
    const tests = [100, ...Array(10).fill(50)].map((w) => test(w));
    expect(lastAverage(tests)).toEqual({ wpm: 50, acc: 90 });
    expect(lastAverage([test(40, 95), test(50, 85)])).toEqual({ wpm: 45, acc: 90 });
    expect(lastAverage([])).toBeNull();
  });
});

describe('bestPbs', () => {
  it('se queda con el mejor de cada duración y las ordena', () => {
    const pbs = bestPbs('time', {
      '60': [{ wpm: 50, acc: 95, timestamp: Date.UTC(2026, 9, 20, 15) }],
      '15': [
        { wpm: 60, acc: 90, timestamp: Date.UTC(2026, 9, 19, 15) },
        { wpm: 65.04, acc: 91.26, timestamp: Date.UTC(2026, 9, 20, 15) },
      ],
    });
    expect(pbs).toEqual([
      { mode: 'time', mode2: '15', wpm: 65, acc: 91.3, date: '2026-10-20' },
      { mode: 'time', mode2: '60', wpm: 50, acc: 95, date: '2026-10-20' },
    ]);
    expect(bestPbs('words', null)).toEqual([]);
  });
});
