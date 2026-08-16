import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serializeItem } from '@/lib/list-items';
import { generateGoogleCalendarUrl, generateICS, CalendarEvent } from '@/lib/calendar';
import { checkRateLimit } from '@/lib/rate-limit';
import { requireEditor } from '@/lib/shares';

/**
 * PUT /api/lists/[id]/items/[itemId] — Edita um item (body parcial).
 * DELETE /api/lists/[id]/items/[itemId] — Exclui um item.
 *
 * PUT Body (parcial): { name?, quantity?, unit?, completed?, category?, reminderDate? }
 *   - category: opcional. Id da categoria/seção (ex.: 'hortifruti') ou null (limpa) ou undefined (não altera).
 *   - reminderDate: opcional. Data/hora ISO do lembrete ou null para remover.
 * PUT Retorna: { item } | { error }
 * DELETE Retorna: { success: true } | { error }
 */

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const rateLimited = checkRateLimit(request);
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id, itemId } = await params;

  const canEdit = await requireEditor(id, user.id);
  if (!canEdit) {
    return NextResponse.json({ error: 'Sem permissão para editar' }, { status: 403 });
  }

  const body = await request.json();

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

  if (body.category !== undefined) {
    if (body.category === null) {
      updates.category = null;
    } else if (typeof body.category === 'string' && body.category.trim()) {
      updates.category = body.category.trim();
    } else {
      return NextResponse.json(
        { error: 'Categoria deve ser um texto não vazio ou null' },
        { status: 400 }
      );
    }
  }

  if (body.reminderDate !== undefined) {
    if (body.reminderDate === null) {
      updates.reminder_date = null;
      updates.reminder_notified = false;
    } else if (typeof body.reminderDate === 'string' && body.reminderDate.trim()) {
      const d = new Date(body.reminderDate.trim());
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { error: 'Data do lembrete inválida. Use formato ISO (ex: 2026-08-20T10:00:00)' },
          { status: 400 }
        );
      }
      updates.reminder_date = d.toISOString();
      updates.reminder_notified = false;
    } else {
      return NextResponse.json(
        { error: 'reminderDate deve ser uma string ISO válida ou null' },
        { status: 400 }
      );
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'Nenhum campo para atualizar' },
      { status: 400 }
    );
  }

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

  await supabase.from('list_activity').insert({
    list_id: id,
    user_id: user.id,
    action: 'update',
    item_id: data.id,
    details: { changes: Object.keys(updates) },
  });

  return NextResponse.json({ item: serializeItem(data) });
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

  const { id, itemId } = await params;

  const canEdit = await requireEditor(id, user.id);
  if (!canEdit) {
    return NextResponse.json({ error: 'Sem permissão para excluir' }, { status: 403 });
  }

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

  await supabase.from('list_activity').insert({
    list_id: id,
    user_id: user.id,
    action: 'delete',
    item_id: itemId,
    details: {},
  });

  return NextResponse.json({ success: true });
}
