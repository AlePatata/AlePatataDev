import { describe, expect, it } from 'vitest';
import { matchCategory, suggestPattern, type Rule } from './rules';

const rules: Rule[] = [
  { id: 1, pattern: 'uber', categoryId: 3 },
  { id: 2, pattern: 'uber eats', categoryId: 1 },
  { id: 3, pattern: 'Farmácia', categoryId: 6 },
  { id: 4, pattern: 'cafe', categoryId: 1 },
  { id: 5, pattern: 'tienda', categoryId: 5 },
  { id: 6, pattern: 'libro', categoryId: 9 },
];

describe('matchCategory', () => {
  it('gana el patrón más largo', () => {
    expect(matchCategory('Pago:payu *uber Eats', rules)).toBe(1);
    expect(matchCategory('UBER TRIP', rules)).toBe(3);
  });

  it('ignora mayúsculas, tildes y espacios', () => {
    expect(matchCategory('FARMACIA  DEL BARRIO', rules)).toBe(6);
  });

  it('en un empate de largo gana la regla más antigua', () => {
    expect(matchCategory('TIENDA LIBRO', [rules[5], rules[4]])).toBe(5);
  });

  it('devuelve null si ninguna calza', () => {
    expect(matchCategory('Traspaso A:Persona Inventada', rules)).toBeNull();
    expect(matchCategory('algo', [{ id: 9, pattern: '  ', categoryId: 1 }])).toBeNull();
  });
});

describe('suggestPattern', () => {
  it('en los pagos deja solo el comercio, sin el intermediario', () => {
    expect(suggestPattern('Pago:merpago*cafe Prueba')).toBe('cafe prueba');
    expect(suggestPattern('PAGO:MERPAGO*TIENDA')).toBe('tienda');
    expect(suggestPattern('Pago:payu *uber Eats')).toBe('uber eats');
    expect(suggestPattern('MERPAGO*LIBRERIA FALSA')).toBe('libreria falsa');
    expect(suggestPattern('Giro Cajero Automatico *')).toBe('giro cajero automatico');
  });

  it('en las transferencias mantiene el prefijo', () => {
    expect(suggestPattern('Traspaso A:Persona Inventada')).toBe('traspaso a:persona inventada');
    expect(suggestPattern('TRASPASO DE:Persona Inventada')).toBe('traspaso de:persona inventada');
  });
});
