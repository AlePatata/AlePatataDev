import { useSyncExternalStore } from 'react';
import { catChance, getCatAmount, maxCats, onCatAmountChange } from './amount';
import { cooledDown } from './detectors';
import { randomMessage, type Emotion } from './emotions';

// Cualquier parte de la página llama a feel() y <Cats /> muestra los gatitos.
// Cuántos salen depende de cuánto gatito eligió la persona (amount.ts).

export interface CatMood {
  id: number;
  emotion: Emotion;
  message: string;
}

const SHOW_MS = 4500;
const DEFAULT_COOLDOWN_MS = 20_000;
const NONE: CatMood[] = [];

let moods: CatMood[] = NONE;
let nextId = 1;
const hideTimers = new Map<number, ReturnType<typeof setTimeout>>();
const lastShown = new Map<Emotion, number>();
const listeners = new Set<() => void>();

function set(next: CatMood[]) {
  const kept = new Set(next.map((m) => m.id));
  for (const [id, timer] of hideTimers) {
    if (!kept.has(id)) {
      clearTimeout(timer);
      hideTimers.delete(id);
    }
  }
  moods = next.length ? next : NONE;
  listeners.forEach((notify) => notify());
}

/**
 * Muestra el gatito de esa emoción, salvo que ya haya salido hace menos de `cooldownMs`
 * (así mover el mouse rápido no lo muestra en cada evento). Con menos gatito elegido, a veces
 * no sale aunque toque; si ya no caben más, se va el más antiguo.
 */
export function feel(emotion: Emotion, { message, cooldownMs = DEFAULT_COOLDOWN_MS }: { message?: string; cooldownMs?: number } = {}) {
  const amount = getCatAmount();
  const now = Date.now();
  if (amount <= 0 || !cooledDown(lastShown.get(emotion), now, cooldownMs)) return;
  // Se cuenta aunque no salga, si no un disparador continuo insistiría hasta ganar el sorteo
  lastShown.set(emotion, now);
  if (Math.random() >= catChance(amount)) return;

  const mood = { id: nextId++, emotion, message: message ?? randomMessage(emotion) };
  // La misma emoción no sale dos veces a la vez: el gatito nuevo reemplaza al anterior
  set([...moods.filter((m) => m.emotion !== emotion), mood].slice(-maxCats(amount)));
  hideTimers.set(mood.id, setTimeout(() => dismiss(mood.id), SHOW_MS));
}

/** Cierra un gatito, o todos si no se dice cuál. */
export function dismiss(id?: number) {
  set(id === undefined ? NONE : moods.filter((m) => m.id !== id));
}

// Si bajan el nivel, sobran gatitos: se van los más antiguos
onCatAmountChange(() => {
  const max = maxCats(getCatAmount());
  if (moods.length > max) set(moods.slice(moods.length - max));
});

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

export function useCatMoods(): CatMood[] {
  return useSyncExternalStore(subscribe, () => moods, () => NONE);
}
