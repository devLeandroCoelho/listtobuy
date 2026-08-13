import { describe, expect, it } from 'vitest';
import { sumCompletedSpent, toNumber } from '@/lib/budget';

describe('toNumber', () => {
  it('aceita number', () => {
    expect(toNumber(12.5)).toBe(12.5);
    expect(toNumber(0)).toBe(0);
  });

  it('aceita string com ponto decimal', () => {
    expect(toNumber('12.5')).toBe(12.5);
    expect(toNumber('12')).toBe(12);
  });

  it('aceita string com vírgula decimal (pt-BR)', () => {
    expect(toNumber('12,50')).toBe(12.5);
    expect(toNumber('3,99')).toBe(3.99);
  });

  it('aceita string com separador de milhar (pt-BR)', () => {
    expect(toNumber('1.234,56')).toBe(1234.56);
  });

  it('null/undefined/string vazia viram 0', () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber('')).toBe(0);
    expect(toNumber('  ')).toBe(0);
  });

  it('valores inválidos viram 0 sem quebrar', () => {
    expect(toNumber('abc')).toBe(0);
    expect(toNumber(Number.NaN)).toBe(0);
    expect(toNumber(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('sumCompletedSpent', () => {
  it('soma preços como number', () => {
    const items = [
      { completed: '1', price: 10 },
      { completed: '1', price: 15.5 },
      { completed: '0', price: 999 },
    ];
    expect(sumCompletedSpent(items)).toBe(25.5);
  });

  it('soma preços como string (regressão: nunca concatena)', () => {
    const items = [
      { completed: '1', price: '10' },
      { completed: '1', price: '15.5' },
    ];
    expect(sumCompletedSpent(items)).toBe(25.5);
  });

  it('soma preços em string com vírgula (pt-BR)', () => {
    const items = [
      { completed: '1', price: '12,50' },
      { completed: '1', price: '3,99' },
    ];
    expect(sumCompletedSpent(items)).toBeCloseTo(16.49);
  });

  it('item comprado sem preço não soma, mas não quebra', () => {
    const items = [
      { completed: '1', price: 10 },
      { completed: '1', price: null },
      { completed: '1' }, // price ausente (undefined)
      { completed: '1', price: 'abc' },
    ];
    expect(sumCompletedSpent(items)).toBe(10);
  });

  it('ignora itens não comprados', () => {
    const items = [
      { completed: '0', price: 100 },
      { completed: '0', price: '50' },
    ];
    expect(sumCompletedSpent(items)).toBe(0);
  });

  it('lista vazia soma 0', () => {
    expect(sumCompletedSpent([])).toBe(0);
  });
});
