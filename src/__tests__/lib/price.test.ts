import { describe, expect, it } from 'vitest';
import { sanitizePriceInput, parsePrice } from '@/lib/price';

describe('sanitizePriceInput', () => {
  it('remove caracteres não numéricos exceto vírgula e ponto', () => {
    expect(sanitizePriceInput('R$ 12,50')).toBe('12,50');
    expect(sanitizePriceInput('12.50abc')).toBe('12.50');
    expect(sanitizePriceInput('abc12,50')).toBe('12,50');
  });

  it('limita a 2 casas decimais com vírgula', () => {
    expect(sanitizePriceInput('12,345')).toBe('12,34');
    expect(sanitizePriceInput('0,1')).toBe('0,1');
    expect(sanitizePriceInput('1,999')).toBe('1,99');
  });

  it('limita a 2 casas decimais com ponto', () => {
    expect(sanitizePriceInput('12.345')).toBe('12.34');
    expect(sanitizePriceInput('0.1')).toBe('0.1');
    expect(sanitizePriceInput('1.999')).toBe('1.99');
  });

  it('remove leading zeros do inteiro preservando 0 e 0,xx', () => {
    expect(sanitizePriceInput('0012,50')).toBe('12,50');
    expect(sanitizePriceInput('0,50')).toBe('0,50');
    expect(sanitizePriceInput('00')).toBe('0');
    expect(sanitizePriceInput('000123')).toBe('123');
  });

  it('remove pontos intermediários quando há vírgula (formato pt-BR)', () => {
    expect(sanitizePriceInput('1.234,56')).toBe('1234,56');
  });

  it('remove pontos intermediários quando há múltiplos pontos', () => {
    expect(sanitizePriceInput('1.234.56')).toBe('1234.56');
  });

  it('mantém entrada vazia ou só separador', () => {
    expect(sanitizePriceInput('')).toBe('');
    expect(sanitizePriceInput('.')).toBe('.');
    expect(sanitizePriceInput(',')).toBe(',');
  });
});

describe('parsePrice', () => {
  it('normaliza vírgula para ponto', () => {
    expect(parsePrice('12,50')).toBe(12.5);
    expect(parsePrice('1.234,56')).toBe(1234.56);
  });

  it('aceita ponto decimal', () => {
    expect(parsePrice('12.50')).toBe(12.5);
  });

  it('rejeita valores negativos', () => {
    expect(parsePrice('-5,00')).toBeNull();
    expect(parsePrice('-10.50')).toBeNull();
  });

  it('rejeita valores acima de 999999.99', () => {
    expect(parsePrice('1000000')).toBeNull();
    expect(parsePrice('999999.999')).toBeNull();
  });

  it('aceita valor zero', () => {
    expect(parsePrice('0')).toBe(0);
    expect(parsePrice('0,00')).toBe(0);
  });

  it('arredonda para 2 casas decimais', () => {
    expect(parsePrice('12,345')).toBe(12.35);
    expect(parsePrice('10.999')).toBe(11);
  });

  it('retorna null para entrada vazia ou inválida', () => {
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('abc')).toBeNull();
    expect(parsePrice('.')).toBeNull();
    expect(parsePrice(',')).toBeNull();
  });
});
