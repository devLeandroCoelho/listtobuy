import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { POST as createList } from '@/app/api/lists/route';
import { DELETE as deleteList, GET as getList } from '@/app/api/lists/[id]/route';
import {
  createSupabaseMock,
  type SupabaseMock,
} from '@/__tests__/helpers/supabase';

// Mocka o módulo do Supabase server client (usa next/headers, indisponível
// fora do runtime do Next). Os route handlers recebem o mock via createClient().
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const LIST_ID = 'list-123';
const BASE_URL = 'http://localhost';

describe('POST /api/lists', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    mock = createSupabaseMock();
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  function makePostRequest(body: unknown): Request {
    return new Request(`${BASE_URL}/api/lists`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('cria lista com dados válidos → 201 + lista criada', async () => {
    const created = { id: 'list-1', user_id: 'user-1', name: 'Compras', month: '2026-08', budget: 300 };
    mock = createSupabaseMock({ lists: { data: created } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await createList(
      makePostRequest({ name: '  Compras  ', month: '2026-08', budget: 300 })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.list).toEqual(created);
    expect(mock.mocks.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      name: 'Compras', // trim aplicado
      month: '2026-08',
      budget: 300,
    });
  });

  it('sem autenticação → 401', async () => {
    mock = createSupabaseMock({ user: null });
    createClientMock.mockResolvedValue(mock as never);

    const res = await createList(
      makePostRequest({ name: 'Compras', month: '2026-08' })
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Não autenticado' });
    expect(mock.mocks.insert).not.toHaveBeenCalled();
  });

  it('sem name → 400', async () => {
    const res = await createList(makePostRequest({ month: '2026-08' }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Dados obrigatórios: name' });
    expect(mock.mocks.insert).not.toHaveBeenCalled();
  });

  it('name vazio/whitespace → 400', async () => {
    const res = await createList(makePostRequest({ name: '   ', month: '2026-08' }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Dados obrigatórios: name' });
  });

  it('month em formato inválido → 400', async () => {
    const res = await createList(
      makePostRequest({ name: 'Compras', month: '2026/08' })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: 'Formato de mês inválido. Use YYYY-MM',
    });
    expect(mock.mocks.insert).not.toHaveBeenCalled();
  });

  it('budget negativo → 400', async () => {
    const res = await createList(
      makePostRequest({ name: 'Compras', month: '2026-08', budget: -10 })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: 'Orçamento deve ser um número positivo',
    });
    expect(mock.mocks.insert).not.toHaveBeenCalled();
  });

  it('erro do banco ao inserir → 500', async () => {
    mock = createSupabaseMock({ lists: { error: { message: 'insert failed' } } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await createList(
      makePostRequest({ name: 'Compras', month: '2026-08' })
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'insert failed' });
  });
});

describe('GET /api/lists/[id]', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    mock = createSupabaseMock();
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  function callGetList(): Promise<Response> {
    return getList(new Request(`${BASE_URL}/api/lists/${LIST_ID}`), {
      params: Promise.resolve({ id: LIST_ID }),
    });
  }

  it('retorna lista do dono com itens → 200 (completed normalizado p/ string)', async () => {
    const list = { id: LIST_ID, name: 'Mercado', month: '2026-08' };
    const items = [
      { id: 'item-1', list_id: LIST_ID, name: 'Arroz', completed: 0 }, // banco: number
      { id: 'item-2', list_id: LIST_ID, name: 'Feijão', completed: 1 }, // banco: number
    ];
    mock = createSupabaseMock({ lists: { data: list }, items: { data: items } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callGetList();

    expect(res.status).toBe(200);
    // REGRESSÃO #51: completed deve sair como string '0'/'1', não number
    expect(await res.json()).toEqual({
      list: {
        ...list,
        items: [
          { ...items[0], completed: '0' },
          { ...items[1], completed: '1' },
        ],
      },
    });
    expect(mock.mocks.selectEq).toHaveBeenCalledWith('id', LIST_ID);
    expect(mock.mocks.itemsSelect).toHaveBeenCalledWith('*');
  });

  it('REGRESSÃO #52: item comprado (completed=1) sai como "1" string na resposta', async () => {
    const list = { id: LIST_ID, name: 'Mercado', month: '2026-08' };
    mock = createSupabaseMock({
      lists: { data: list },
      items: {
        data: [{ id: 'item-2', list_id: LIST_ID, name: 'Feijão', completed: 1 }],
      },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callGetList();
    const body = await res.json();

    expect(body.list.items[0].completed).toBe('1');
    expect(typeof body.list.items[0].completed).toBe('string');
  });

  it('lista do dono sem itens → 200 com items vazio', async () => {
    const list = { id: LIST_ID, name: 'Mercado', month: '2026-08' };
    mock = createSupabaseMock({ lists: { data: list }, items: { data: [] } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callGetList();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ list: { ...list, items: [] } });
  });

  it('lista de outra pessoa (RLS bloqueia) → 404', async () => {
    // RLS faz o select retornar erro PGRST116 (row not found) para usuário não dono
    mock = createSupabaseMock({
      lists: { error: { message: 'JSON object requested, multiple (or no) rows returned' } },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callGetList();

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Lista não encontrada' });
  });

  it('sem autenticação → 401', async () => {
    mock = createSupabaseMock({ user: null });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callGetList();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Não autenticado' });
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

  function callDeleteList(): Promise<Response> {
    return deleteList(new Request(`${BASE_URL}/api/lists/${LIST_ID}`, { method: 'DELETE' }), {
      params: Promise.resolve({ id: LIST_ID }),
    });
  }

  it('exclui lista do dono → 200 { success: true }', async () => {
    const res = await callDeleteList();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mock.mocks.delete).toHaveBeenCalled();
    expect(mock.mocks.deleteEq).toHaveBeenCalledWith('id', LIST_ID);
  });

  it('sem autenticação → 401', async () => {
    mock = createSupabaseMock({ user: null });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callDeleteList();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Não autenticado' });
    expect(mock.mocks.delete).not.toHaveBeenCalled();
  });

  it('erro do banco ao excluir → 500', async () => {
    mock = createSupabaseMock({ deleteError: { message: 'delete failed' } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await callDeleteList();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'delete failed' });
  });
});
