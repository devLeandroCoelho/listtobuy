import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { GET as getPriceAlerts, POST as togglePriceAlert, DELETE as deletePriceAlert } from '@/app/api/price-alerts/route';
import {
  createSupabaseMock,
  type SupabaseMock,
} from '@/__tests__/helpers/supabase';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const ITEM_ID = 'item-1';
const USER_ID = 'user-1';
const BASE_URL = 'http://localhost';

describe('GET /api/price-alerts', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    mock = createSupabaseMock();
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  it('não autenticado → 401', async () => {
    mock = createSupabaseMock({ user: null });
    createClientMock.mockResolvedValue(mock as never);

    const res = await getPriceAlerts(new Request(`${BASE_URL}/api/price-alerts`));
    expect(res.status).toBe(401);
  });

  it('sem alertas → retorna lista vazia', async () => {
    mock = createSupabaseMock({
      price_alerts: { data: [] },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await getPriceAlerts(new Request(`${BASE_URL}/api/price-alerts`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.alerts).toEqual([]);
  });

  it('com item_id → retorna alerta específico', async () => {
    mock = createSupabaseMock({
      price_alerts: { data: { id: 'pa1', item_id: ITEM_ID, enabled: true } },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await getPriceAlerts(new Request(`${BASE_URL}/api/price-alerts?item_id=${ITEM_ID}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.alert).toEqual({ id: 'pa1', item_id: ITEM_ID, enabled: true });
  });

  it('com item_id sem alerta → retorna null', async () => {
    mock = createSupabaseMock({
      price_alerts: { data: null },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await getPriceAlerts(new Request(`${BASE_URL}/api/price-alerts?item_id=${ITEM_ID}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.alert).toBeNull();
  });
});

describe('POST /api/price-alerts', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    mock = createSupabaseMock();
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  it('não autenticado → 401', async () => {
    mock = createSupabaseMock({ user: null });
    createClientMock.mockResolvedValue(mock as never);

    const res = await togglePriceAlert(
      new Request(`${BASE_URL}/api/price-alerts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ item_id: ITEM_ID }),
      })
    );
    expect(res.status).toBe(401);
  });

  it('cria alerta quando não existe', async () => {
    mock = createSupabaseMock({
      price_alerts: { data: null },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await togglePriceAlert(
      new Request(`${BASE_URL}/api/price-alerts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ item_id: ITEM_ID }),
      })
    );

    expect(res.status).toBe(201);
    expect(mock.mocks.priceAlertsInsert).toHaveBeenCalledWith(
      { user_id: USER_ID, item_id: ITEM_ID, enabled: true }
    );
  });

  it('alterna alerta existente', async () => {
    mock = createSupabaseMock({
      price_alerts: { data: { id: 'pa1', item_id: ITEM_ID, enabled: true } },
    });
    createClientMock.mockResolvedValue(mock as never);

    const res = await togglePriceAlert(
      new Request(`${BASE_URL}/api/price-alerts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ item_id: ITEM_ID }),
      })
    );

    expect(res.status).toBe(200);
    expect(mock.mocks.priceAlertsUpdate).toHaveBeenCalledWith(
      { enabled: false, updated_at: expect.any(String) }
    );
  });

  it('item_id inválido → 400', async () => {
    const res = await togglePriceAlert(
      new Request(`${BASE_URL}/api/price-alerts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/price-alerts', () => {
  let mock: SupabaseMock;
  let createClientMock: Mock;

  beforeEach(() => {
    mock = createSupabaseMock();
    createClientMock = vi.mocked(createClient);
    createClientMock.mockResolvedValue(mock as never);
  });

  it('não autenticado → 401', async () => {
    mock = createSupabaseMock({ user: null });
    createClientMock.mockResolvedValue(mock as never);

    const res = await deletePriceAlert(new Request(`${BASE_URL}/api/price-alerts?item_id=${ITEM_ID}`));
    expect(res.status).toBe(401);
  });

  it('remove alerta com sucesso', async () => {
    const res = await deletePriceAlert(new Request(`${BASE_URL}/api/price-alerts?item_id=${ITEM_ID}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mock.mocks.priceAlertsDelete).toHaveBeenCalled();
  });

  it('item_id faltando → 400', async () => {
    const res = await deletePriceAlert(new Request(`${BASE_URL}/api/price-alerts`));
    expect(res.status).toBe(400);
  });
});
