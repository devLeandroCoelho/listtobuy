import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { GET as getPrices, POST as savePrice } from '@/app/api/prices/route';
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

describe('GET /api/prices?item_id= (contrato de value, issue #56)', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    mock = createSupabaseMock();
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  function makeGetRequest(itemId: string): Request {
    return new Request(`${BASE_URL}/api/prices?item_id=${itemId}`);
  }

  it('REGRESSÃO #56: value string "5.50" (PostgREST numeral alto) → number 5.5 na resposta', async () => {
    mock = createSupabaseMock({
      prices: {
        data: [{ id: 'p1', item_id: ITEM_ID, value: '5.50', month: '2026-08' }],
      },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await getPrices(makeGetRequest(ITEM_ID));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.prices[0].value).toBe(5.5);
    expect(typeof body.prices[0].value).toBe('number');
    // demais campos preservados
    expect(body.prices[0].month).toBe('2026-08');
  });

  it('value number nativo (baixa precisão) → mantém number', async () => {
    mock = createSupabaseMock({
      prices: {
        data: [{ id: 'p2', item_id: ITEM_ID, value: 3.25, month: '2026-07' }],
      },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await getPrices(makeGetRequest(ITEM_ID));
    const body = await res.json();

    expect(body.prices[0].value).toBe(3.25);
    expect(typeof body.prices[0].value).toBe('number');
  });

  it('sem preço registrado → lista vazia', async () => {
    const res = await getPrices(makeGetRequest(ITEM_ID));
    expect(await res.json()).toEqual({ prices: [] });
  });

  it('não autenticado → 401', async () => {
    mock = createSupabaseMock({ user: null });
    createClientMock.mockResolvedValue(mock as never);

    const res = await getPrices(makeGetRequest(ITEM_ID));
    expect(res.status).toBe(401);
  });
});

describe('POST /api/prices (contrato de value na resposta)', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    mock = createSupabaseMock({
      // Item existe e pertence a lista do usuário (checks de ownership)
      items: { data: { id: ITEM_ID, list_id: LIST_ID } },
      lists: { data: { id: LIST_ID } },
    });
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  function makePostRequest(body: unknown): Request {
    return new Request(`${BASE_URL}/api/prices`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('REGRESSÃO #56: resposta 201 com value normalizado p/ number (string no banco → number)', async () => {
    mock = createSupabaseMock({
      items: { data: { id: ITEM_ID, list_id: LIST_ID } },
      lists: { data: { id: LIST_ID } },
      prices: {
        // PostgREST devolve NUMERIC como string em numeral alto
        data: { id: 'p1', item_id: ITEM_ID, value: '5.50', month: '2026-08' },
      },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await savePrice(
      makePostRequest({ item_id: ITEM_ID, value: 5.5, month: '2026-08' })
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.price.value).toBe(5.5);
    expect(typeof body.price.value).toBe('number');
    // upsert persiste number, não string
    expect(mock.mocks.pricesUpsert).toHaveBeenCalledWith(
      { item_id: ITEM_ID, value: 5.5, month: '2026-08' },
      { onConflict: 'item_id,month' }
    );
  });

  it('valor inválido (negativo) → 400', async () => {
    const res = await savePrice(
      makePostRequest({ item_id: ITEM_ID, value: -1, month: '2026-08' })
    );
    expect(res.status).toBe(400);
  });
});
