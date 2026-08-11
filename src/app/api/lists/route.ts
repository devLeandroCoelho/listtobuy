import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/lists — Cria uma nova lista de compras.
 *
 * Body: { name: string, month: "YYYY-MM", budget?: number }
 * Retorna: { list } (201) | { error } (4xx/5xx)
 */

export async function POST(request: Request) {
  const supabase = await createClient();

  // Verifica autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { name, month, budget } = body;

  // Validação dos campos obrigatórios
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json(
      { error: 'Dados obrigatórios: name' },
      { status: 400 }
    );
  }

  if (!month || typeof month !== 'string') {
    return NextResponse.json(
      { error: 'Dados obrigatórios: month' },
      { status: 400 }
    );
  }

  // Valida formato do mês (YYYY-MM)
  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(month)) {
    return NextResponse.json(
      { error: 'Formato de mês inválido. Use YYYY-MM' },
      { status: 400 }
    );
  }

  // Valida orçamento numérico não-negativo (opcional)
  const budgetValue = budget === undefined || budget === null ? 0 : Number(budget);
  if (isNaN(budgetValue) || budgetValue < 0) {
    return NextResponse.json(
      { error: 'Orçamento deve ser um número positivo' },
      { status: 400 }
    );
  }

  // Insere lista com user_id do usuário autenticado (RLS: auth.uid() = user_id)
  const { data, error } = await supabase
    .from('lists')
    .insert({
      user_id: user.id,
      name: name.trim(),
      month,
      budget: budgetValue,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ list: data }, { status: 201 });
}
