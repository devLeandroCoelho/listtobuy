import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serializePriceRow, serializePriceRows } from '@/lib/list-items';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/prices — Registra preço de um item.
 * GET /api/prices?item_id=xxx — Retorna preços de um item.
 *
 * Contrato de `value`: sempre `number | null` na resposta (o PostgREST pode
 * devolver NUMERIC como string em valores altos — issue #56).
 */

export async function POST(request: Request) {
  const supabase = await createClient();

  // Verifica autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // Rate limiting: registro de preço (30/min por usuário)
  const limited = enforceRateLimit(user.id, RATE_LIMITS['prices:create']);
  if (limited) return limited;

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

  // Valida valor numérico positivo
  const priceValue = Number(value);
  if (isNaN(priceValue) || priceValue < 0) {
    return NextResponse.json(
      { error: 'Preço deve ser um número positivo' },
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
