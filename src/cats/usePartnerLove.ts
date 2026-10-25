import { useEffect } from 'react';
import { getCatAmount } from './amount';
import { feel } from './catBus';

const FIRST_MS = 3000;
const MIN_MS = 30_000;
const MAX_MS = 60_000;

/**
 * En la cuenta de mi pololo sale un gatito enamorado al entrar y después cada 30 a 60 s, mientras la
 * pestaña está a la vista. Sale siempre, sin el sorteo de "cuánto gatito", salvo que lo deje en 0 %.
 */
export function usePartnerLove(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (ms: number) => {
      timer = setTimeout(() => {
        if (document.visibilityState === 'visible' && getCatAmount() > 0) feel('enamorado', { force: true });
        schedule(MIN_MS + Math.random() * (MAX_MS - MIN_MS));
      }, ms);
    };
    schedule(FIRST_MS);
    return () => clearTimeout(timer);
  }, [enabled]);
}
