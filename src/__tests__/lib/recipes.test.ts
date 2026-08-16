import { describe, it, expect } from 'vitest';
import { RECIPES, findRecipesByQuery } from '@/lib/recipes';

describe('findRecipesByQuery', () => {
  it('retorna vazio para query vazia', () => {
    expect(findRecipesByQuery('')).toEqual([]);
    expect(findRecipesByQuery('   ')).toEqual([]);
  });

  it('encontra receita por nome exato', () => {
    const results = findRecipesByQuery('bolo de chocolate');
    expect(results.map((r) => r.id)).toContain('bolo-de-chocolate');
  });

  it('encontra receita por palavra-chave', () => {
    const results = findRecipesByQuery('feijoada');
    expect(results.map((r) => r.id)).toContain('feijoada');
  });

  it('encontra receita por nome parcial', () => {
    const results = findRecipesByQuery('bolo');
    expect(results.map((r) => r.id)).toContain('bolo-de-chocolate');
  });

  it('retorna ingredientes para a receita encontrada', () => {
    const results = findRecipesByQuery('bolo de chocolate');
    expect(results.length).toBeGreaterThan(0);
    const recipe = results[0];
    expect(recipe.ingredients.some((i) => i.name === 'Farinha de trigo')).toBe(true);
    expect(recipe.ingredients.some((i) => i.name === 'Ovos')).toBe(true);
  });

  it('ignora acentos na busca', () => {
    const results = findRecipesByQuery('estrogonofe');
    expect(results.map((r) => r.id)).toContain('strogonoff');
  });

  it('retorna vazio para termo sem correspondência', () => {
    expect(findRecipesByQuery('xyz-inexistente')).toEqual([]);
  });
});

describe('RECIPES', () => {
  it('cada receita tem ingredientes com categoria válida', () => {
    const validCategories = [
      'hortifruti', 'laticinios', 'carnes', 'padaria', 'mercearia',
      'limpeza', 'higiene', 'bebidas', 'outros',
    ];

    for (const recipe of RECIPES) {
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      for (const ingredient of recipe.ingredients) {
        expect(validCategories).toContain(ingredient.category);
        expect(ingredient.quantity).toBeGreaterThan(0);
        expect(ingredient.unit).toBeTruthy();
      }
    }
  });
});
