import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { GET } from '@/app/api/stats/compare/route';
import { clearRateLimitStore } from '@/lib/rate-limit';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('GET /api/stats/compare', () => {
  let createClientMock: Mock;

  beforeEach(() => {
    clearRateLimitStore();
    createClientMock = vi.mocked(createClient);
    createClientMock.mockReset();
  });

  it('retorna 401 quando não autenticado', async () => {
    const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) };
    const from = vi.fn(() => ({}));
    const mock = { auth, from };
    createClientMock.mockResolvedValue(mock as never);

    const res = await GET(new Request('http://localhost/api/stats/compare?monthA=2026-08&monthB=2026-07'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Não autenticado');
  });

  it('retorna 400 quando faltam parâmetros', async () => {
    const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) };
    const from = vi.fn(() => ({}));
    const mock = { auth, from };
    createClientMock.mockResolvedValue(mock as never);

    const res = await GET(new Request('http://localhost/api/stats/compare?monthA=2026-08'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Informe monthA e monthB no formato YYYY-MM');
  });

  it('retorna comparação vazia quando usuário não tem listas', async () => {
    const listsData: { id: string; month: string }[] = [];
    const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) };
    const from = vi.fn(function fromMock(_table: string) {
      if (_table === 'lists') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: listsData, error: null }),
          }),
        };
      }
      throw new Error(`Tabela não mockada: "${_table}"`);
    });
    const mock = { auth, from: from as unknown as Mock };
    createClientMock.mockResolvedValue(mock as never);

    const res = await GET(new Request('http://localhost/api/stats/compare?monthA=2026-08&monthB=2026-07'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalA).toBe(0);
    expect(body.totalB).toBe(0);
    expect(body.absoluteDifference).toBe(0);
    expect(body.items).toEqual([]);
  });

  it('retorna comparação com dados', async () => {
    const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) };
    const from = vi.fn(function fromMock(_table: string) {
      if (_table === 'lists') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { id: 'list-1', month: '2026-08' },
                { id: 'list-2', month: '2026-07' },
              ],
              error: null,
            }),
          }),
        };
      }
      if (_table === 'items') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { id: 'item-1', list_id: 'list-1', name: 'Arroz', completed: 1 },
                  { id: 'item-2', list_id: 'list-1', name: 'Feijão', completed: 1 },
                  { id: 'item-3', list_id: 'list-2', name: 'Arroz', completed: 1 },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (_table === 'prices') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                { item_id: 'item-1', value: 10, month: '2026-08' },
                { item_id: 'item-2', value: 5, month: '2026-08' },
                { item_id: 'item-3', value: 8, month: '2026-07' },
              ],
              error: null,
            }),
          }),
        };
      }
      throw new Error(`Tabela não mockada: "${_table}"`);
    });
    const mock = { auth, from: from as unknown as Mock };
    createClientMock.mockResolvedValue(mock as never);

    const res = await GET(new Request('http://localhost/api/stats/compare?monthA=2026-08&monthB=2026-07'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.monthA).toBe('2026-08');
    expect(body.monthB).toBe('2026-07');
    expect(body.totalA).toBe(15);
    expect(body.totalB).toBe(8);
    expect(body.absoluteDifference).toBe(-7);
    expect(body.percentageDifference).toBeCloseTo(-46.67, 1);
    expect(body.items.length).toBeGreaterThan(0);
  });
});
