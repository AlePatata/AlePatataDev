// Las emociones de los gatitos y qué dicen. Qué las dispara está en plan/12-gatitos.md.

import type { Emotion } from '../shared/cats';

export type { Emotion };

export const EMOTIONS: Record<Emotion, { label: string; messages: string[] }> = {
  ansioso: {
    label: 'Gatito ansioso',
    messages: ['¡¿Por qué tan rápido?!', 'Respira… el mouse no se va a escapar', 'Me estás poniendo nervioso'],
  },
  enojado: {
    label: 'Gatito enojado',
    messages: ['¡Deja de hacerme clic!', 'Un clic más y te boto el vaso de la mesa', 'Ya, ya, ya, entendí'],
  },
  aburrido: {
    label: 'Gatito aburrido',
    messages: ['Zzz… avísame cuando vuelvas', 'Me aburrí y me quedé dormido', '¿Hola? ¿Hay alguien?'],
  },
  triste: {
    label: 'Gatito triste',
    messages: ['Chao para siempre…', 'Ni siquiera le dijiste adiós'],
  },
  curioso: {
    label: 'Gatito curioso',
    messages: ['¿Eso es todo? ¿No hay más?', 'Llegaste al final… ¿y ahora qué?'],
  },
  endeudado: {
    label: 'Gatito endeudado',
    messages: ['Otro gasto más… mi billetera llora', 'La deuda crece y yo con ella', 'Voy a tener que vender mis croquetas'],
  },
  millonario: {
    label: 'Gatito millonario',
    messages: ['¡Plata! Ahora sí me compro el atún caro', 'Soy un gatito de negocios', 'Lucas, lucas, lucas'],
  },
  panico: {
    label: 'Gatito en pánico',
    messages: ['¡TE PASASTE DEL PRESUPUESTO!', 'Esto no es un simulacro'],
  },
  enamorado: {
    label: 'Gatito enamorado',
    messages: ['Lo quiero, lo necesito', 'Agregado al corazón (y a la wishlist)'],
  },
  orgulloso: {
    label: 'Gatito orgulloso',
    messages: ['Vas bien con el presupuesto, así se hace', 'Gatito ahorrador aprueba'],
  },
};

/** Una frase al azar: de las configuradas en Ajustes (`custom`) o, si no hay, de las de siempre. */
export function randomMessage(emotion: Emotion, custom: string[] = [], random = Math.random): string {
  const messages = custom.length ? custom : EMOTIONS[emotion].messages;
  return messages[Math.floor(random() * messages.length)];
}
