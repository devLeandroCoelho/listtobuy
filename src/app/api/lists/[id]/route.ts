import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serializeItems } from '@/lib/list-items';

/**
 * GET /api/lists/[id] — Busca uma lista e seus itens.
 * DELETE /api/lists/[id] — Exclui uma lista (itens em cascata).
 *
 * GET Retorna: { list: { ...lista, items: [...] } } | { error }
 * DELETE Retorna: { success: true } | { error }
 */

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const supabase = await createClient();

  // Verifica autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  // Busca a lista (RLS garante que só o dono acessa)
  const { data: list, error: listError } = await supabase
    .from('lists')
    .select('*')
    .eq('id', id)
    .single();

  if (listError || !list) {
    return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
  }

  // Busca itens da lista (RLS garante ownership via list_id)
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .eq('list_id', id)
    .order('created_at', { ascending: true });

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // Normaliza `completed` para string ('0'/'1') na fronteira — o banco devolve
  // number (NUMERIC) e o contrato do client é string (issues #51/#52).
  return NextResponse.json({
    list: { ...list, items: serializeItems(items ?? []) },
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const supabase = await createClient();

  // Verifica autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  // Exclui a lista (RLS restringe ao dono; itens excluídos em cascata no banco)
  const { error } = await supabase.from('lists').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
