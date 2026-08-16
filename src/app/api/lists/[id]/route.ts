import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serializeItems } from '@/lib/list-items';
import { checkRateLimit } from '@/lib/rate-limit';
import { getListPermission, requireEditor } from '@/lib/shares';

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { id } = await params;

  const { data: list, error: listError } = await supabase
    .from('lists')
    .select('*')
    .eq('id', id)
    .single();

  if (listError || !list) {
    return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
  }

  const perm = await getListPermission(id, user?.id);
  if (!perm) {
    return NextResponse.json({ error: 'Sem permissão para visualizar' }, { status: 403 });
  }

  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .eq('list_id', id)
    .order('created_at', { ascending: true });

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({
    list: { ...list, items: serializeItems(items ?? []) },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const rateLimited = checkRateLimit(request);
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const isOwner = await requireEditor(id, user.id);
  if (!isOwner) {
    return NextResponse.json({ error: 'Sem permissão para editar' }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
  }

  if ('budget' in body) {
    const budgetValue = body.budget === undefined || body.budget === null ? 0 : Number(body.budget);
    if (isNaN(budgetValue) || budgetValue < 0) {
      return NextResponse.json({ error: 'Orçamento deve ser um número positivo' }, { status: 400 });
    }
    updates.budget = budgetValue;
  }

  if ('name' in body) {
    const nameValue = body.name;
    if (typeof nameValue !== 'string' || !nameValue.trim()) {
      return NextResponse.json({ error: 'Nome deve ser uma string não vazia' }, { status: 400 });
    }
    updates.name = nameValue.trim();
  }

  if ('month' in body) {
    const monthValue = body.month;
    if (typeof monthValue !== 'string' || !monthValue.trim()) {
      return NextResponse.json({ error: 'Mês deve ser uma string não vazia' }, { status: 400 });
    }
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(monthValue)) {
      return NextResponse.json({ error: 'Formato de mês inválido. Use YYYY-MM' }, { status: 400 });
    }
    const [, m] = monthValue.split('-');
    const monthNum = Number(m);
    if (monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ error: 'Mês inválido. Use um mês entre 01 e 12.' }, { status: 400 });
    }
    updates.month = monthValue;
  }

  if ('category' in body) {
    const categoryValue = body.category;
    if (categoryValue !== undefined && categoryValue !== null && typeof categoryValue !== 'string') {
      return NextResponse.json({ error: 'category deve ser string ou null' }, { status: 400 });
    }
    updates.category = categoryValue === null ? null : (categoryValue?.trim?.() ?? null) || null;
  }

  if ('archived_at' in body) {
    const archivedValue = body.archived_at;
    if (archivedValue !== undefined && archivedValue !== null && typeof archivedValue !== 'boolean') {
      return NextResponse.json({ error: 'archived_at deve ser boolean ou null' }, { status: 400 });
    }
    updates.archived_at = archivedValue === true ? new Date().toISOString() : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('lists')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated) {
    return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
  }

  return NextResponse.json({ list: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const rateLimited = checkRateLimit(_request);
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  const isOwner = await requireEditor(id, user.id);
  if (!isOwner) {
    return NextResponse.json({ error: 'Sem permissão para excluir' }, { status: 403 });
  }

  const { error } = await supabase.from('lists').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
