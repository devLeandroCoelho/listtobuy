import { describe, expect, it } from 'vitest';
import {
  buildQuickAddPayload,
  normalizeCompleted,
  normalizePrice,
  serializeItem,
  serializeItems,
  serializePriceRow,
  serializePriceRows,
  splitByCompleted,
  type ItemLike,
} from '@/lib/list-items';

interface TestItem extends ItemLike {
  id: string;
  name: string;
}

const item = (id: string, name: string, completed?: number | string | null): TestItem => ({
  id,
  name,
  ...(completed !== undefined ? { completed } : {}),
});

describe('normalizeCompleted', () => {
  it('converte number 0 → "0" (banco NUMERIC)', () => {
    expect(normalizeCompleted(0)).toBe('0');
  });

  it('converte number 1 → "1" (banco NUMERIC)', () => {
    expect(normalizeCompleted(1)).toBe('1');
  });

  it('mantém string "0" e "1" (contrato do client)', () => {
    expect(normalizeCompleted('0')).toBe('0');
    expect(normalizeCompleted('1')).toBe('1');
  });

  it('undefined/null → "0" (default do banco, contrato sempre válido)', () => {
    expect(normalizeCompleted(undefined)).toBe('0');
    expect(normalizeCompleted(null)).toBe('0');
  });

  it('valor inesperado → "0" (pendente, não derruba o contrato)', () => {
    expect(normalizeCompleted('true')).toBe('0');
    expect(normalizeCompleted(42)).toBe('0');
  });
});

describe('serializeItem', () => {
  it('number 0 → completed "0" string, price null e demais campos preservados', () => {
    expect(serializeItem(item('i1', 'Arroz', 0))).toEqual({
      id: 'i1',
      name: 'Arroz',
      completed: '0',
      price: null,
      reminderDate: null,
      reminderNotified: '0',
    });
    expect(typeof serializeItem(item('i1', 'Arroz', 0)).completed).toBe('string');
  });

  it('number 1 → completed "1" string', () => {
    expect(serializeItem(item('i2', 'Feijão', 1)).completed).toBe('1');
  });

  it('string "0"/"1" → mantém "0"/"1" (idempotente)', () => {
    expect(serializeItem(item('i3', 'X', '0')).completed).toBe('0');
    expect(serializeItem(item('i4', 'Y', '1')).completed).toBe('1');
  });

  it('sem completed → "0"', () => {
    expect(serializeItem(item('i5', 'Z')).completed).toBe('0');
  });
});

describe('normalizePrice (contrato number | null, issue #56)', () => {
  it('string "5.50" (PostgREST numeral alto) → number 5.5', () => {
    expect(normalizePrice('5.50')).toBe(5.5);
  });

  it('number nativo (PostgREST baixa precisão) → mantém', () => {
    expect(normalizePrice(5.5)).toBe(5.5);
  });

  it('zero é preço válido → 0', () => {
    expect(normalizePrice(0)).toBe(0);
    expect(normalizePrice('0.00')).toBe(0);
  });

  it('null/undefined → null (item sem preço)', () => {
    expect(normalizePrice(null)).toBeNull();
    expect(normalizePrice(undefined)).toBeNull();
  });

  it('string vazia / não-numérico → null (não vira NaN na soma)', () => {
    expect(normalizePrice('')).toBeNull();
    expect(normalizePrice('abc')).toBeNull();
    expect(normalizePrice(NaN)).toBeNull();
    expect(normalizePrice(Infinity)).toBeNull();
  });
});

