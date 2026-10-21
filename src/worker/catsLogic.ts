import { CAT_LIMITS, type CatLook } from '../shared/cats';

export type ImageMime = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  bytes.length >= offset + signature.length && signature.every((b, i) => bytes[offset + i] === b);

/**
 * Qué imagen es según sus primeros bytes (no según el `Content-Type`, que manda quien sube).
 * Solo PNG, JPEG, GIF y WebP: un SVG podría traer scripts. `null` si no es ninguna.
 */
export function sniffImage(bytes: Uint8Array): ImageMime | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return 'image/gif'; // GIF8
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp'; // RIFF....WEBP
  return null;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/**
 * Valida un cambio de `PUT /api/cats/:emotion`. `frameIds` es el orden nuevo y tiene que traer
 * exactamente los cuadros que ya tiene la emoción (`current`). Devuelve el error o `null`.
 */
export function validateLookChange(body: unknown, current: string[]): string | null {
  if (!isObject(body)) return 'Cuerpo inválido';
  const b = body as Partial<CatLook> & { frameIds?: unknown };
  if (b.frameIds === undefined && b.frameMs === undefined && b.messages === undefined) return 'No hay nada que cambiar';
  if (b.frameIds !== undefined) {
    const ids = b.frameIds;
    if (!Array.isArray(ids) || ids.length !== current.length || new Set(ids).size !== ids.length || !ids.every((id) => current.includes(id))) {
      return 'Orden de imágenes inválido';
    }
  }
  if (
    b.frameMs !== undefined &&
    (!Number.isSafeInteger(b.frameMs) || b.frameMs < CAT_LIMITS.minFrameMs || b.frameMs > CAT_LIMITS.maxFrameMs)
  ) {
    return `La velocidad va de ${CAT_LIMITS.minFrameMs} a ${CAT_LIMITS.maxFrameMs} ms`;
  }
  if (b.messages !== undefined) {
    const m = b.messages;
    if (!Array.isArray(m) || m.length > CAT_LIMITS.maxMessages || !m.every((s) => typeof s === 'string')) return 'Frases inválidas';
    if (m.some((s) => s.trim().length > CAT_LIMITS.maxMessageLength)) return `Cada frase puede tener hasta ${CAT_LIMITS.maxMessageLength} letras`;
  }
  return null;
}

/** Frases guardadas: sin espacios de más ni líneas vacías. Ninguna = `null` (las de siempre). */
export function cleanMessages(messages: string[]): string[] | null {
  const kept = messages.map((s) => s.trim()).filter(Boolean);
  return kept.length ? kept : null;
}
