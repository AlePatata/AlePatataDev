import { describe, expect, it } from 'vitest';
import { rangeStart } from './hobbiesLogic';

describe('rangeStart', () => {
  it('cuenta hoy como el último día', () => {
    expect(rangeStart('2026-10-20', 1)).toBe('2026-10-20');
    expect(rangeStart('2026-10-20', 7)).toBe('2026-10-14');
  });

  it('cruza meses, años y bisiestos', () => {
    expect(rangeStart('2026-10-20')).toBe('2025-10-21');
    expect(rangeStart('2024-03-01', 2)).toBe('2024-02-29');
    expect(rangeStart('2026-01-03', 5)).toBe('2025-12-30');
  });
});
