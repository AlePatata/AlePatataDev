import { useSyncExternalStore } from 'react';
import { catFrameUrl, type CatLook, type CatLooks, type Emotion } from '../shared/cats';

// Cómo se ve cada gatito (Ajustes → Gatitos). Se baja una vez al cargar la página; mientras tanto, o
// si falla, salen los dibujos de siempre.

let looks: CatLooks = {};
let requested = false;
const listeners = new Set<() => void>();

export function loadCatLooks() {
  if (requested) return;
  requested = true;
  fetch('/api/public/cats')
    .then((res) => (res.ok ? (res.json() as Promise<CatLooks>) : null))
    .then((next) => next && setCatLooks(next))
    .catch(() => {});
}

/** Reemplaza la configuración (Ajustes la llama al guardar, así el cambio se ve al tiro). */
export function setCatLooks(next: CatLooks) {
  looks = next;
  listeners.forEach((notify) => notify());
  // Precarga los cuadros con calma, para que el gatito no salga en blanco la primera vez
  const preload = () => Object.values(next).forEach((look) => look.frames.forEach((id) => (new Image().src = catFrameUrl(id))));
  if ('requestIdleCallback' in window) requestIdleCallback(preload);
  else setTimeout(preload, 1000);
}

export const getCatLook = (emotion: Emotion): CatLook | undefined => looks[emotion];

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

export function useCatLook(emotion: Emotion): CatLook | undefined {
  return useSyncExternalStore(subscribe, () => looks[emotion], () => undefined);
}

export function useCatLooks(): CatLooks {
  return useSyncExternalStore(subscribe, () => looks, () => looks);
}
