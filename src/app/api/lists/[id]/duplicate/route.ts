import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidMonth } from '@/lib/month';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/lists/[id]/duplicate — Duplica uma lista existente com todos os seus itens.
 * Body opcional: { month?: string, name?: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Verifica autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // Rate limiting: duplicação de lista (10/min por usuário — operação pesada)
  const limited = enforceRateLimit(user.id, RATE_LIMITS['lists:duplicate']);
  if (limited) return limited;

  // Busca a lista original e verifica ownership
  const { data: originalList, error: listError } = await supabase
    .from('lists')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (listError || !originalList) {
    return NextResponse.json(
      { error: 'Lista não encontrada' },
      { status: 404 }
    );
  }

  // Parse do body opcional para customizar nome e mês
  let month = new Date().toISOString().slice(0, 7);
  let name = `${originalList.name} (Cópia)`;

  try {
    const body = await request.json();
    if (body.month) {
      if (!isValidMonth(body.month)) {
        return NextResponse.json(
          { error: 'Mês inválido. Use o formato YYYY-MM com mês entre 01 e 12.' },
          { status: 400 }
        );
      }
      month = body.month;
    }
    if (body.name && typeof body.name === 'string' && body.name.trim()) {
      name = body.name.trim();
    }
  } catch {
    // Body vazio ou inválido, usa padrões
  }

  // 1. Cria a nova lista clonada
  const { data: newList, error: createListError } = await supabase
    .from('lists')
    .insert({
      user_id: user.id,
      name,
      month,
      budget: originalList.budget,
    })
    .select()
    .single();

  if (createListError || !newList) {
    return NextResponse.json(
      { error: createListError?.message || 'Erro ao duplicar lista' },
      { status: 500 }
    );
  }

  // 2. Busca todos os itens da lista original
  const { data: originalItems } = await supabase
    .from('items')
    .select('*')
    .eq('list_id', originalList.id);

  // 3. Se existirem itens, insere-os na nova lista com status '0' (pendente)
  if (originalItems && originalItems.length > 0) {
    const itemsToInsert = originalItems.map((item) => ({
      list_id: newList.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category ?? null, // Copia a categoria; NULL = não categorizado
      completed: '0', // Todos voltam a ficar pendentes
    }));

    const { error: insertItemsError } = await supabase
      .from('items')
      .insert(itemsToInsert);

    if (insertItemsError) {
      // Se falhar a inserção de itens, limpa a nova lista criada
      await supabase.from('lists').delete().eq('id', newList.id);
      return NextResponse.json(
        { error: 'Erro ao copiar itens para a nova lista' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ list: newList }, { status: 201 });
}
