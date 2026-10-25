// Estilos y ayudas compartidas por las pestañas de Ajustes.

export const card = 'bg-card rounded-2xl border border-line-soft shadow-sm p-4 sm:p-5 space-y-4';
export const input = 'bg-card rounded-lg border border-line px-3 py-2 text-ink focus:border-mark focus:outline-none';
export const primary =
  'flex items-center gap-1.5 px-4 py-2 bg-accent text-on-accent rounded-full text-sm font-medium hover:bg-accent-hover disabled:opacity-50';

export const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));
