import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { dismiss, feel, useCatMoods } from './catBus';
import { CatSvg } from './CatSvg';
import { createBurstCounter, createSpeedMeter } from './detectors';
import { EMOTIONS } from './emotions';

const IDLE_MS = 60_000;
const AWAY_MS = 30_000;

/** Emociones que salen de cómo se usa la página, en el portafolio y en la app. */
function useGlobalTriggers() {
  useEffect(() => {
    const fast = createSpeedMeter();
    const rage = createBurstCounter();
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let hiddenAt: number | undefined;

    const restartIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => feel('aburrido'), IDLE_MS);
    };
    const onMove = (e: PointerEvent) => {
      restartIdle();
      // En el celular el dedo no "se mueve rápido" de la misma forma: solo el mouse
      if (e.pointerType === 'mouse' && fast(e.clientX, e.clientY, e.timeStamp)) feel('ansioso');
    };
    const onDown = (e: PointerEvent) => {
      restartIdle();
      if (rage(e.timeStamp)) feel('enojado');
    };
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        clearTimeout(idleTimer);
      } else {
        if (hiddenAt !== undefined && Date.now() - hiddenAt > AWAY_MS) feel('triste', { message: '¿Dónde estabas? Te extrañé' });
        restartIdle();
      }
    };

    restartIdle();
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('keydown', restartIdle);
    window.addEventListener('scroll', restartIdle, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', restartIdle);
      window.removeEventListener('scroll', restartIdle);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}

/** Los gatitos del momento, que se asoman desde la esquina con lo que sienten. Toca uno para cerrarlo. */
export function Cats() {
  useGlobalTriggers();
  const moods = useCatMoods();
  // En la app los gatitos quedan sobre la barra de abajo del celular
  const inApp = useLocation().pathname.startsWith('/app');
  const bottom = inApp ? 'bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6' : 'bottom-4 md:bottom-6';

  return (
    <div role="status" aria-live="polite" className={`fixed right-3 md:right-6 z-[60] flex flex-col items-end gap-2 ${bottom}`}>
      {moods.map((mood) => (
        <button
          key={mood.id}
          type="button"
          onClick={() => dismiss(mood.id)}
          title="Cerrar"
          className="flex items-end gap-2 text-left motion-safe:animate-cat-in"
        >
          <span className="relative mb-12 max-w-[13rem] rounded-2xl bg-card border border-line-soft shadow-lg px-3 py-2 text-sm text-ink">
            <span className="block text-xs font-semibold text-accent">{EMOTIONS[mood.emotion].label}</span>
            {mood.message}
          </span>
          <CatSvg
            emotion={mood.emotion}
            className={`w-24 shrink-0 drop-shadow-md ${mood.emotion === 'ansioso' || mood.emotion === 'panico' ? 'motion-safe:animate-cat-shake' : ''} ${mood.emotion === 'curioso' ? '-rotate-12' : ''}`}
          />
        </button>
      ))}
    </div>
  );
}
