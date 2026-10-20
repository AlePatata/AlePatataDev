// Detectores puros (sin DOM) para las emociones que salen de cómo se usa la página.
// Reciben coordenadas y tiempos en ms; Cats.tsx les pasa los eventos del navegador.

/**
 * ¿El mouse se está moviendo muy rápido? Mide la distancia recorrida en los últimos `windowMs` y
 * avisa cuando la velocidad media supera `threshold` (px/ms) durante al menos `minSpanMs`, así un
 * salto suelto del cursor no cuenta.
 */
export function createSpeedMeter({ windowMs = 300, minSpanMs = 200, threshold = 3 } = {}) {
  let samples: { x: number; y: number; t: number }[] = [];

  return (x: number, y: number, t: number): boolean => {
    samples.push({ x, y, t });
    samples = samples.filter((s) => t - s.t <= windowMs);
    const span = t - samples[0].t;
    if (span < minSpanMs) return false;

    let distance = 0;
    for (let i = 1; i < samples.length; i++) {
      distance += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y);
    }
    if (distance / span < threshold) return false;
    samples = []; // vuelve a medir desde cero para no avisar en cada evento
    return true;
  };
}

/** ¿Llegaron `count` eventos (clics) en menos de `windowMs`? */
export function createBurstCounter({ count = 6, windowMs = 1200 } = {}) {
  let times: number[] = [];

  return (t: number): boolean => {
    times = [...times.filter((s) => t - s < windowMs), t];
    if (times.length < count) return false;
    times = [];
    return true;
  };
}

/** Se puede mostrar una emoción si nunca salió o si ya pasó su espera. */
export function cooledDown(last: number | undefined, now: number, cooldownMs: number): boolean {
  return last === undefined || now - last >= cooldownMs;
}
