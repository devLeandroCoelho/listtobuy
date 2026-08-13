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

  it('match por PALAVRA INTEIRA — não casa substring dentro de outra palavra', () => {
    // 'salsa' (hortifruti) NÃO deve casar 'salsicha' (carnes)
    expect(guessCategoryByName('salsicha')).toBe('carnes');
    expect(guessCategoryByName('salsicha de peru')).toBe('carnes');
    // 'sal' (mercearia) NÃO deve casar 'salame' (laticínios) nem 'salmão' (carnes)
    expect(guessCategoryByName('salame')).toBe('laticinios');
    expect(guessCategoryByName('salmão')).toBe('carnes');
    // mas 'sal' como palavra completa continua casando mercearia
    expect(guessCategoryByName('sal grosso')).toBe('mercearia');
    // 'salsa' continua em hortifruti
    expect(guessCategoryByName('salsa')).toBe('hortifruti');
  });

  it('keyword espinafre corrigida (typo antigo espinhafre)', () => {
    expect(guessCategoryByName('espinafre')).toBe('hortifruti');
    expect(guessCategoryByName('maço de espinafre')).toBe('hortifruti');
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
