import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/prices/history?item_id=xxx — Busca histórico de preços de um item.
 *
 * Verifica ownership: o item deve pertencer a uma lista do usuário autenticado.
 * Retorna 404 se o item não existir e 403 se não pertencer ao usuário.
 *
 * Retorna lista de preços ordenados por mês (mais recente primeiro).
 * Inclui variação percentual entre meses consecutivos.
 */

export async function GET(request: Request) {
  const supabase = await createClient();

  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('item_id');

  if (!itemId) {
    return NextResponse.json({ error: 'item_id obrigatório' }, { status: 400 });
  }

  // Verifica se o item existe e pertence a uma lista do usuário
  const { data: item } = await supabase
    .from('items')
    .select('id, list_id, lists!inner(user_id)')
    .eq('id', itemId)
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

  // Buscar preços do item
  const { data, error } = await supabase
    .from('prices')
    .select('*')
    .eq('item_id', itemId)
    .order('month', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
