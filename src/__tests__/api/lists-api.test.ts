import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { GET, PATCH, DELETE } from '@/app/api/lists/[id]/route';
import { createSupabaseMock, type SupabaseMock } from '@/__tests__/helpers/supabase';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const BASE_URL = 'http://localhost';

describe('GET /api/lists/[id]', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    mock = createSupabaseMock();
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  it('owner acessa a lista -> 200', async () => {
    const list = { id: 'list-1', user_id: 'user-1', name: 'Minha Lista', month: '2026-08', budget: '100' };

    mock = createSupabaseMock({
      user: { id: 'user-1' },
      lists: { data: list },
      items: { data: [] },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await GET(new Request(`${BASE_URL}/api/lists/list-1`), { params: Promise.resolve({ id: 'list-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.list.name).toBe('Minha Lista');
  });

  it('viewer acessa a lista -> 200', async () => {
    const list = { id: 'list-1', user_id: 'owner-1', name: 'Lista', month: '2026-08', budget: '100' };
    const share = { list_id: 'list-1', user_id: 'user-2', permission: 'viewer' };

    mock = createSupabaseMock({
      user: { id: 'user-2' },
      lists: { data: list },
      list_shares: { data: share },
      items: { data: [] },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await GET(new Request(`${BASE_URL}/api/lists/list-1`), { params: Promise.resolve({ id: 'list-1' }) });

    expect(res.status).toBe(200);
  });

  it('sem acesso -> 403', async () => {
    const list = { id: 'list-1', user_id: 'owner-1' };

    mock = createSupabaseMock({
      user: { id: 'user-2' },
      lists: { data: list },
      list_shares: { data: null },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await GET(new Request(`${BASE_URL}/api/lists/list-1`), { params: Promise.resolve({ id: 'list-1' }) });

    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/lists/[id]', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    mock = createSupabaseMock();
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  it('owner atualiza lista -> 200', async () => {
    const list = { id: 'list-1', user_id: 'user-1' };

    mock = createSupabaseMock({
      user: { id: 'user-1' },
      lists: { data: list },
    });
    createClientMock.mockResolvedValue(mock as never);

    mock.mocks.update.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { ...list, name: 'Nova Lista' }, error: null }),
        }),
      }),
    });

    const res = await PATCH(
      new Request(`${BASE_URL}/api/lists/list-1`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Nova Lista' }),
      }),
      { params: Promise.resolve({ id: 'list-1' }) }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.list.name).toBe('Nova Lista');
  });

  it('editor atualiza lista -> 200', async () => {
    const list = { id: 'list-1', user_id: 'owner-1' };
    const share = { list_id: 'list-1', user_id: 'user-2', permission: 'editor' };

    mock = createSupabaseMock({
      user: { id: 'user-2' },
      lists: { data: list },
      list_shares: { data: share },
    });
    createClientMock.mockResolvedValue(mock as never);

    mock.mocks.update.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { ...list, name: 'Editada' }, error: null }),
        }),
      }),
    });

    const res = await PATCH(
      new Request(`${BASE_URL}/api/lists/list-1`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Editada' }),
      }),
      { params: Promise.resolve({ id: 'list-1' }) }
    );

    expect(res.status).toBe(200);
  });

  it('viewer nao pode atualizar -> 403', async () => {
    const list = { id: 'list-1', user_id: 'owner-1' };
    const share = { list_id: 'list-1', user_id: 'user-2', permission: 'viewer' };

    mock = createSupabaseMock({
      user: { id: 'user-2' },
      lists: { data: list },
      list_shares: { data: share },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await PATCH(
      new Request(`${BASE_URL}/api/lists/list-1`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Editada' }),
      }),
      { params: Promise.resolve({ id: 'list-1' }) }
    );

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/lists/[id]', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    mock = createSupabaseMock();
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  it('owner exclui lista -> 200', async () => {
    const list = { id: 'list-1', user_id: 'user-1' };

    mock = createSupabaseMock({
      user: { id: 'user-1' },
      lists: { data: list },
    });
    createClientMock.mockResolvedValue(mock as never);

    mock.mocks.delete.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const res = await DELETE(
      new Request(`${BASE_URL}/api/lists/list-1`, { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'list-1' }) }
    );

    expect(res.status).toBe(200);
  });

  it('viewer nao pode excluir -> 403', async () => {
    const list = { id: 'list-1', user_id: 'owner-1' };
    const share = { list_id: 'list-1', user_id: 'user-2', permission: 'viewer' };

    mock = createSupabaseMock({
      user: { id: 'user-2' },
      lists: { data: list },
      list_shares: { data: share },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await DELETE(
      new Request(`${BASE_URL}/api/lists/list-1`, { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'list-1' }) }
    );

    expect(res.status).toBe(403);
  });
});
