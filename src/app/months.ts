/** Hoy en hora local, aaaa-mm-dd */
export const today = () => new Date().toLocaleDateString('sv-SE');
export const currentMonth = () => today().slice(0, 7);

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** '2026-10' → 'Octubre de 2026'; con `short`, 'oct' */
export function monthLabel(month: string, short = false) {
  const label = new Date(`${month}-01T12:00:00`).toLocaleDateString(
    'es-CL',
    short ? { month: 'short' } : { month: 'long', year: 'numeric' },
  );
  return short ? label.replace('.', '') : label.charAt(0).toUpperCase() + label.slice(1);
}
