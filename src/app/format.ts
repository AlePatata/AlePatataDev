const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' });

/** -12500 → "-$12.500" (Intl en es-CL pone el signo después del "$") */
export const formatCLP = (amount: number) => (amount < 0 ? '-' : '') + clp.format(Math.abs(amount));

/** 2026-09-23 → 23/09/2026 */
export const formatDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export const ACCOUNT_LABEL: Record<string, string> = {
  cuenta_vista: 'Cuenta vista',
  cuenta_corriente: 'Cuenta corriente',
  tarjeta_credito: 'Tarjeta de crédito',
};
