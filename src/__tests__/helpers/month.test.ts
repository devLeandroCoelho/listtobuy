import { describe, expect, it } from 'vitest';
import { isValidMonth } from '@/lib/month';

describe('isValidMonth', () => {
  it('aceita meses válidos no formato YYYY-MM', () => {
    expect(isValidMonth('2026-01')).toBe(true);
    expect(isValidMonth('2026-08')).toBe(true);
    expect(isValidMonth('2026-12')).toBe(true);
  });

  it('rejeita mês 00 e mês 13', () => {
    expect(isValidMonth('2026-00')).toBe(false);
    expect(isValidMonth('2026-13')).toBe(false);
  });

  it('rejeita formatos inválidos', () => {
    expect(isValidMonth('2026-8')).toBe(false);
    expect(isValidMonth('26-08')).toBe(false);
    expect(isValidMonth('2026-08-01')).toBe(false);
    expect(isValidMonth('agosto')).toBe(false);
    expect(isValidMonth('')).toBe(false);
  });
});
