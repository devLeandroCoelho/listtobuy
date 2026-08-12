import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { GET as getSuggestions } from '@/app/api/items/suggestions/route';
import {
  createSupabaseMock,
  type SupabaseMock,
} from '@/__tests__/helpers/supabase';

// Mocka o módulo do Supabase server client (usa next/headers, indisponível
// fora do runtime do Next). Os route handlers recebem o mock via createClient().
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const BASE_URL = 'http://localhost/api/items/suggestions';

type HistoryItem = { name: string; created_at: string };

describe('GET /api/items/suggestions', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    mock = createSupabaseMock();
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  function callSuggestions(query = ''): Promise<Response> {
    return getSuggestions(new Request(`${BASE_URL}${query}`));
  }

  it('sem autenticação → 401', async () => {
    mock = createSupabaseMock({ user: null });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callSuggestions('?q=arroz');

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Não autenticado' });
  });

  it('sem q → retorna histórico recente sem aplicar filtro ilike', async () => {
    const history: HistoryItem[] = [
      { name: 'Arroz', created_at: '2026-08-10T10:00:00Z' },
      { name: 'Feijão', created_at: '2026-08-09T10:00:00Z' },
    ];
    mock = createSupabaseMock({ items: { data: history } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callSuggestions();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      suggestions: [
        { name: 'Arroz', last_used: '2026-08-10T10:00:00Z' },
        { name: 'Feijão', last_used: '2026-08-09T10:00:00Z' },
      ],
    });
    expect(mock.mocks.ilike).not.toHaveBeenCalled();
    expect(mock.mocks.itemsOrder).toHaveBeenCalledWith(80); // limit default 8 → fetch cap 8*10
  });

  it('com q → filtra por ilike literal e aplica limit default', async () => {
    mock = createSupabaseMock({
      items: { data: [{ name: 'Arroz Integral', created_at: '2026-08-10T10:00:00Z' }] },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callSuggestions('?q=arroz');

    expect(res.status).toBe(200);
    expect(mock.mocks.ilike).toHaveBeenCalledWith('name', '%arroz%');
    expect(mock.mocks.itemsOrder).toHaveBeenCalledWith(80);
    expect((await res.json()).suggestions).toHaveLength(1);
  });

  it('dedup: duplicatas viram 1 sugestão com last_used do mais recente', async () => {
    const history: HistoryItem[] = [
      { name: 'Arroz', created_at: '2026-08-10T10:00:00Z' },
      { name: 'Arroz', created_at: '2026-08-01T10:00:00Z' },
      { name: 'Feijão', created_at: '2026-07-20T10:00:00Z' },
      { name: 'Feijão', created_at: '2026-07-01T10:00:00Z' },
    ];
    mock = createSupabaseMock({ items: { data: history } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callSuggestions();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      suggestions: [
        { name: 'Arroz', last_used: '2026-08-10T10:00:00Z' },
        { name: 'Feijão', last_used: '2026-07-20T10:00:00Z' },
      ],
    });
  });

  it('itens sem nome são ignorados no dedup', async () => {
    const history: (HistoryItem | { name: null; created_at: string })[] = [
      { name: 'Arroz', created_at: '2026-08-10T10:00:00Z' },
      { name: null, created_at: '2026-08-09T10:00:00Z' },
    ];
    mock = createSupabaseMock({ items: { data: history } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callSuggestions();

    expect((await res.json()).suggestions).toEqual([
      { name: 'Arroz', last_used: '2026-08-10T10:00:00Z' },
    ]);
  });

  it('escapa wildcards do q (ex.: "50%") para busca literal', async () => {
    mock = createSupabaseMock({ items: { data: [] } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callSuggestions('?q=50%25');

    expect(res.status).toBe(200);
    // "50%" → escape de % → "50\%" → padrão ILIKE "%50\%%" (literal, não coringa)
    expect(mock.mocks.ilike).toHaveBeenCalledWith('name', '%50\\%%');
  });

  it('clamp de limit: 999 → 20, -5 → 1, 0 → 1, inválido → default 8', async () => {
    mock = createSupabaseMock({ items: { data: [] } });
    createClientMock.mockResolvedValue(mock as never);

    await callSuggestions('?limit=999');
    await callSuggestions('?limit=-5');
    await callSuggestions('?limit=0');
    await callSuggestions('?limit=abc');

    // fetch cap = limit clampado * 10
    expect(mock.mocks.itemsOrder).toHaveBeenNthCalledWith(1, 200); // 20 * 10
    expect(mock.mocks.itemsOrder).toHaveBeenNthCalledWith(2, 10); // 1 * 10
    expect(mock.mocks.itemsOrder).toHaveBeenNthCalledWith(3, 10); // 1 * 10
    expect(mock.mocks.itemsOrder).toHaveBeenNthCalledWith(4, 80); // default 8 * 10
  });

  it('histórico vazio → 200 com suggestions vazio', async () => {
    mock = createSupabaseMock({ items: { data: [] } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callSuggestions('?q=arroz');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ suggestions: [] });
  });
});
