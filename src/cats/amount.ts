import { useSyncExternalStore } from 'react';
import type { Emotion } from './emotions';

// Cuánto gatito quiere cada quien, de 0 a 100 %, guardado en este dispositivo (como el tema).
// Sube la probabilidad de que cada disparador muestre un gatito y cuántos caben a la vez.

export const CAT_AMOUNT_STORAGE_KEY = 'gatitos';
export const DEFAULT_CAT_AMOUNT = 50;
export const CAT_AMOUNT_STEP = 10;

/** Lo guardado, si es un número válido, redondeado al paso y dentro de 0–100; si no, el valor por defecto. */
export function parseCatAmount(stored: string | null): number {
  if (stored === null || stored.trim() === '') return DEFAULT_CAT_AMOUNT;
  const n = Number(stored);
  if (!Number.isFinite(n)) return DEFAULT_CAT_AMOUNT;
  return Math.min(100, Math.max(0, Math.round(n / CAT_AMOUNT_STEP) * CAT_AMOUNT_STEP));
}

/** Probabilidad (0–1) de que un disparador muestre de verdad su gatito. */
export function catChance(amount: number): number {
  return amount / 100;
}

/** Cuántos gatitos caben en pantalla a la vez: 1 hasta 40 %, 2 hasta 80 %, 3 en la invasión. */
export function maxCats(amount: number): number {
  if (amount <= 0) return 0;
  if (amount <= 40) return 1;
  if (amount <= 80) return 2;
  return 3;
}

/** Nombre y gatito de muestra para cada nivel, para el control. */
export function catAmountLevel(amount: number): { label: string; emotion: Emotion } {
  if (amount <= 0) return { label: 'Sin gatitos', emotion: 'triste' };
  if (amount <= 20) return { label: 'Gatito tímido', emotion: 'aburrido' };
  if (amount <= 40) return { label: 'Gatito de visita', emotion: 'curioso' };
  if (amount <= 60) return { label: 'Gatitos por aquí y por allá', emotion: 'enamorado' };
  if (amount <= 80) return { label: 'Casa llena de gatitos', emotion: 'orgulloso' };
  if (amount < 100) return { label: 'Casi una invasión', emotion: 'ansioso' };
  return { label: 'Invasión gatuna total', emotion: 'millonario' };
}

let amount: number | undefined;
const listeners = new Set<() => void>();

export function getCatAmount(): number {
  if (amount === undefined) {
    try {
      amount = parseCatAmount(localStorage.getItem(CAT_AMOUNT_STORAGE_KEY));
    } catch {
      amount = DEFAULT_CAT_AMOUNT; // localStorage bloqueado (modo privado estricto)
    }
  }
  return amount;
}

export function setCatAmount(value: number) {
  amount = parseCatAmount(String(value));
  try {
    localStorage.setItem(CAT_AMOUNT_STORAGE_KEY, String(amount));
  } catch {
    // Sin localStorage el cambio vale solo para esta visita
  }
  listeners.forEach((notify) => notify());
}

/** Para que otros (como el bus de gatitos) se enteren cuando cambia. */
export function onCatAmountChange(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

export function useCatAmount(): number {
  return useSyncExternalStore(onCatAmountChange, getCatAmount, () => DEFAULT_CAT_AMOUNT);
}
