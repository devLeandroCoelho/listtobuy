import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/shares — Compartilhar lista com usuário.
 * GET /api/shares?list_id=xxx — Buscar compartilhamentos de uma lista.
 * DELETE /api/shares?id=xxx — Remover compartilhamento.
 */

// POST /api/shares — Compartilhar lista com usuário
export async function POST(request: Request) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { list_id, email, permission = 'view' } = body;

  if (!list_id || !email) {
    return NextResponse.json({ error: 'Dados obrigatórios' }, { status: 400 });
  }

  // Buscar usuário pelo email (sem revelar se existe para evitar enumeração)
  const { data: targetUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!targetUser) {
    // Resposta genérica: não revela se o e-mail existe ou não
    return NextResponse.json({ message: 'Convite processado' }, { status: 200 });
  }

  // Verificar se o usuário atual é dono da lista
  const { data: list } = await supabase
    .from('lists')
    .select('user_id')
    .eq('id', list_id)
    .single();

  if (!list || list.user_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  // Verificar se já existe compartilhamento
  const { data: existingShare } = await supabase
    .from('list_shares')
    .select('id')
    .eq('list_id', list_id)
    .eq('user_id', targetUser.id)
    .maybeSingle();

  if (existingShare) {
    return NextResponse.json({ message: 'Convite processado' }, { status: 200 });
  }

  // Criar compartilhamento
  const { data, error } = await supabase
    .from('list_shares')
    .insert({
      list_id,
      user_id: targetUser.id,
      permission,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

// GET /api/shares?list_id=xxx — Buscar compartilhamentos de uma lista
export async function GET(request: Request) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const listId = searchParams.get('list_id');

  if (!listId) {
    return NextResponse.json({ error: 'list_id obrigatório' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('list_shares')
    .select('*, users(name, email)')
    .eq('list_id', listId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/shares?id=xxx — Remover compartilhamento
export async function DELETE(request: Request) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const shareId = searchParams.get('id');

  if (!shareId) {
    return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });
  }

  const { error } = await supabase
    .from('list_shares')
    .delete()
    .eq('id', shareId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}