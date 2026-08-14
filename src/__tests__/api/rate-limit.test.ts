import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { POST as createList } from '@/app/api/lists/route';
import { POST as savePrice } from '@/app/api/prices/route';
import { POST as shareList, DELETE as deleteShare } from '@/app/api/shares/route';
import {
  checkRateLimit,
  enforceRateLimit,
  rateLimitResponse,
  resetRateLimitStore,
  RATE_LIMITS,
} from '@/lib/rate-limit';
import {
  createSupabaseMock,
  type SupabaseMock,
} from '@/__tests__/helpers/supabase';

// Mocka o módulo do Supabase server client (mesmo padrão dos demais testes de API).
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const BASE_URL = 'http://localhost';
const NOW = 1_700_000_000_000;

describe('checkRateLimit (janela fixa)', () => {
  beforeEach(() => resetRateLimitStore());

  it('permite até max requisições e bloqueia a partir daí', () => {
    const cfg = { windowMs: 60_000, max: 3 };

    expect(checkRateLimit('user-1', cfg, NOW).ok).toBe(true);
    expect(checkRateLimit('user-1', cfg, NOW + 1).ok).toBe(true);
    expect(checkRateLimit('user-1', cfg, NOW + 2).ok).toBe(true);

    const blocked = checkRateLimit('user-1', cfg, NOW + 3);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBe(60);
  });

  it('relata remaining decrescente dentro da janela', () => {
    const cfg = { windowMs: 60_000, max: 10 };

    expect(checkRateLimit('user-1', cfg, NOW).remaining).toBe(9);
    expect(checkRateLimit('user-1', cfg, NOW + 1).remaining).toBe(8);
  });

  it('janela expirada libera o usuário de novo', () => {
    const cfg = { windowMs: 60_000, max: 2 };

    checkRateLimit('user-1', cfg, NOW);
    checkRateLimit('user-1', cfg, NOW + 1);
    expect(checkRateLimit('user-1', cfg, NOW + 2).ok).toBe(false);

    // Após windowMs, o bucket reinicia
    const after = checkRateLimit('user-1', cfg, NOW + 60_000);
    expect(after.ok).toBe(true);
    expect(after.remaining).toBe(1);
  });

  it('buckets independentes por chave (usuários não se afetam)', () => {
    const cfg = { windowMs: 60_000, max: 1 };

    expect(checkRateLimit('user-1', cfg, NOW).ok).toBe(true);
    expect(checkRateLimit('user-2', cfg, NOW).ok).toBe(true);
    expect(checkRateLimit('user-1', cfg, NOW + 1).ok).toBe(false);
    expect(checkRateLimit('user-2', cfg, NOW + 1).ok).toBe(false);
  });

  it('resetRateLimitStore zera os buckets', () => {
    const cfg = { windowMs: 60_000, max: 1 };

    expect(checkRateLimit('user-1', cfg, NOW).ok).toBe(true);
    expect(checkRateLimit('user-1', cfg, NOW + 1).ok).toBe(false);

    resetRateLimitStore();
    expect(checkRateLimit('user-1', cfg, NOW + 2).ok).toBe(true);
  });
});

describe('enforceRateLimit + rateLimitResponse', () => {
  beforeEach(() => resetRateLimitStore());

  it('retorna null enquanto o usuário está dentro do limite', () => {
    expect(enforceRateLimit('user-1', RATE_LIMITS['lists:create'])).toBeNull();
  });

  it('retorna resposta 429 com Retry-After ao estourar o limite', async () => {
    const cfg = { windowMs: 60_000, max: 1 };

    enforceRateLimit('user-1', cfg);
    const limited = enforceRateLimit('user-1', cfg);

    expect(limited).not.toBeNull();
    expect(limited!.status).toBe(429);
    expect(limited!.headers.get('Retry-After')).toBe('60');
    expect(await limited!.json()).toEqual({
      error: 'Muitas requisições. Tente novamente em instantes.',
    });
  });

  it('rateLimitResponse expõe o retryAfter em segundos', async () => {
    const res = rateLimitResponse({ ok: false, remaining: 0, retryAfter: 7 });
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('7');
  });
});

describe('rate limit aplicado nas rotas de escrita', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    resetRateLimitStore();
    mock = createSupabaseMock();
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  function makeRequest(url: string, body?: unknown, method = 'POST'): Request {
    return new Request(`${BASE_URL}${url}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  it('POST /api/lists bloqueia após 30 requisições sem tocar no banco', async () => {
    for (let i = 0; i < 30; i++) {
      const res = await createList(
        makeRequest('/api/lists', { name: `Lista ${i}`, month: '2026-08' })
      );
      expect(res.status).toBe(201);
    }

    const blocked = await createList(
      makeRequest('/api/lists', { name: 'Lista 31', month: '2026-08' })
    );
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({
      error: 'Muitas requisições. Tente novamente em instantes.',
    });
    // O insert NÃO foi chamado na requisição bloqueada (só nas 30 anteriores)
    expect(mock.mocks.insert).toHaveBeenCalledTimes(30);
  });

  it('POST /api/prices bloqueia após 30 requisições', async () => {
    mock = createSupabaseMock({
      user: { id: 'user-1' },
      items: { data: { id: 'item-1', list_id: 'list-1' } },
      lists: { data: { id: 'list-1', user_id: 'user-1' } },
      prices: { data: { item_id: 'item-1', value: 10, month: '2026-08' } },
    });
    createClientMock.mockResolvedValue(mock as never);

    for (let i = 0; i < 30; i++) {
      const res = await savePrice(
        makeRequest('/api/prices', { item_id: 'item-1', value: 10, month: '2026-08' })
      );
      expect(res.status).toBe(201);
    }

    const blocked = await savePrice(
      makeRequest('/api/prices', { item_id: 'item-1', value: 10, month: '2026-08' })
    );
    expect(blocked.status).toBe(429);
  });

  it('POST /api/shares bloqueia após 10 requisições (anti-abuso)', async () => {
    mock = createSupabaseMock({
      user: { id: 'user-1' },
      lists: { data: { id: 'list-1', user_id: 'user-1' } },
      users: { data: { id: 'user-2' } },
      list_shares: { data: null },
    });
    createClientMock.mockResolvedValue(mock as never);

    for (let i = 0; i < 10; i++) {
      const res = await shareList(
        makeRequest('/api/shares', { list_id: 'list-1', email: 'user2@example.com' })
      );
      expect(res.status).toBe(201);
    }

    const blocked = await shareList(
      makeRequest('/api/shares', { list_id: 'list-1', email: 'user2@example.com' })
    );
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
  });

  it('DELETE /api/shares bloqueia após 10 requisições', async () => {
    mock = createSupabaseMock({ user: { id: 'user-1' } });
    createClientMock.mockResolvedValue(mock as never);

    for (let i = 0; i < 10; i++) {
      const res = await deleteShare(
        makeRequest('/api/shares?id=share-1', undefined, 'DELETE')
      );
      expect(res.status).toBe(200);
    }

    const blocked = await deleteShare(
      makeRequest('/api/shares?id=share-1', undefined, 'DELETE')
    );
    expect(blocked.status).toBe(429);
  });
});
