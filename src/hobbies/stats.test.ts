import { describe, expect, it } from 'vitest';
import { movingAverage } from './stats';

describe('movingAverage', () => {
  it('al principio promedia lo que hay', () => {
    expect(movingAverage([10, 20, 30, 40], 2)).toEqual([10, 15, 25, 35]);
    expect(movingAverage([])).toEqual([]);
  });
});
