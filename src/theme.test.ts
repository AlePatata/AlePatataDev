import { describe, expect, it } from 'vitest';
import { resolveTheme } from './theme';

describe('resolveTheme', () => {
  it('respeta la elección guardada aunque el sistema diga otra cosa', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });

  it('sin elección guardada sigue al sistema', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
  });

  it('ignora valores guardados inválidos', () => {
    expect(resolveTheme('morado', true)).toBe('dark');
    expect(resolveTheme('', false)).toBe('light');
  });
});
