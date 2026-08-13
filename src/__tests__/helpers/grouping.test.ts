import { describe, it, expect } from 'vitest';
import { groupItemsByCategory, resolveItemCategory } from '@/lib/grouping';

interface TestItem {
  id: string;
  name: string;
  category?: string | null;
}

const item = (name: string, category?: string | null): TestItem => ({
  id: `id-${name}`,
  name,
  category,
});

describe('resolveItemCategory', () => {
  it('usa a categoria persistida quando existir', () => {
    expect(resolveItemCategory(item('Maçã', 'bebidas'))).toBe('bebidas');
  });

  it('adivinha pelo nome quando a categoria é null', () => {
    expect(resolveItemCategory(item('Leite', null))).toBe('laticinios');
  });

  it('adivinha pelo nome quando a categoria é undefined', () => {
    expect(resolveItemCategory(item('Café'))).toBe('mercearia');
  });
});

describe('groupItemsByCategory', () => {
  it('agrupa itens por categoria na ordem das seções (CATEGORIES)', () => {
    const groups = groupItemsByCategory([
      item('Pão'), // padaria (por nome)
      item('Maçã'), // hortifruti (por nome)
      item('Leite', 'bebidas'), // bebidas (persistida)
    ]);

    expect(groups.map((g) => g.categoryId)).toEqual(['hortifruti', 'padaria', 'bebidas']);
  });

  it('omite grupos vazios', () => {
    const groups = groupItemsByCategory([item('Maçã')]);
    expect(groups).toHaveLength(1);
    expect(groups[0].categoryId).toBe('hortifruti');
    expect(groups[0].items).toHaveLength(1);
  });

  it('categoria persistida sobrepõe a adivinhação pelo nome', () => {
    const groups = groupItemsByCategory([item('Maçã', 'bebidas')]);
    expect(groups[0].categoryId).toBe('bebidas');
    expect(groups[0].items[0].name).toBe('Maçã');
  });

  it('itens sem match de nome vão para "outros"', () => {
    const groups = groupItemsByCategory([item('lâmpada')]);
    expect(groups).toHaveLength(1);
    expect(groups[0].categoryId).toBe('outros');
  });

  it('id de categoria desconhecido (dado antigo) cai em "outros" sem derrubar o item', () => {
    const groups = groupItemsByCategory([item('X', 'categoria-antiga')]);
    expect(groups).toHaveLength(1);
    expect(groups[0].categoryId).toBe('outros');
    expect(groups[0].items[0].name).toBe('X');
  });

  it('retorna lista vazia para itens vazios', () => {
    expect(groupItemsByCategory([])).toEqual([]);
  });
});
