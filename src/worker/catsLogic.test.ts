import { describe, expect, it } from 'vitest';
import { cleanMessages, sniffImage, validateLookChange } from './catsLogic';

const bytes = (...b: number[]) => new Uint8Array([...b, 0, 0, 0, 0]);

describe('sniffImage', () => {
  it('reconoce PNG, JPEG, GIF y WebP por sus primeros bytes', () => {
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png');
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg');
    expect(sniffImage(new TextEncoder().encode('GIF89a...'))).toBe('image/gif');
    expect(sniffImage(new TextEncoder().encode('RIFF\x10\x00\x00\x00WEBPVP8 '))).toBe('image/webp');
  });

  it('rechaza SVG, HTML, otros RIFF y archivos vacíos', () => {
    expect(sniffImage(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'))).toBeNull();
    expect(sniffImage(new TextEncoder().encode('<!doctype html>'))).toBeNull();
    expect(sniffImage(new TextEncoder().encode('RIFF\x10\x00\x00\x00WAVEfmt '))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
  });
});

describe('validateLookChange', () => {
  const current = ['a', 'b'];

  it('acepta un orden nuevo, la velocidad y las frases', () => {
    expect(validateLookChange({ frameIds: ['b', 'a'] }, current)).toBeNull();
    expect(validateLookChange({ frameMs: 300, messages: ['Hola', ''] }, current)).toBeNull();
  });

  it('exige que el orden traiga exactamente los cuadros que hay', () => {
    expect(validateLookChange({ frameIds: ['a'] }, current)).toBe('Orden de imágenes inválido');
    expect(validateLookChange({ frameIds: ['a', 'a'] }, current)).toBe('Orden de imágenes inválido');
    expect(validateLookChange({ frameIds: ['a', 'c'] }, current)).toBe('Orden de imágenes inválido');
  });

  it('rechaza velocidades y frases fuera de rango', () => {
    expect(validateLookChange({ frameMs: 50 }, current)).toMatch(/velocidad/);
    expect(validateLookChange({ frameMs: 250.5 }, current)).toMatch(/velocidad/);
    expect(validateLookChange({ messages: 'Hola' }, current)).toBe('Frases inválidas');
    expect(validateLookChange({ messages: ['x'.repeat(81)] }, current)).toMatch(/80 letras/);
    expect(validateLookChange({}, current)).toBe('No hay nada que cambiar');
    expect(validateLookChange(null, current)).toBe('Cuerpo inválido');
  });
});

describe('cleanMessages', () => {
  it('saca espacios y líneas vacías; sin frases queda null', () => {
    expect(cleanMessages([' Hola ', '', '  ', 'Chao'])).toEqual(['Hola', 'Chao']);
    expect(cleanMessages(['', ' '])).toBeNull();
  });
});
