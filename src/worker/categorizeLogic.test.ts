import { describe, expect, it } from 'vitest';
import type { Category } from '../shared/summary';
import { buildPrompt, buildQuestions, isTransfer, readAnswer, resultSchema } from './categorizeLogic';

const categories: Category[] = [
  { id: 1, name: 'Comida', color: '#f00', kind: 'expense' },
  { id: 2, name: 'Supermercado', color: '#0f0', kind: 'expense' },
  { id: 11, name: 'Reembolso', color: '#00f', kind: 'refund' },
  { id: 12, name: 'Ingreso', color: '#ff0', kind: 'income' },
];

describe('isTransfer', () => {
  it('reconoce los traspasos con cualquier mayúscula', () => {
    expect(isTransfer('Traspaso A:Persona Inventada')).toBe(true);
    expect(isTransfer('TRASPASO DE:Otra Persona')).toBe(true);
    expect(isTransfer('MERPAGO*CAFE INVENTADO')).toBe(false);
  });
});

describe('buildQuestions', () => {
  it('saca los traspasos y los montos en cero', () => {
    const q = buildQuestions([
      { id: 1, description: 'Traspaso A:Persona Inventada', amount: -5000 },
      { id: 2, description: 'CAFE INVENTADO', amount: 0 },
      { id: 3, description: 'CAFE INVENTADO', amount: -2000 },
    ]);
    expect(q).toEqual([{ description: 'CAFE INVENTADO', charge: true, ids: [3] }]);
  });

  it('junta las descripciones repetidas, pero no un cargo con un abono', () => {
    const q = buildQuestions([
      { id: 1, description: 'Pago:almacen Inventado', amount: -1000 },
      { id: 2, description: 'PAGO:ALMACEN  INVENTADO ', amount: -3000 },
      { id: 3, description: 'Pago:almacen Inventado', amount: 1000 },
    ]);
    expect(q.map((x) => [x.charge, x.ids])).toEqual([
      [true, [1, 2]],
      [false, [3]],
    ]);
  });
});

describe('buildPrompt', () => {
  it('numera los movimientos y no incluye montos', () => {
    const text = buildPrompt([{ description: 'CAFE INVENTADO', charge: true, ids: [7] }], categories);
    expect(text).toContain('- 1: Comida (expense)');
    expect(text).toContain('0. [cargo] CAFE INVENTADO');
    expect(text).not.toContain('7');
  });
});

describe('resultSchema', () => {
  it('solo acepta los ids de las categorías o null', () => {
    const schema = resultSchema(categories);
    expect(schema.properties.results.items.properties.categoryId.anyOf[0]).toEqual({ type: 'integer', enum: [1, 2, 11, 12] });
  });
});

describe('readAnswer', () => {
  const questions = [
    { description: 'CAFE INVENTADO', charge: true, ids: [1, 2] },
    { description: 'DEVOLUCION INVENTADA', charge: false, ids: [3] },
    { description: 'COSA RARA', charge: true, ids: [4] },
  ];

  it('asigna la categoría a todos los movimientos de esa descripción', () => {
    const answer = { results: [{ i: 0, categoryId: 1 }, { i: 1, categoryId: 11 }, { i: 2, categoryId: null }] };
    expect(readAnswer(answer, questions, categories)).toEqual([
      { categoryId: 1, ids: [1, 2] },
      { categoryId: 11, ids: [3] },
    ]);
  });

  it('ignora categorías que no calzan con el signo', () => {
    const answer = { results: [{ i: 0, categoryId: 12 }, { i: 1, categoryId: 2 }] };
    expect(readAnswer(answer, questions, categories)).toEqual([]);
  });

  it('ignora números fuera de rango, ids inventados, repetidos y respuestas mal formadas', () => {
    const answer = { results: [{ i: 9, categoryId: 1 }, { i: 0, categoryId: 99 }, { i: 2, categoryId: 2 }, { i: 2, categoryId: 1 }] };
    expect(readAnswer(answer, questions, categories)).toEqual([{ categoryId: 2, ids: [4] }]);
    expect(readAnswer(null, questions, categories)).toEqual([]);
    expect(readAnswer({ results: 'no' }, questions, categories)).toEqual([]);
  });
});
