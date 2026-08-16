import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { GET as getHistory } from '@/app/api/prices/history/route';
import {
  createSupabaseMock,
  type SupabaseMock,
} from '@/__tests__/helpers/supabase';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const ITEM_ID = 'item-1';
const LIST_ID = 'list-123';
const BASE_URL = 'http://localhost';

describe('GET /api/prices/history (ownership, issue #79)', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    mock = createSupabaseMock();
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  function makeGetRequest(itemId?: string): Request {
    const url = itemId
      ? `${BASE_URL}/api/prices/history?item_id=${itemId}`
      : `${BASE_URL}/api/prices/history`;
    return new Request(url);
  }

  it('item pertence a lista do usuário → 200 com histórico', async () => {
    mock = createSupabaseMock({
      items: { data: { id: ITEM_ID, list_id: LIST_ID } },
      lists: { data: { id: LIST_ID } },
      prices: {
        data: [
          { id: 'p1', item_id: ITEM_ID, value: '5.50', month: '2026-08' },
          { id: 'p2', item_id: ITEM_ID, value: '4.00', month: '2026-07' },
        ],
      },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await getHistory(makeGetRequest(ITEM_ID));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].month).toBe('2026-08');
  });

  it('sem autenticação → 401', async () => {
    mock = createSupabaseMock({ user: null });
    createClientMock.mockResolvedValue(mock as never);

    const res = await getHistory(makeGetRequest(ITEM_ID));
    expect(res.status).toBe(401);
  });

  it('item_id ausente → 400', async () => {
    const res = await getHistory(makeGetRequest());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'item_id obrigatório' });
  });

  it('item existe mas não pertence ao usuário (lista não encontrada) → 403', async () => {
    // O item é encontrado, mas sua lista não pertence ao usuário autenticado
    mock = createSupabaseMock({
      items: { data: { id: ITEM_ID, list_id: 'outra-lista' } },
      lists: { data: null },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await getHistory(makeGetRequest(ITEM_ID));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({ error: 'Sem permissão para este item' });
  });
});
