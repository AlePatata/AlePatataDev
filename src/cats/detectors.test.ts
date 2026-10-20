import { describe, expect, it } from 'vitest';
import { cooledDown, createBurstCounter, createSpeedMeter } from './detectors';
import { EMOTIONS, randomMessage } from './emotions';

/** Mueve el mouse en línea recta a `pxPerMs` cada 16 ms durante `ms` y dice si alguna vez avisó. */
function move(meter: ReturnType<typeof createSpeedMeter>, pxPerMs: number, ms: number, start = 0) {
  let fired = false;
  for (let t = start; t <= start + ms; t += 16) fired = meter(t * pxPerMs, 0, t) || fired;
  return fired;
}

describe('createSpeedMeter', () => {
  it('no avisa con un movimiento normal', () => {
    expect(move(createSpeedMeter(), 1, 2000)).toBe(false);
  });

  it('avisa cuando el mouse va muy rápido un rato', () => {
    expect(move(createSpeedMeter(), 5, 400)).toBe(true);
  });

  it('no avisa por un salto suelto del cursor', () => {
    const meter = createSpeedMeter();
    expect(meter(0, 0, 0)).toBe(false);
    expect(meter(2000, 0, 16)).toBe(false);
  });

  it('después de avisar vuelve a medir desde cero', () => {
    const meter = createSpeedMeter();
    expect(move(meter, 5, 400)).toBe(true);
    expect(meter(5000, 0, 416)).toBe(false);
  });
});

describe('createBurstCounter', () => {
  it('avisa con 6 clics seguidos y no con 5', () => {
    const burst = createBurstCounter();
    const fired = [0, 100, 200, 300, 400, 500].map((t) => burst(t));
    expect(fired).toEqual([false, false, false, false, false, true]);
  });

  it('no cuenta clics espaciados', () => {
    const burst = createBurstCounter();
    expect([0, 500, 1000, 1500, 2000, 2500].some((t) => burst(t))).toBe(false);
  });
});

describe('cooledDown', () => {
  it('deja pasar la primera vez y después de la espera', () => {
    expect(cooledDown(undefined, 0, 1000)).toBe(true);
    expect(cooledDown(0, 999, 1000)).toBe(false);
    expect(cooledDown(0, 1000, 1000)).toBe(true);
  });
});

describe('EMOTIONS', () => {
  it('cada emoción tiene algo que decir', () => {
    for (const { messages } of Object.values(EMOTIONS)) expect(messages.length).toBeGreaterThan(0);
  });

  it('randomMessage elige una de sus frases', () => {
    expect(randomMessage('ansioso', () => 0)).toBe(EMOTIONS.ansioso.messages[0]);
    expect(randomMessage('ansioso', () => 0.999)).toBe(EMOTIONS.ansioso.messages.at(-1));
  });
});
