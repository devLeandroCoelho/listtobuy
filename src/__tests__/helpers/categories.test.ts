import { describe, it, expect } from 'vitest';
import { CATEGORIES, guessCategoryByName, getCategoryById } from '@/lib/categories';

describe('guessCategoryByName', () => {
  it('retorna "outros" para nome vazio ou só espaços', () => {
    expect(guessCategoryByName('')).toBe('outros');
    expect(guessCategoryByName('   ')).toBe('outros');
  });

  it('retorna "outros" quando não há match de keyword', () => {
    expect(guessCategoryByName('lâmpada')).toBe('outros');
    expect(guessCategoryByName('furadeira')).toBe('outros');
  });

  it('faz match por substring, ignorando caixa e espaços nas pontas', () => {
    expect(guessCategoryByName('leite integral')).toBe('laticinios');
    expect(guessCategoryByName('  CAFÉ moído  ')).toBe('mercearia');
    expect(guessCategoryByName('Peito de Peru defumado')).toBe('laticinios');
    expect(guessCategoryByName('banana prata')).toBe('hortifruti');
  });

  it('match por keyword acentuada e sem acento', () => {
    expect(guessCategoryByName('pão francês')).toBe('padaria');
    expect(guessCategoryByName('acucar refinado')).toBe('mercearia');
    expect(guessCategoryByName('agua sanitaria')).toBe('limpeza');
  });
});

describe('getCategoryById', () => {
  it('retorna a configuração pelo id', () => {
    expect(getCategoryById('hortifruti').name).toBe('Hortifrúti');
    expect(getCategoryById('padaria').icon).toBe('🍞');
  });

  it('cai em "outros" para id desconhecido ou ausente', () => {
    expect(getCategoryById('categoria-antiga').id).toBe('outros');
    expect(getCategoryById(undefined).id).toBe('outros');
  });

  it('"outros" é a última categoria da lista (fallback estável)', () => {
    expect(CATEGORIES[CATEGORIES.length - 1].id).toBe('outros');
  });
});
