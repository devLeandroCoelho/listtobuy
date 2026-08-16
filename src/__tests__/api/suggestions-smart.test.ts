import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { GET as getSmartSuggestions } from '@/app/api/suggestions/route';
import {
  createSupabaseMock,
  type SupabaseMock,
} from '@/__tests__/helpers/supabase';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const BASE_URL = 'http://localhost/api/suggestions';

type PurchaseItem = { name: string; created_at: string };

describe('GET /api/suggestions', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    mock = createSupabaseMock();
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  function callSuggestions(query = ''): Promise<Response> {
    return getSmartSuggestions(new Request(`${BASE_URL}${query}`));
  }

  it('sem autenticação → 401', async () => {
    mock = createSupabaseMock({ user: null });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callSuggestions('?q=arroz');

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Não autenticado' });
  });

  it('com itens comprados → retorna sugestões ordenadas por frequência e última compra', async () => {
    const items: PurchaseItem[] = [
      { name: 'Arroz', created_at: '2026-08-10T10:00:00Z' },
      { name: 'Feijão', created_at: '2026-08-09T10:00:00Z' },
      { name: 'Arroz', created_at: '2026-08-01T10:00:00Z' },
      { name: 'Arroz', created_at: '2026-07-20T10:00:00Z' },
      { name: 'Feijão', created_at: '2026-07-15T10:00:00Z' },
    ];
    mock = createSupabaseMock({ items: { data: items } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callSuggestions();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.suggestions).toHaveLength(2);
    expect(json.suggestions[0]).toEqual({
      name: 'Arroz',
      frequency: 3,
      last_purchase: '2026-08-10T10:00:00Z',
    });
    expect(json.suggestions[1]).toEqual({
      name: 'Feijão',
      frequency: 2,
      last_purchase: '2026-08-09T10:00:00Z',
    });
  });

  it('com q → filtra por nome antes do ranking', async () => {
    const items: PurchaseItem[] = [
      { name: 'Arroz Integral', created_at: '2026-08-10T10:00:00Z' },
      { name: 'Arroz', created_at: '2026-08-01T10:00:00Z' },
    ];
    mock = createSupabaseMock({ items: { data: items } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callSuggestions('?q=arroz');
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.suggestions).toHaveLength(2);
    expect(mock.mocks.ilike).toHaveBeenCalledWith('name', '%arroz%');
  });

  it('empate em frequência → desempate por última compra DESC', async () => {
    const items: PurchaseItem[] = [
      { name: 'Feijão', created_at: '2026-08-15T10:00:00Z' },
      { name: 'Arroz', created_at: '2026-08-14T10:00:00Z' },
    ];
    mock = createSupabaseMock({ items: { data: items } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callSuggestions();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.suggestions[0].name).toBe('Feijão');
    expect(json.suggestions[1].name).toBe('Arroz');
  });

  it('escapa wildcards do q', async () => {
    mock = createSupabaseMock({ items: { data: [] } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callSuggestions('?q=50%25');

    expect(res.status).toBe(200);
    expect(mock.mocks.ilike).toHaveBeenCalledWith('name', '%50\\%%');
  });

  it('clamp de limit → fetch cap sempre é FETCH_CAP', async () => {
    mock = createSupabaseMock({ items: { data: [] } });
    createClientMock.mockResolvedValue(mock as never);

    await callSuggestions('?limit=999');
    await callSuggestions('?limit=-5');
    await callSuggestions('?limit=0');
    await callSuggestions('?limit=abc');

    expect(mock.mocks.itemsOrder).toHaveBeenNthCalledWith(1, 500);
    expect(mock.mocks.itemsOrder).toHaveBeenNthCalledWith(2, 500);
    expect(mock.mocks.itemsOrder).toHaveBeenNthCalledWith(3, 500);
    expect(mock.mocks.itemsOrder).toHaveBeenNthCalledWith(4, 500);
  });

  it('histórico vazio → 200 com suggestions vazio', async () => {
    mock = createSupabaseMock({ items: { data: [] } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callSuggestions('?q=arroz');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ suggestions: [] });
  });

  it('itens sem nome são ignorados', async () => {
    const items: (PurchaseItem | { name: null; created_at: string })[] = [
      { name: 'Arroz', created_at: '2026-08-10T10:00:00Z' },
      { name: null, created_at: '2026-08-09T10:00:00Z' },
    ];
    mock = createSupabaseMock({ items: { data: items } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callSuggestions();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.suggestions).toEqual([
      { name: 'Arroz', frequency: 1, last_purchase: '2026-08-10T10:00:00Z' },
    ]);
  });

  it('erro do banco → 500', async () => {
    mock = createSupabaseMock({ items: { data: null, error: new Error('DB error') } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callSuggestions();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'DB error' });
  });
});
