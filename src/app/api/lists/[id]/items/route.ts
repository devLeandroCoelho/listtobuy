import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serializeItem } from '@/lib/list-items';
import { checkRateLimit } from '@/lib/rate-limit';
import { requireEditor } from '@/lib/shares';

/**
 * POST /api/lists/[id]/items — Adiciona um item a uma lista.
 *
 * Body: { name: string, quantity?: number, unit?: string, category?: string | null, reminderDate?: string | null }
 *   - category: opcional. Id da categoria/seção (ex.: 'hortifruti') ou null p/ não categorizado.
 *   - reminderDate: opcional. Data/hora ISO do lembrete ou null.
 * Retorna: { item } (201) | { error }
 */

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
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

  const canEdit = await requireEditor(id, user.id);
  if (!canEdit) {
    return NextResponse.json({ error: 'Sem permissão para editar' }, { status: 403 });
  }

  const { data: list } = await supabase
    .from('lists')
    .select('id')
    .eq('id', id)
    .single();

  if (!list) {
    return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
  }

  const body = await request.json();
  const { name, quantity, unit } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json(
      { error: 'Dados obrigatórios: name' },
      { status: 400 }
    );
  }

  const quantityValue = quantity === undefined || quantity === null ? 1 : Number(quantity);
  if (isNaN(quantityValue) || quantityValue <= 0) {
    return NextResponse.json(
      { error: 'Quantidade deve ser um número maior que zero' },
      { status: 400 }
    );
  }

  const unitValue = unit && typeof unit === 'string' && unit.trim() ? unit.trim() : 'un';

  let categoryValue: string | null | undefined;
  if (body.category !== undefined) {
    if (body.category === null) {
      categoryValue = null;
    } else if (typeof body.category === 'string' && body.category.trim()) {
      categoryValue = body.category.trim();
    } else {
      return NextResponse.json(
        { error: 'Categoria deve ser um texto não vazio ou null' },
        { status: 400 }
      );
    }
  }

  let reminderDateValue: string | null | undefined;
  if (body.reminderDate !== undefined) {
    if (body.reminderDate === null) {
      reminderDateValue = null;
    } else if (typeof body.reminderDate === 'string' && body.reminderDate.trim()) {
      const d = new Date(body.reminderDate.trim());
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { error: 'Data do lembrete inválida. Use formato ISO (ex: 2026-08-20T10:00:00)' },
          { status: 400 }
        );
      }
      reminderDateValue = d.toISOString();
    } else {
      return NextResponse.json(
        { error: 'reminderDate deve ser uma string ISO válida ou null' },
        { status: 400 }
      );
    }
  }

  const payload: Record<string, unknown> = {
    list_id: id,
    name: name.trim(),
    quantity: quantityValue,
    unit: unitValue,
  };
  if (categoryValue !== undefined) {
    payload.category = categoryValue;
  }
  if (reminderDateValue !== undefined) {
    payload.reminder_date = reminderDateValue;
  }

  const { data, error } = await supabase
    .from('items')
    .insert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from('list_activity').insert({
    list_id: id,
    user_id: user.id,
    action: 'create',
    item_id: data.id,
    details: { name: data.name },
  });

  return NextResponse.json({ item: serializeItem(data) }, { status: 201 });
}
