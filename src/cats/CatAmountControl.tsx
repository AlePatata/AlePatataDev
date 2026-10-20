import { Cat } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { CAT_AMOUNT_STEP, catAmountLevel, setCatAmount, useCatAmount } from './amount';
import { CatSvg } from './CatSvg';

/**
 * Botón con un gatito al lado del de modo oscuro: abre un panel para elegir de 0 a 100 %
 * cuánto gatito invade la página. `align` dice hacia qué lado se abre el panel.
 */
export function CatAmountControl({ align = 'right' }: { align?: 'left' | 'right' }) {
  const amount = useCatAmount();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const level = catAmountLevel(amount);

  // Se cierra al tocar fuera o con Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Cuánto gatito"
        title="Cuánto gatito"
        aria-expanded={open}
        aria-controls={panelId}
        className={`p-2 rounded-full hover:text-accent hover:bg-soft transition-colors ${open ? 'text-accent bg-soft' : 'text-ink'}`}
      >
        <Cat size={20} />
      </button>
      {open && (
        <div
          id={panelId}
          className={`absolute top-full mt-2 z-50 w-64 rounded-2xl bg-card border border-line-soft shadow-lg p-4 space-y-3 ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          <div className="flex items-center gap-3">
            <CatSvg emotion={level.emotion} className={`w-14 shrink-0 ${amount === 0 ? 'opacity-50' : ''}`} />
            <div>
              <p className="text-sm font-semibold text-ink">Cuánto gatito</p>
              <p className="text-sm text-ink-soft">
                <span className="font-semibold text-accent">{amount} %</span> · {level.label}
              </p>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={CAT_AMOUNT_STEP}
            value={amount}
            onChange={(e) => setCatAmount(Number(e.target.value))}
            aria-label="Cuánto gatito"
            aria-valuetext={`${amount} %, ${level.label}`}
            className="w-full h-10 accent-[var(--color-accent)] cursor-pointer"
          />
          <p className="text-xs text-ink-muted">
            Más gatito: salen más seguido y caben más a la vez. Se guarda en este dispositivo.
          </p>
        </div>
      )}
    </div>
  );
}
