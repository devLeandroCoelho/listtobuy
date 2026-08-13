import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/lists/[id]/items — Adiciona um item a uma lista.
 *
 * Body: { name: string, quantity?: number, unit?: string, category?: string | null }
 *   - category: opcional. Id da categoria/seção (ex.: 'hortifruti') ou null p/ não categorizado.
 * Retorna: { item } (201) | { error }
 */

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const supabase = await createClient();

  // Verifica autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  // Verifica se a lista existe e pertence ao usuário (RLS: auth.uid() = user_id)
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

  // Validação dos campos obrigatórios
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json(
      { error: 'Dados obrigatórios: name' },
      { status: 400 }
    );
  }

  // Valida quantidade numérica positiva (opcional, default 1)
  const quantityValue = quantity === undefined || quantity === null ? 1 : Number(quantity);
  if (isNaN(quantityValue) || quantityValue <= 0) {
    return NextResponse.json(
      { error: 'Quantidade deve ser um número maior que zero' },
      { status: 400 }
    );
  }

  const unitValue = unit && typeof unit === 'string' && unit.trim() ? unit.trim() : 'un';

  // Categoria opcional: string não-vazia ou null (não categorizado).
  // undefined → campo omitido do INSERT (coluna NULL no banco).
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

  // Insere item (RLS: auth.uid() = dono da lista do item)
  const payload: Record<string, unknown> = {
    list_id: id,
    name: name.trim(),
    quantity: quantityValue,
    unit: unitValue,
  };
  if (categoryValue !== undefined) {
    payload.category = categoryValue;
  }

  const { data, error } = await supabase
    .from('items')
    .insert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
