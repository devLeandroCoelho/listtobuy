import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { POST as shareList } from '@/app/api/shares/route';
import { createSupabaseMock, type SupabaseMock } from '@/__tests__/helpers/supabase';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const BASE_URL = 'http://localhost';

describe('POST /api/shares', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    mock = createSupabaseMock();
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  function makeShareRequest(body: unknown): Request {
    return new Request(`${BASE_URL}/api/shares`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('compartilha com sucesso -> 201', async () => {
    const list = { id: 'list-1', user_id: 'user-1' };
    const targetUser = { id: 'user-2' };
    const share = { id: 'share-1', list_id: 'list-1', user_id: 'user-2', permission: 'viewer' };

    mock = createSupabaseMock({
      user: { id: 'user-1' },
      lists: { data: list },
      users: { data: targetUser },
      list_shares: { data: null },
    });
    createClientMock.mockResolvedValue(mock as never);

    mock.mocks.listSharesSingle.mockResolvedValue({ data: share, error: null });

    const res = await shareList(makeShareRequest({ list_id: 'list-1', email: 'user2@example.com' }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toEqual(share);
    expect(mock.mocks.listSharesInsert).toHaveBeenCalled();
  });

  it('e-mail inexistente -> 200 generico (sem enumeracao)', async () => {
    const list = { id: 'list-1', user_id: 'user-1' };

    mock = createSupabaseMock({
      user: { id: 'user-1' },
      lists: { data: list },
      users: { data: null },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await shareList(makeShareRequest({ list_id: 'list-1', email: 'nao-existe@example.com' }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ message: 'Convite processado' });
  });

  it('sem autenticacao -> 401', async () => {
    mock = createSupabaseMock({ user: null });
    createClientMock.mockResolvedValue(mock as never);

    const res = await shareList(makeShareRequest({ list_id: 'list-1', email: 'user2@example.com' }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Não autenticado' });
  });

  it('sem list_id ou email -> 400', async () => {
    const res = await shareList(makeShareRequest({}));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Dados obrigatórios' });
  });

  it('usuario sem permissao na lista -> 403', async () => {
    const list = { id: 'list-1', user_id: 'other-user' };
    const targetUser = { id: 'user-2' };

    mock = createSupabaseMock({
      user: { id: 'user-1' },
      lists: { data: list },
      users: { data: targetUser },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await shareList(makeShareRequest({ list_id: 'list-1', email: 'user2@example.com' }));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Sem permissão' });
  });

  it('compartilhamento duplicado -> 200 generico', async () => {
    const list = { id: 'list-1', user_id: 'user-1' };
    const targetUser = { id: 'user-2' };
    const existingShare = { id: 'share-1' };

    mock = createSupabaseMock({
      user: { id: 'user-1' },
      lists: { data: list },
      users: { data: targetUser },
      list_shares: { data: existingShare },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await shareList(makeShareRequest({ list_id: 'list-1', email: 'user2@example.com' }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: 'Convite processado' });
  });

  it('erro interno no insert -> 500 generico', async () => {
    const list = { id: 'list-1', user_id: 'user-1' };
    const targetUser = { id: 'user-2' };

    mock = createSupabaseMock({
      user: { id: 'user-1' },
      lists: { data: list },
      users: { data: targetUser },
      list_shares: { error: { message: 'db error' } },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await shareList(makeShareRequest({ list_id: 'list-1', email: 'user2@example.com' }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Erro interno' });
  });

  it('gera link publico com sucesso -> 201', async () => {
    const list = { id: 'list-1', user_id: 'user-1' };
    const share = { id: 'share-1', list_id: 'list-1', token: 'token-123', permission: 'viewer' };

    mock = createSupabaseMock({
      user: { id: 'user-1' },
      lists: { data: list },
    });
    createClientMock.mockResolvedValue(mock as never);

    mock.mocks.listSharesInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: share, error: null }) }),
    } as unknown as ReturnType<typeof mock.mocks.listSharesInsert>);

    const res = await shareList(makeShareRequest({ list_id: 'list-1', generate_link: true, permission: 'viewer' }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toEqual(share);
    expect(body.link).toContain('/share/');
  });
});
