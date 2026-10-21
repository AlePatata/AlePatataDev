/** Días que muestra el heatmap: hoy y los 364 anteriores. */
export const HEATMAP_DAYS = 365;

/** Primer día del rango que termina en `today` (yyyy-mm-dd) y dura `days` días. */
export function rangeStart(today: string, days = HEATMAP_DAYS): string {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}
