import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { GET } from '@/app/api/stats/route';
import { clearRateLimitStore } from '@/lib/rate-limit';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('GET /api/stats', () => {
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

    const res = await GET(new Request('http://localhost/api/stats'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Não autenticado');
  });

  it('retorna estatísticas vazias quando usuário não tem listas', async () => {
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

    const res = await GET(new Request('http://localhost/api/stats'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.monthly).toEqual([]);
    expect(body.topItems).toEqual([]);
    expect(body.averagePerList).toBe(0);
    expect(body.currentMonthTotal).toBe(0);
    expect(body.previousMonthTotal).toBe(0);
    expect(body.monthOverMonthChange).toBeNull();
  });

  it('retorna estatísticas completas com dados', async () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;

    const listsData = [
      { id: 'list-1', month: currentMonth },
      { id: 'list-2', month: previousMonth },
    ];
    const itemsData = [
      { id: 'item-1', list_id: 'list-1', name: 'Arroz', completed: 1 },
      { id: 'item-2', list_id: 'list-1', name: 'Feijão', completed: 1 },
      { id: 'item-3', list_id: 'list-2', name: 'Arroz', completed: 1 },
    ];
    const pricesData = [
      { item_id: 'item-1', value: 10, month: currentMonth },
      { item_id: 'item-2', value: 5, month: currentMonth },
      { item_id: 'item-3', value: 8, month: previousMonth },
    ];

    const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) };
    const from = vi.fn(function fromMock(_table: string) {
      if (_table === 'lists') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: listsData, error: null }),
          }),
        };
      }
      if (_table === 'items') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: itemsData, error: null }),
            }),
          }),
        };
      }
      if (_table === 'prices') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: pricesData, error: null }),
          }),
        };
      }
      throw new Error(`Tabela não mockada: "${_table}"`);
    });
    const mock = { auth, from: from as unknown as Mock };
    createClientMock.mockResolvedValue(mock as never);

    const res = await GET(new Request('http://localhost/api/stats'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.monthly.length).toBe(2);
    expect(body.topItems.length).toBeGreaterThan(0);
    expect(body.averagePerList).toBeGreaterThan(0);
    expect(body.currentMonthTotal).toBe(15);
    expect(body.previousMonthTotal).toBe(8);
    expect(body.monthOverMonthChange).toBeCloseTo(87.5, 1);
  });
});
