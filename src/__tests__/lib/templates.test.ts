import { describe, it, expect } from 'vitest';
import { LIST_TEMPLATES, getTemplateById } from '@/lib/templates';

describe('LIST_TEMPLATES', () => {
  it('contém os 5 templates esperados', () => {
    expect(LIST_TEMPLATES).toHaveLength(5);
    expect(LIST_TEMPLATES.map((t) => t.id)).toEqual([
      'semana',
      'churrasco',
      'aniversario',
      'viagem',
      'fitness',
    ]);
  });

  it('cada template tem itens com categoria válida', () => {
    const validCategories = [
      'hortifruti', 'laticinios', 'carnes', 'padaria', 'mercearia',
      'limpeza', 'higiene', 'bebidas', 'outros',
    ];

    for (const template of LIST_TEMPLATES) {
      expect(template.items.length).toBeGreaterThan(0);
      for (const item of template.items) {
        expect(validCategories).toContain(item.category);
        expect(item.quantity).toBeGreaterThan(0);
        expect(item.unit).toBeTruthy();
      }
    }
  });
});

describe('getTemplateById', () => {
  it('retorna o template correto pelo id', () => {
    const template = getTemplateById('churrasco');
    expect(template?.name).toBe('Churrasco');
    expect(template?.icon).toBe('🍖');
  });

  it('retorna undefined para id inexistente', () => {
    expect(getTemplateById('nao-existe')).toBeUndefined();
  });
});