describe('serializeItem — contrato de price na fronteira (issue #56)', () => {
  it('price string "5.50" → sai como number 5.5 na resposta', () => {
    const serialized = serializeItem({ id: 'i1', name: 'Arroz', completed: 1, price: '5.50', reminderDate: null, reminderNotified: '0' });
    expect(serialized.price).toBe(5.5);
    expect(typeof serialized.price).toBe('number');
  });

  it('item comprado SEM preço → price: null (não quebra a soma)', () => {
    const serialized = serializeItem({ id: 'i2', name: 'Feijão', completed: 1, reminderDate: null, reminderNotified: '0' });
    expect(serialized.price).toBeNull();
  });

  it('REGRESSÃO #56: soma do orçamento funciona com itens serializados', () => {
    // Caminho real: GET /api/lists/[id] → serializeItems + price merge (number)
    const items = serializeItems([
      { id: 'i1', name: 'Arroz', completed: 1, price: '5.50', reminderDate: null, reminderNotified: '0' }, // comprado, preço string do PostgREST
      { id: 'i2', name: 'Feijão', completed: 1, price: 3.25, reminderDate: null, reminderNotified: '0' }, // comprado, preço number
      { id: 'i3', name: 'Sal', completed: 0, price: '1.00', reminderDate: null, reminderNotified: '0' }, // pendente, não conta
      { id: 'i4', name: 'Açúcar', completed: 1, reminderDate: null, reminderNotified: '0' }, // comprado SEM preço → null
    ]);

    // Mesma fórmula do frontend (src/app/dashboard/lists/[id]/page.tsx:617-619)
    const totalSpent = items
      .filter((i) => i.completed === '1' && i.price)
      .reduce((sum, i) => sum + (i.price ?? 0), 0);

    expect(totalSpent).toBe(8.75); // 5.5 + 3.25 — sem concatenação, sem quebrar no item sem preço
    expect(typeof totalSpent).toBe('number');
  });
});

describe('serializePriceRow / serializePriceRows (GET/POST /api/prices)', () => {
  it('value string "5.50" → number 5.5', () => {
    expect(serializePriceRow({ id: 'p1', item_id: 'i1', value: '5.50', month: '2026-08' })).toEqual({
      id: 'p1',
      item_id: 'i1',
      value: 5.5,
      month: '2026-08',
    });
  });

  it('value number nativo → mantém', () => {
    expect(serializePriceRow({ id: 'p1', value: 9.99 })).toEqual({ id: 'p1', value: 9.99 });
  });

  it('normaliza lista inteira e preserva demais campos', () => {
    const rows = [
      { id: 'p1', value: '5.50', month: '2026-08' },
      { id: 'p2', value: 7.1, month: '2026-07' },
    ];
    expect(serializePriceRows(rows).map((r) => r.value)).toEqual([5.5, 7.1]);
  });
});

describe('serializeItems', () => {
  it('normaliza todos os itens da lista', () => {
    const result = serializeItems([item('i1', 'Arroz', 0), item('i2', 'Feijão', 1)]);
    expect(result.map((i) => i.completed)).toEqual(['0', '1']);
    expect(result.map((i) => i.reminderNotified)).toEqual(['0', '0']);
    expect(result.map((i) => i.reminderDate)).toEqual([null, null]);
  });
});

describe('splitByCompleted', () => {
  it('classifica corretamente com completed como number 0/1 (banco)', () => {
    const result = splitByCompleted([
      item('i1', 'Arroz', 0),
      item('i2', 'Feijão', 1),
      item('i3', 'Sal', 0),
    ]);

    expect(result.pending.map((i) => i.id)).toEqual(['i1', 'i3']);
    expect(result.completed.map((i) => i.id)).toEqual(['i2']);
  });

  it('classifica corretamente com completed como string "0"/"1" (contrato)', () => {
    const result = splitByCompleted([
      item('i1', 'Arroz', '0'),
      item('i2', 'Feijão', '1'),
    ]);

    expect(result.pending.map((i) => i.id)).toEqual(['i1']);
    expect(result.completed.map((i) => i.id)).toEqual(['i2']);
  });

  it('itens sem completed caem em pendentes', () => {
    const result = splitByCompleted([item('i1', 'Arroz')]);
    expect(result.pending.map((i) => i.id)).toEqual(['i1']);
    expect(result.completed).toEqual([]);
  });

  it('lista vazia → ambos os lados vazios', () => {
    const result = splitByCompleted([]);
    expect(result.pending).toEqual([]);
    expect(result.completed).toEqual([]);
  });
});

describe('buildQuickAddPayload (barra de base — quick-add estilo Listonic)', () => {
  it('usa defaults quantity 1 e unit "un"', () => {
    expect(buildQuickAddPayload('Leite')).toEqual({ name: 'Leite', quantity: 1, unit: 'un' });
  });

  it('mantém o nome como enviado (trim é responsabilidade da página)', () => {
    expect(buildQuickAddPayload('Arroz Integral').name).toBe('Arroz Integral');
  });

  it('NÃO envia price nem category no payload', () => {
    const payload = buildQuickAddPayload('Feijão');
    expect(payload).not.toHaveProperty('price');
    expect(payload).not.toHaveProperty('category');
  });
});
