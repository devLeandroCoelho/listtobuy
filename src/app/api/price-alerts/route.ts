import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/price-alerts?item_id=xxx — Retorna preferência de notificação de preço do usuário para um item.
 * GET /api/price-alerts — Retorna todas as preferências de notificação de preço do usuário.
 *
 * Retorna: { alert: { id, item_id, enabled } | null } | { alerts: Array<{ id, item_id, enabled }> }
 */

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('item_id');

  if (itemId) {
    const { data, error } = await supabase
      .from('price_alerts')
      .select('id, item_id, enabled')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ alert: data ?? null });
  }

  const { data, error } = await supabase
    .from('price_alerts')
    .select('id, item_id, enabled')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alerts: data ?? [] });
}

/**
 * POST /api/price-alerts — Cria ou alterna preferência de notificação de preço.
 *
 * Body: { item_id: string }
 * Retorna: { alert: { id, item_id, enabled } } (201) | { error }
 */

export async function POST(request: Request) {
  const rateLimited = checkRateLimit(request);
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { item_id } = body;

  if (!item_id || typeof item_id !== 'string') {
    return NextResponse.json(
      { error: 'item_id é obrigatório' },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from('price_alerts')
    .select('id, enabled')
    .eq('user_id', user.id)
    .eq('item_id', item_id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('price_alerts')
      .update({ enabled: !existing.enabled, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('id, item_id, enabled')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ alert: data });
  }

  const { data, error } = await supabase
    .from('price_alerts')
    .insert({ user_id: user.id, item_id, enabled: true })
    .select('id, item_id, enabled')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alert: data }, { status: 201 });
}

/**
 * DELETE /api/price-alerts?item_id=xxx — Remove preferência de notificação de preço.
 *
 * Retorna: { success: true } | { error }
 */

export async function DELETE(request: Request) {
  const rateLimited = checkRateLimit(request);
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('item_id');

  if (!itemId) {
    return NextResponse.json({ error: 'item_id é obrigatório' }, { status: 400 });
  }

  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('user_id', user.id)
    .eq('item_id', itemId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
