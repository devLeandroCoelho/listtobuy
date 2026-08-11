import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PUT /api/lists/[id]/items/[itemId] — Edita um item (body parcial).
 * DELETE /api/lists/[id]/items/[itemId] — Exclui um item.
 *
 * PUT Body (parcial): { name?, quantity?, unit?, completed? }
 * PUT Retorna: { item } | { error }
 * DELETE Retorna: { success: true } | { error }
 */

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const supabase = await createClient();

  // Verifica autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id, itemId } = await params;
  const body = await request.json();

  // Valida campos de atualização (todos opcionais, mas ao menos um obrigatório)
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Nome do item não pode ser vazio' },
        { status: 400 }
      );
    }
    updates.name = body.name.trim();
  }

  if (body.quantity !== undefined) {
    const quantity = Number(body.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantidade deve ser um número maior que zero' },
        { status: 400 }
      );
    }
    updates.quantity = quantity;
  }

  if (body.unit !== undefined) {
    if (typeof body.unit !== 'string' || !body.unit.trim()) {
      return NextResponse.json({ error: 'Unidade inválida' }, { status: 400 });
    }
    updates.unit = body.unit.trim();
  }

  if (body.completed !== undefined) {
    const completed = Number(body.completed);
    if (completed !== 0 && completed !== 1) {
      return NextResponse.json(
        { error: 'completed deve ser 0 (pendente) ou 1 (comprado)' },
        { status: 400 }
      );
    }
    updates.completed = completed;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'Nenhum campo para atualizar' },
      { status: 400 }
    );
  }

  // Atualiza item (RLS: auth.uid() = dono da lista do item)
  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', itemId)
    .eq('list_id', id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ item: data });
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

  const { id, itemId } = await params;

  // Exclui item (RLS: auth.uid() = dono da lista do item)
  const { error, count } = await supabase
    .from('items')
    .delete({ count: 'exact' })
    .eq('id', itemId)
    .eq('list_id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!count) {
    return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
