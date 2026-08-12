import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { POST as duplicateList } from '@/app/api/lists/[id]/duplicate/route';
import {
  createSupabaseMock,
  type SupabaseMock,
} from '@/__tests__/helpers/supabase';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const LIST_ID = 'list-123';
const BASE_URL = 'http://localhost';

describe('POST /api/lists/[id]/duplicate', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  const originalList = {
    id: LIST_ID,
    user_id: 'user-1',
    name: 'Compras',
    month: '2026-08',
    budget: 300,
  };

  beforeEach(() => {
    mock = createSupabaseMock({ lists: { data: originalList } });
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  function makePostRequest(body: unknown): Request {
    return new Request(`${BASE_URL}/api/lists/${LIST_ID}/duplicate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('mês com mês 13 → 400 e não cria lista', async () => {
    const res = await duplicateList(
      makePostRequest({ month: '2026-13' }),
      { params: Promise.resolve({ id: LIST_ID }) }
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: 'Mês inválido. Use o formato YYYY-MM com mês entre 01 e 12.',
    });
    expect(mock.mocks.insert).not.toHaveBeenCalled();
  });

  it('mês com mês 00 → 400 e não cria lista', async () => {
    const res = await duplicateList(
      makePostRequest({ month: '2026-00' }),
      { params: Promise.resolve({ id: LIST_ID }) }
    );

    expect(res.status).toBe(400);
    expect(mock.mocks.insert).not.toHaveBeenCalled();
  });

  it('formato de mês inválido → 400 e não cria lista', async () => {
    const res = await duplicateList(
      makePostRequest({ month: '2026-8' }),
      { params: Promise.resolve({ id: LIST_ID }) }
    );

    expect(res.status).toBe(400);
    expect(mock.mocks.insert).not.toHaveBeenCalled();
  });

  it('mês válido → 201 e cria com o mês informado', async () => {
    const res = await duplicateList(
      makePostRequest({ month: '2026-09' }),
      { params: Promise.resolve({ id: LIST_ID }) }
    );

    expect(res.status).toBe(201);
    expect(mock.mocks.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      name: 'Compras (Cópia)',
      month: '2026-09',
      budget: 300,
    });
  });

  it('copia a categoria dos itens no clone (null p/ itens sem categoria)', async () => {
    mock = createSupabaseMock({
      lists: { data: originalList },
      items: {
        data: [
          { id: 'item-1', list_id: LIST_ID, name: 'Maçã', quantity: 1, unit: 'un', category: 'hortifruti' },
          { id: 'item-2', list_id: LIST_ID, name: 'Arroz', quantity: 2, unit: 'kg', category: null },
        ],
      },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await duplicateList(
      makePostRequest({}),
      { params: Promise.resolve({ id: LIST_ID }) }
    );

    expect(res.status).toBe(201);
    // Primeiro insert é da lista clonada; segundo é o batch de itens
    expect(mock.mocks.itemsInsert).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'Maçã', category: 'hortifruti', completed: '0' }),
      expect.objectContaining({ name: 'Arroz', category: null, completed: '0' }),
    ]);
  });
});
