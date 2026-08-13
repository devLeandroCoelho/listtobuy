import { vi, type Mock } from 'vitest';

/**
 * Helper de testes: mock do Supabase client usado pelos route handlers.
 *
 * Os route handlers importam `createClient` de `@/lib/supabase/server`.
 * Nos testes, mockamos esse módulo com `vi.mock('@/lib/supabase/server')`
 * e devolvemos o objeto criado por `createSupabaseMock`, que reproduz a
 * cadeia de chamadas utilizada nas rotas:
 *
 *   auth.getUser() → { data: { user } }
 *   from('lists').insert(...).select().single()
 *   from('lists').select('*').eq('id', id).single()
 *   from('lists').delete().eq('id', id)
 *   from('items').select(...).order(...).limit(n)[.ilike(...)]
 *
 * Os mocks individuais ficam expostos em `mocks` para asserções
 * (ex.: verificar payloads de insert/delete e o escape de wildcards).
 */

export type MockUser = { id: string; email?: string } | null;

export interface SupabaseBehavior {
  /** Usuário retornado por auth.getUser(). Default: { id: 'user-1' }. Use null p/ testar 401. */
  user?: MockUser;
  /** Resultado de from('lists')...single() (POST e GET por id). Default: { data: null, error: null }. */
  lists?: { data?: unknown; error?: unknown };
  /** Resultado de from('items')...single() (GET lista e suggestions). Default: { data: [], error: null }. */
  items?: { data?: unknown; error?: unknown };
  /** Resultado de from('prices')...single() (GET por item e POST/upsert). Default: { data: [], error: null }. */
  prices?: { data?: unknown; error?: unknown };
  /** Erro retornado por from('lists').delete().eq(). Default: null (sucesso). */
  deleteError?: unknown;
}

export interface SupabaseMock {
  auth: { getUser: Mock };
  from: Mock;
  mocks: {
    insert: Mock;
    select: Mock;
    selectEq: Mock;
    single: Mock;
    delete: Mock;
    deleteEq: Mock;
    update: Mock;
    updateEq: Mock;
    itemsSelect: Mock;
    itemsOrder: Mock;
    ilike: Mock;
    itemsInsert: Mock;
    itemsUpdate: Mock;
    itemsDelete: Mock;
    pricesSelect: Mock;
    pricesUpsert: Mock;
  };
}

export function createSupabaseMock(behavior: SupabaseBehavior = {}): SupabaseMock {
  const user: MockUser =
    behavior.user === undefined ? { id: 'user-1' } : behavior.user;

  const listsResult = {
    data: behavior.lists?.data ?? null,
    error: behavior.lists?.error ?? null,
  };

  const itemsResult = {
    data: behavior.items?.data ?? [],
    error: behavior.items?.error ?? null,
  };

  const pricesResult = {
    data: behavior.prices?.data ?? [],
    error: behavior.prices?.error ?? null,
  };

  const deleteError = behavior.deleteError ?? null;

  const auth = { getUser: vi.fn().mockResolvedValue({ data: { user } }) };

  // Cadeias de `lists`
  const single = vi.fn().mockResolvedValue(listsResult);
  // Suporta encadeamento `.eq()` repetido (ex.: .eq('id').eq('user_id').single())
  const selectEq = vi.fn(() => ({ eq: selectEq, single }));
  const select = vi.fn().mockReturnValue({ eq: selectEq });
  const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
  const deleteEq = vi.fn().mockResolvedValue({ error: deleteError });
  const deleteList = vi.fn().mockReturnValue({ eq: deleteEq });

  const updateSingle = vi.fn().mockResolvedValue(listsResult);
  const updateSelect = vi.fn().mockReturnValue({ single: updateSingle });
  const updateEq = vi.fn(() => ({ select: updateSelect }));
  const update = vi.fn().mockReturnValue({ eq: updateEq });

  // Query builder thenable para `items` (suggestions):
  // o handler faz `await query` e, se houver `q`, chama `query.ilike(...)`.
  // Por isso o objeto precisa ser thenable E ter `.ilike()` retornando ele mesmo.
  const itemsQuery: Record<string, unknown> = {
    then(resolve: (value: unknown) => void) {
      resolve(itemsResult);
    },
  };
  const ilike = vi.fn().mockReturnValue(itemsQuery);
  itemsQuery.ilike = ilike;

  const itemsOrder = vi.fn().mockReturnValue(itemsQuery);
  const itemsSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      // Thenable: .eq() sozinho (ex.: duplicate) pode ser aguardado via await
      then(resolve: (value: unknown) => void) {
        resolve(itemsResult);
      },
      order: vi.fn().mockResolvedValue(itemsResult),
      // Ownership check do POST /api/prices: .eq('id', item_id).single()
      single: vi.fn().mockResolvedValue(itemsResult),
    }),
    order: vi.fn().mockReturnValue({ limit: itemsOrder }),
  });

  // Cadeias de escrita de `items` (rotas de item: create/update/delete)
  const itemsSingle = vi.fn().mockResolvedValue(itemsResult);
  const itemsInsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ single: itemsSingle }),
  });
  const itemsUpdateSelect = vi.fn().mockReturnValue({ single: itemsSingle });
  const itemsUpdateEq = vi.fn(() => ({ eq: itemsUpdateEq, select: itemsUpdateSelect }));
  const itemsUpdate = vi.fn().mockReturnValue({ eq: itemsUpdateEq });
  const itemsDeleteResult = { error: deleteError ?? null, count: 1 };
  // Suporta encadeamento `.delete(...).eq(...).eq(...)` (thenable no fim)
  const itemsDeleteEq: Mock = vi.fn(() => ({
    eq: itemsDeleteEq,
    then(resolve: (value: unknown) => void) {
      resolve(itemsDeleteResult);
    },
  }));
  const itemsDelete = vi.fn().mockReturnValue({ eq: itemsDeleteEq });

  // Cadeias de `prices` (GET por item e POST/upsert)
  const pricesSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue(pricesResult),
    }),
  });
  const pricesUpsertSingle = vi.fn().mockResolvedValue(pricesResult);
  const pricesUpsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ single: pricesUpsertSingle }),
  });

  const from = vi.fn((table: string) => {
    if (table === 'lists') {
      return { insert, select, update, delete: deleteList };
    }
    if (table === 'items') {
      return {
        select: itemsSelect,
        insert: itemsInsert,
        update: itemsUpdate,
        delete: itemsDelete,
      };
    }
    if (table === 'prices') {
      return { select: pricesSelect, upsert: pricesUpsert };
    }
    throw new Error(`Tabela não mockada no helper de testes: "${table}"`);
  });

  return {
    auth,
    from,
    mocks: {
      insert,
      select,
      selectEq,
      single,
      delete: deleteList,
      deleteEq,
      update,
      updateEq,
      itemsSelect,
      itemsOrder,
      ilike,
      itemsInsert,
      itemsUpdate,
      itemsDelete,
      pricesSelect,
      pricesUpsert,
    },
  };
}
