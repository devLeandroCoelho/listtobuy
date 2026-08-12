import { describe, expect, it } from 'vitest';
import { clampQuantity } from '@/lib/quantity';

describe('clampQuantity', () => {
  it('incrementa quantidade', () => {
    expect(clampQuantity(1, 1)).toBe(2);
    expect(clampQuantity('2', 1)).toBe(3);
    expect(clampQuantity('3.5', 0.5)).toBe(4);
  });

  it('decrementa quantidade', () => {
    expect(clampQuantity('5', -1)).toBe(4);
    expect(clampQuantity(2, -1)).toBe(1);
  });

  it('nunca fica abaixo de 1', () => {
    expect(clampQuantity('1', -1)).toBe(1);
    expect(clampQuantity(5, -10)).toBe(1);
  });

  it('delta zero mantém o valor', () => {
    expect(clampQuantity(2, 0)).toBe(2);
  });
});
