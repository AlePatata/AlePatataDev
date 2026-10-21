import { useEffect, useState, useSyncExternalStore } from 'react';
import { catFrameUrl, type Emotion } from '../shared/cats';
import { CatSvg } from './CatSvg';
import { useCatLook } from './looks';

const reducedMotion = typeof window === 'undefined' ? undefined : window.matchMedia('(prefers-reduced-motion: reduce)');

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (notify) => {
      reducedMotion?.addEventListener('change', notify);
      return () => reducedMotion?.removeEventListener('change', notify);
    },
    () => reducedMotion?.matches ?? false,
    () => false,
  );
}

/** Cuadros que se turnan en bucle. Con "reducir movimiento" queda el primero. */
export function CatFrames({ frames, frameMs, className = '' }: { frames: string[]; frameMs: number; className?: string }) {
  const [tick, setTick] = useState(0);
  const still = usePrefersReducedMotion() || frames.length < 2;

  useEffect(() => {
    if (still) return;
    const timer = setInterval(() => setTick((t) => t + 1), frameMs);
    return () => clearInterval(timer);
  }, [still, frameMs]);

  const current = still ? 0 : tick % frames.length;
  // Todos apilados en la misma celda y se ve uno: así cambiar de cuadro no parpadea mientras carga
  return (
    <span className={`grid ${className}`}>
      {frames.map((id, i) => (
        <img
          key={id}
          src={catFrameUrl(id)}
          alt=""
          draggable={false}
          className={`[grid-area:1/1] w-full h-auto self-end object-contain ${i === current ? '' : 'invisible'}`}
        />
      ))}
    </span>
  );
}

/** El gatito de una emoción: sus imágenes de Ajustes si tiene, si no el dibujo de siempre. */
export function CatFace({ emotion, className = '' }: { emotion: Emotion; className?: string }) {
  const look = useCatLook(emotion);
  if (!look?.frames.length) return <CatSvg emotion={emotion} className={className} />;
  return <CatFrames frames={look.frames} frameMs={look.frameMs} className={className} />;
}
