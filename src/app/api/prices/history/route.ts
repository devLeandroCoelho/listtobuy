import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/prices/history?item_id=xxx — Busca histórico de preços de um item.
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

  // Verificar ownership do item antes de buscar histórico
  const { data: item } = await supabase
    .from('items')
    .select('id, list_id, lists(user_id)')
    .eq('id', itemId)
    .single();

  if (!item || !item.lists || (item.lists as unknown as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 404 });
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