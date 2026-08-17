import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { GET as getRecipeSuggestions } from '@/app/api/recipes/suggestions/route';

describe('GET /api/recipes/suggestions', () => {
  function callRecipeSuggestions(query = ''): Promise<Response> {
    const url = query ? `http://localhost/api/recipes/suggestions?q=${encodeURIComponent(query)}` : 'http://localhost/api/recipes/suggestions';
    return getRecipeSuggestions(new Request(url));
  }

  it('sem q → retorna sugestões vazias', async () => {
    const res = await callRecipeSuggestions('');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ suggestions: [] });
  });

  it('com q correspondendo a uma receita → retorna ingredientes', async () => {
    const res = await callRecipeSuggestions('bolo de chocolate');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestions.length).toBeGreaterThan(0);
    expect(body.suggestions.some((s: { name: string }) => s.name === 'Farinha de trigo')).toBe(true);
    expect(body.suggestions.some((s: { category: string }) => s.category === 'mercearia')).toBe(true);
  });

  it('cada sugestão tem categoria pré-definida', async () => {
    const res = await callRecipeSuggestions('feijoada');
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const suggestion of body.suggestions) {
      expect(suggestion.category).toBeTruthy();
      expect(suggestion.quantity).toBeGreaterThan(0);
      expect(suggestion.unit).toBeTruthy();
    }
  });

  it('busca é case-insensitive e ignora acentos', async () => {
    const res = await callRecipeSuggestions('ESTROGONOFE');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestions.length).toBeGreaterThan(0);
  });

  it('termo sem correspondência → sugestões vazias', async () => {
    const res = await callRecipeSuggestions('xyz-inexistente');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ suggestions: [] });
  });
});
