import { describe, expect, it } from 'vitest';
import {
  normalizeCompleted,
  serializeItem,
  serializeItems,
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
  it('number 0 → completed "0" string e demais campos preservados', () => {
    expect(serializeItem(item('i1', 'Arroz', 0))).toEqual({
      id: 'i1',
      name: 'Arroz',
      completed: '0',
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

describe('serializeItems', () => {
  it('normaliza todos os itens da lista', () => {
    const result = serializeItems([item('i1', 'Arroz', 0), item('i2', 'Feijão', 1)]);
    expect(result.map((i) => i.completed)).toEqual(['0', '1']);
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
