import { vi, type Mock } from 'vitest';

export type MockUser = { id: string; email?: string } | null;

export interface SupabaseBehavior {
  user?: MockUser;
  lists?: { data?: unknown; error?: unknown };
  users?: { data?: unknown; error?: unknown };
  items?: { data?: unknown; error?: unknown };
  prices?: { data?: unknown; error?: unknown };
  list_shares?: { data?: unknown; error?: unknown };
  price_alerts?: { data?: unknown; error?: unknown };
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
    usersSelect: Mock;
    usersEq: Mock;
    usersSingle: Mock;
    listSharesSelect: Mock;
    listSharesEq: Mock;
    listSharesSingle: Mock;
    listSharesMaybeSingle: Mock;
    listSharesInsert: Mock;
    listSharesDelete: Mock;
    listSharesDeleteEq: Mock;
    priceAlertsSelect: Mock;
    priceAlertsEq: Mock;
    priceAlertsSingle: Mock;
    priceAlertsMaybeSingle: Mock;
    priceAlertsInsert: Mock;
    priceAlertsUpdate: Mock;
    priceAlertsDelete: Mock;
    priceAlertsDeleteEq: Mock;
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

  const usersResult = {
    data: behavior.users?.data ?? null,
    error: behavior.users?.error ?? null,
  };

  const listSharesResult = {
    data: behavior.list_shares?.data ?? null,
    error: behavior.list_shares?.error ?? null,
  };

  const priceAlertsResult = {
    data: behavior.price_alerts?.data ?? null,
    error: behavior.price_alerts?.error ?? null,
  };

  const deleteError = behavior.deleteError ?? null;

  const auth = { getUser: vi.fn().mockResolvedValue({ data: { user } }) };

  const single = vi.fn().mockResolvedValue(listsResult);
  const selectEq = vi.fn(() => ({ eq: selectEq, single }));
  const select = vi.fn().mockReturnValue({ eq: selectEq });
  const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
  const deleteEq = vi.fn().mockResolvedValue({ error: deleteError });
  const deleteList = vi.fn().mockReturnValue({ eq: deleteEq });

