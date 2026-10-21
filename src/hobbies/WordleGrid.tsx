import type { WordleRow } from '../shared/hobbies';

// Clases completas para que Tailwind genere --color-wordle-*
const TILE: Record<string, string> = { G: 'bg-wordle-hit', Y: 'bg-wordle-near', B: 'bg-wordle-miss' };
const NAME: Record<string, string> = { G: 'verde', Y: 'amarillo', B: 'gris' };

/** Las casillas de un Wordle, solo colores. Las amarillas llevan un punto para no depender del color. */
export function WordleGrid({ rows, size = 'md' }: { rows: WordleRow[]; size?: 'md' | 'sm' }) {
  const tile = size === 'md' ? 'size-9 rounded-md' : 'size-3.5 rounded-[3px]';
  const gap = size === 'md' ? 'gap-1.5' : 'gap-0.5';
  return (
    <div className={`inline-flex flex-col ${gap}`}>
      {rows.map((row, i) => (
        <div key={i} className={`flex ${gap}`} role="img" aria-label={`Intento ${i + 1}: ${[...row].map((c) => NAME[c]).join(', ')}`}>
          {[...row].map((c, j) => (
            <span key={j} className={`${tile} ${TILE[c]} grid place-items-center`}>
              {c === 'Y' && <span className={`${size === 'md' ? 'size-1.5' : 'size-1'} rounded-full bg-card/80`} />}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
