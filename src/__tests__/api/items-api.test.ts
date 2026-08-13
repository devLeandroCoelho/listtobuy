import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { POST as createItem } from '@/app/api/lists/[id]/items/route';
import {
  PUT as updateItem,
  DELETE as deleteItem,
} from '@/app/api/lists/[id]/items/[itemId]/route';
import {
  createSupabaseMock,
  type SupabaseMock,
} from '@/__tests__/helpers/supabase';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const LIST_ID = 'list-123';
const ITEM_ID = 'item-1';
const BASE_URL = 'http://localhost';

describe('POST /api/lists/[id]/items (category)', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    // Lista existente (passa no check de ownership antes do insert)
    mock = createSupabaseMock({ lists: { data: { id: LIST_ID } } });
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  function makePostRequest(body: unknown): Request {
    return new Request(`${BASE_URL}/api/lists/${LIST_ID}/items`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('cria item com category → 201 e persiste category', async () => {
    const created = {
      id: ITEM_ID,
      list_id: LIST_ID,
      name: 'Maçã',
      category: 'hortifruti',
      completed: 0, // banco devolve number (NUMERIC)
    };
    mock = createSupabaseMock({
      lists: { data: { id: LIST_ID } },
      items: { data: created },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await createItem(
      makePostRequest({ name: 'Maçã', quantity: 2, unit: 'kg', category: 'hortifruti' }),
      { params: Promise.resolve({ id: LIST_ID }) }
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ item: { ...created, completed: '0', price: null } });
    expect(mock.mocks.itemsInsert).toHaveBeenCalledWith({
      list_id: LIST_ID,
      name: 'Maçã',
      quantity: 2,
      unit: 'kg',
      category: 'hortifruti',
    });
  });

  it('REGRESSÃO #51: resposta do POST tem completed como string "0"', async () => {
    const created = {
      id: ITEM_ID,
      list_id: LIST_ID,
      name: 'Maçã',
      completed: 0, // o banco devolve number
    };
    mock = createSupabaseMock({
      lists: { data: { id: LIST_ID } },
      items: { data: created },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await createItem(
      makePostRequest({ name: 'Maçã' }),
      { params: Promise.resolve({ id: LIST_ID }) }
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.item.completed).toBe('0');
    expect(typeof body.item.completed).toBe('string');
  });

  it('category com trim aplicado no insert', async () => {
    const res = await createItem(
      makePostRequest({ name: 'Pão', category: '  padaria  ' }),
      { params: Promise.resolve({ id: LIST_ID }) }
    );

    expect(res.status).toBe(201);
    expect(mock.mocks.itemsInsert).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'padaria' })
    );
  });

  it('category null → insere sem categoria (não categorizado)', async () => {
    const res = await createItem(
      makePostRequest({ name: 'Leite', category: null }),
      { params: Promise.resolve({ id: LIST_ID }) }
    );

    expect(res.status).toBe(201);
    expect(mock.mocks.itemsInsert).toHaveBeenCalledWith(
      expect.objectContaining({ category: null })
    );
  });

  it('sem category no body → NÃO inclui category no insert (coluna NULL)', async () => {
    const res = await createItem(
      makePostRequest({ name: 'Arroz' }),
      { params: Promise.resolve({ id: LIST_ID }) }
    );

    expect(res.status).toBe(201);
    expect(mock.mocks.itemsInsert).toHaveBeenCalledWith({
      list_id: LIST_ID,
      name: 'Arroz',
      quantity: 1,
      unit: 'un',
    });
  });

  it('category vazia/whitespace → 400', async () => {
    const res = await createItem(
      makePostRequest({ name: 'X', category: '   ' }),
      { params: Promise.resolve({ id: LIST_ID }) }
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: 'Categoria deve ser um texto não vazio ou null',
    });
    expect(mock.mocks.itemsInsert).not.toHaveBeenCalled();
  });

  it('category não-string (número) → 400', async () => {
    const res = await createItem(
      makePostRequest({ name: 'X', category: 123 }),
      { params: Promise.resolve({ id: LIST_ID }) }
    );

    expect(res.status).toBe(400);
    expect(mock.mocks.itemsInsert).not.toHaveBeenCalled();
  });

  it('sem autenticação → 401', async () => {
    mock = createSupabaseMock({ user: null, lists: { data: { id: LIST_ID } } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await createItem(
      makePostRequest({ name: 'X', category: 'carnes' }),
      { params: Promise.resolve({ id: LIST_ID }) }
    );

    expect(res.status).toBe(401);
    expect(mock.mocks.itemsInsert).not.toHaveBeenCalled();
  });
});

describe('PUT /api/lists/[id]/items/[itemId] (category)', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    mock = createSupabaseMock({
      items: { data: { id: ITEM_ID, list_id: LIST_ID, name: 'Maçã' } },
    });
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  function makePutRequest(body: unknown): Request {
    return new Request(`${BASE_URL}/api/lists/${LIST_ID}/items/${ITEM_ID}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('atualiza category → 200 e persiste no update', async () => {
    const updated = {
      id: ITEM_ID,
      name: 'Maçã',
      category: 'laticinios',
      completed: 0, // banco devolve number (NUMERIC)
    };
    mock = createSupabaseMock({ items: { data: updated } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await updateItem(
      makePutRequest({ category: 'laticinios' }),
      { params: Promise.resolve({ id: LIST_ID, itemId: ITEM_ID }) }
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ item: { ...updated, completed: '0', price: null } });
    expect(mock.mocks.itemsUpdate).toHaveBeenCalledWith({ category: 'laticinios' });
  });

  it('REGRESSÃO #51: PUT completed → resposta com completed string "1"', async () => {
    const updated = {
      id: ITEM_ID,
      name: 'Maçã',
      completed: 1, // o banco devolve number
    };
    mock = createSupabaseMock({ items: { data: updated } });
    createClientMock.mockResolvedValue(mock as never);

    const res = await updateItem(
      makePutRequest({ completed: 1 }),
      { params: Promise.resolve({ id: LIST_ID, itemId: ITEM_ID }) }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.item.completed).toBe('1');
    expect(typeof body.item.completed).toBe('string');
    // INSERT/UPDATE continua gravando number na coluna NUMERIC
    expect(mock.mocks.itemsUpdate).toHaveBeenCalledWith({ completed: 1 });
  });

  it('category null → limpa a categoria no update', async () => {
    const res = await updateItem(
      makePutRequest({ category: null }),
      { params: Promise.resolve({ id: LIST_ID, itemId: ITEM_ID }) }
    );

    expect(res.status).toBe(200);
    expect(mock.mocks.itemsUpdate).toHaveBeenCalledWith({ category: null });
  });

  it('sem category no body → NÃO altera category (não entra no update)', async () => {
    const res = await updateItem(
      makePutRequest({ name: 'Maçã Fuji' }),
      { params: Promise.resolve({ id: LIST_ID, itemId: ITEM_ID }) }
    );

    expect(res.status).toBe(200);
    expect(mock.mocks.itemsUpdate).toHaveBeenCalledWith({ name: 'Maçã Fuji' });
    expect(mock.mocks.itemsUpdate.mock.calls[0][0].category).toBeUndefined();
  });

  it('category vazia/whitespace → 400', async () => {
    const res = await updateItem(
      makePutRequest({ category: '' }),
      { params: Promise.resolve({ id: LIST_ID, itemId: ITEM_ID }) }
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: 'Categoria deve ser um texto não vazio ou null',
    });
    expect(mock.mocks.itemsUpdate).not.toHaveBeenCalled();
  });

  it('category inválida com outros campos → 400 e nada é atualizado', async () => {
    const res = await updateItem(
      makePutRequest({ name: 'X', category: true }),
      { params: Promise.resolve({ id: LIST_ID, itemId: ITEM_ID }) }
    );

    expect(res.status).toBe(400);
    expect(mock.mocks.itemsUpdate).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/lists/[id]/items/[itemId]', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    mock = createSupabaseMock();
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  it('exclui item → 200 { success: true }', async () => {
    const res = await deleteItem(
      new Request(`${BASE_URL}/api/lists/${LIST_ID}/items/${ITEM_ID}`, {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: LIST_ID, itemId: ITEM_ID }) }
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mock.mocks.itemsDelete).toHaveBeenCalled();
  });
});