  const updateSingle = vi.fn().mockResolvedValue(listsResult);
  const updateSelect = vi.fn().mockReturnValue({ single: updateSingle });
  const updateEq = vi.fn(() => ({ eq: updateEq, select: updateSelect }));
  const update = vi.fn().mockReturnValue({ eq: updateEq });

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
      then(resolve: (value: unknown) => void) {
        resolve(itemsResult);
      },
      order: vi.fn().mockReturnValue({ limit: itemsOrder }),
      single: vi.fn().mockResolvedValue(itemsResult),
    }),
    order: vi.fn().mockReturnValue({ limit: itemsOrder }),
  });

  const itemsSingle = vi.fn().mockResolvedValue(itemsResult);
  const itemsInsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ single: itemsSingle }),
  });
  const itemsUpdateSelect = vi.fn().mockReturnValue({ single: itemsSingle });
  const itemsUpdateEq = vi.fn(() => ({ eq: itemsUpdateEq, select: itemsUpdateSelect }));
  const itemsUpdate = vi.fn().mockReturnValue({ eq: itemsUpdateEq });
  const itemsDeleteResult = { error: deleteError ?? null, count: 1 };
  const itemsDeleteEq: Mock = vi.fn(() => ({
    eq: itemsDeleteEq,
    then(resolve: (value: unknown) => void) {
      resolve(itemsDeleteResult);
    },
  }));
  const itemsDelete = vi.fn().mockReturnValue({ eq: itemsDeleteEq });

  const pricesEq = vi.fn(() => ({
    eq: pricesEq,
    neq: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(pricesResult),
      }),
    }),
    order: vi.fn().mockResolvedValue(pricesResult),
    single: vi.fn().mockResolvedValue(pricesResult),
  }));
  const pricesSelect = vi.fn().mockReturnValue({ eq: pricesEq });
  const pricesUpsertSingle = vi.fn().mockResolvedValue(pricesResult);
  const pricesUpsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ single: pricesUpsertSingle }),
  });

  const usersSingle = vi.fn().mockResolvedValue(usersResult);
  const usersEq = vi.fn(() => ({ single: usersSingle, maybeSingle: usersSingle }));
  const usersSelect = vi.fn().mockReturnValue({ eq: usersEq });

  const listSharesSingle = vi.fn().mockResolvedValue(listSharesResult);
  const listSharesMaybeSingle = vi.fn().mockResolvedValue(listSharesResult);
  const listSharesEq = vi.fn(() => ({
    eq: listSharesEq,
    single: listSharesSingle,
    maybeSingle: listSharesMaybeSingle,
  }));
  const listSharesSelect = vi.fn().mockReturnValue({ eq: listSharesEq });
  const listSharesInsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ single: listSharesSingle }),
  });
  const listSharesDeleteEq = vi.fn().mockResolvedValue({ error: deleteError });
  const listSharesDelete = vi.fn().mockReturnValue({ eq: listSharesDeleteEq });

  const priceAlertsSingle = vi.fn().mockResolvedValue(priceAlertsResult);
  const priceAlertsMaybeSingle = vi.fn().mockResolvedValue(priceAlertsResult);
  const priceAlertsEq = vi.fn(() => ({
    eq: priceAlertsEq,
    single: priceAlertsSingle,
    maybeSingle: priceAlertsMaybeSingle,
    order: vi.fn().mockResolvedValue(priceAlertsResult),
    then(resolve: (value: unknown) => void) {
      resolve(priceAlertsResult);
    },
  }));
  const priceAlertsSelect = vi.fn().mockReturnValue({ eq: priceAlertsEq });
  const priceAlertsUpdateSelect = vi.fn().mockReturnValue({ single: priceAlertsSingle });
  const priceAlertsUpdateEq = vi.fn(() => ({ eq: priceAlertsUpdateEq, select: priceAlertsUpdateSelect }));
  const priceAlertsUpdate = vi.fn().mockReturnValue({ eq: priceAlertsUpdateEq });
  const priceAlertsDeleteEq = vi.fn(() => ({
    eq: priceAlertsDeleteEq,
    count: 1,
    then(resolve: (value: unknown) => void) {
      resolve({ error: deleteError ?? null, count: 1 });
    },
  }));
  const priceAlertsDelete = vi.fn().mockReturnValue({ eq: priceAlertsDeleteEq });
  const priceAlertsInsertSelect = vi.fn().mockReturnValue({ single: priceAlertsSingle });
  const priceAlertsInsert = vi.fn().mockReturnValue({ select: priceAlertsInsertSelect });

  const from = vi.fn((table: string) => {
    if (table === 'lists') {
      return { insert, select, update, delete: deleteList };
    }
    if (table === 'users') {
      return { select: usersSelect };
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
    if (table === 'list_shares') {
      return {
        select: listSharesSelect,
        insert: listSharesInsert,
        eq: listSharesEq,
        delete: listSharesDelete,
      };
    }
    if (table === 'price_alerts') {
      return {
        select: priceAlertsSelect,
        insert: priceAlertsInsert,
        update: priceAlertsUpdate,
        delete: priceAlertsDelete,
        eq: priceAlertsEq,
      };
    }
    if (table === 'list_activity') {
      return {
        insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn() }) }),
      };
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
      usersSelect,
      usersEq,
      usersSingle,
      listSharesSelect,
      listSharesEq,
      listSharesSingle,
      listSharesMaybeSingle,
      listSharesInsert,
      listSharesDelete,
      listSharesDeleteEq,
      priceAlertsSelect,
      priceAlertsEq,
      priceAlertsSingle,
      priceAlertsMaybeSingle,
      priceAlertsInsert,
      priceAlertsUpdate,
      priceAlertsDelete,
      priceAlertsDeleteEq,
    },
  };
}
