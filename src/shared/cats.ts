// Emociones de los gatitos y su configuración (Ajustes → Gatitos), compartidas por la app y el Worker.

export const EMOTION_IDS = [
  'ansioso',
  'enojado',
  'aburrido',
  'disociado',
  'triste',
  'curioso',
  'endeudado',
  'millonario',
  'panico',
  'enamorado',
  'orgulloso',
] as const;

export type Emotion = (typeof EMOTION_IDS)[number];

export const isEmotion = (v: unknown): v is Emotion => EMOTION_IDS.includes(v as Emotion);

/** Cómo se ve una emoción: sus cuadros (ids de imagen, en orden), cuánto dura cada uno y sus frases. */
export interface CatLook {
  frames: string[];
  frameMs: number;
  /** Vacío = las frases de siempre. */
  messages: string[];
}

/** Solo trae las emociones que tienen algo configurado. */
export type CatLooks = Partial<Record<Emotion, CatLook>>;

export const CAT_LIMITS = {
  maxFrames: 8,
  maxImageBytes: 1024 * 1024,
  minFrameMs: 100,
  maxFrameMs: 5000,
  defaultFrameMs: 500,
  maxMessages: 10,
  maxMessageLength: 80,
} as const;

/** URL pública de un cuadro (cache de un año: cada imagen subida tiene un id nuevo). */
export const catFrameUrl = (id: string) => `/api/public/cats/frames/${id}`;
