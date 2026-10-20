import { useSyncExternalStore } from 'react';
import { cooledDown } from './detectors';
import { randomMessage, type Emotion } from './emotions';

// Un solo gatito a la vez: cualquier parte de la página llama a feel() y <Cats /> lo muestra.

export interface CatMood {
  id: number;
  emotion: Emotion;
  message: string;
}

const SHOW_MS = 4500;
const DEFAULT_COOLDOWN_MS = 20_000;

let current: CatMood | null = null;
let nextId = 1;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
const lastShown = new Map<Emotion, number>();
const listeners = new Set<() => void>();

function set(mood: CatMood | null) {
  current = mood;
  listeners.forEach((notify) => notify());
}

/**
 * Muestra el gatito de esa emoción, salvo que ya haya salido hace menos de `cooldownMs`
 * (así mover el mouse rápido no lo muestra en cada evento).
 */
export function feel(emotion: Emotion, { message, cooldownMs = DEFAULT_COOLDOWN_MS }: { message?: string; cooldownMs?: number } = {}) {
  const now = Date.now();
  if (!cooledDown(lastShown.get(emotion), now, cooldownMs)) return;
  lastShown.set(emotion, now);
  clearTimeout(hideTimer);
  set({ id: nextId++, emotion, message: message ?? randomMessage(emotion) });
  hideTimer = setTimeout(dismiss, SHOW_MS);
}

export function dismiss() {
  clearTimeout(hideTimer);
  set(null);
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

export function useCatMood(): CatMood | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
