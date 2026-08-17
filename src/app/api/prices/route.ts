import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serializePriceRow, serializePriceRows } from '@/lib/list-items';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/prices — Registra preço de um item.
 * GET /api/prices?item_id=xxx — Retorna preços de um item.
 *
 * Contrato de `value`: sempre `number | null` na resposta (o PostgREST pode
 * devolver NUMERIC como string em valores altos — issue #56).
 */

export async function POST(request: Request) {
  const rateLimited = checkRateLimit(request);
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  // Verifica autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { item_id, value, month } = body;

  // Validação dos campos obrigatórios
  if (!item_id || value === undefined || !month) {
    return NextResponse.json(
      { error: 'Dados obrigatórios: item_id, value, month' },
      { status: 400 }
    );
  }

  // Valida formato do mês (YYYY-MM)
  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(month)) {
    return NextResponse.json(
      { error: 'Formato de mês inválido. Use YYYY-MM' },
      { status: 400 }
    );
  }

  // Valida valor numérico positivo e faixa
  const priceValue = Number(value);
  if (isNaN(priceValue) || priceValue < 0 || priceValue > 999999.99) {
    return NextResponse.json(
      { error: 'Preço inválido. Use valores de 0 a 999.999,99' },
      { status: 400 }
    );
  }

  // Verifica se o item existe e pertence a uma lista do usuário
  const { data: item } = await supabase
    .from('items')
    .select('id, list_id, lists!inner(user_id)')
    .eq('id', item_id)
    .single();

  if (!item) {
    return NextResponse.json(
      { error: 'Item não encontrado' },
      { status: 404 }
    );
  }

  // Verifica ownership via list
  const { data: list } = await supabase
    .from('lists')
    .select('id')
    .eq('id', item.list_id)
    .eq('user_id', user.id)
    .single();

  if (!list) {
    return NextResponse.json(
      { error: 'Sem permissão para este item' },
      { status: 403 }
    );
  }

  // Busca preço anterior para notificação de variação
  const { data: previousPrices } = await supabase
    .from('prices')
    .select('value')
    .eq('item_id', item_id)
    .neq('month', month)
    .order('month', { ascending: false })
    .limit(1);

  const previousPrice = previousPrices?.[0]?.value ?? null;
  const previousPriceNum = previousPrice !== null ? Number(previousPrice) : null;

  // Insere preço (upsert: atualiza se já existir preço para o mesmo item/mês)
  const { data, error } = await supabase
    .from('prices')
    .upsert(
      { item_id, value: priceValue, month },
      { onConflict: 'item_id,month' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Verifica alertas de preço e envia notificação se houver variação significativa (>10%)
  if (previousPriceNum !== null && previousPriceNum > 0) {
    const variation = ((priceValue - previousPriceNum) / previousPriceNum) * 100;
    if (Math.abs(variation) > 10) {
      const { data: alerts } = await supabase
        .from('price_alerts')
        .select('enabled')
        .eq('user_id', user.id)
        .eq('item_id', item_id)
        .eq('enabled', true)
        .maybeSingle();

      if (alerts && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const direction = variation > 0 ? 'aumentou' : 'diminuiu';
        const emoji = variation > 0 ? '📈' : '📉';
        try {
          new Notification(`${emoji} ListToBuy — Preço ${direction}`, {
            body: `O item registrado mudou de ${previousPriceNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para ${priceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${Math.abs(variation).toFixed(1)}%)`,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: `price-alert-${item_id}-${Date.now()}`,
            requireInteraction: false,
          });
        } catch {
          // Silently fail - notifications are not critical
        }
      }
    }
  }

  // Normaliza `value` para number/null na fronteira (issue #56)
  return NextResponse.json({ price: serializePriceRow(data) }, { status: 201 });
}

export async function GET(request: Request) {
  const supabase = await createClient();

  // Verifica autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('item_id');

  if (!itemId) {
    return NextResponse.json(
      { error: 'Parâmetro item_id é obrigatório' },
      { status: 400 }
    );
  }

  // Busca preços do item, ordenados por mês decrescente
  const { data, error } = await supabase
    .from('prices')
    .select('*')
    .eq('item_id', itemId)
    .order('month', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Normaliza `value` para number/null na fronteira (issue #56)
  return NextResponse.json({ prices: serializePriceRows(data ?? []) });
}
