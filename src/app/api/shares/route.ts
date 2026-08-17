import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/shares';

/**
 * POST /api/shares — Criar compartilhamento (email ou link público).
 * GET /api/shares?list_id=xxx — Listar compartilhamentos.
 * DELETE /api/shares?id=xxx — Revogar compartilhamento.
 */

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { list_id, email, permission = 'viewer', generate_link = false } = body;

  if (!list_id) {
    return NextResponse.json({ error: 'Dados obrigatórios' }, { status: 400 });
  }

  const isOwner = await requireOwner(list_id, user.id);
  if (!isOwner) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  if (generate_link) {
    const token = crypto.randomUUID();
    const { data, error } = await supabase
      .from('list_shares')
      .insert({
        list_id,
        token,
        permission: permission || 'viewer',
        shared_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao gerar link' }, { status: 500 });
    }

    return NextResponse.json({
      data,
      link: `${request.headers.get('origin') || 'http://localhost:3000'}/share/${token}`,
    }, { status: 201 });
  }

  if (!email) {
    return NextResponse.json({ error: 'Dados obrigatórios' }, { status: 400 });
  }

  const { data: targetUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!targetUser) {
    return NextResponse.json({ message: 'Convite processado' }, { status: 200 });
  }

  const { data: existingShare } = await supabase
    .from('list_shares')
    .select('id')
    .eq('list_id', list_id)
    .eq('user_id', targetUser.id)
    .maybeSingle();

  if (existingShare) {
    return NextResponse.json({ message: 'Convite processado' }, { status: 200 });
  }

  const { data, error } = await supabase
    .from('list_shares')
    .insert({
      list_id,
      user_id: targetUser.id,
      permission,
      shared_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

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

  const isOwner = await requireOwner(listId, user.id);
  if (!isOwner) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('list_shares')
    .select('*')
    .eq('list_id', listId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

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

  const { data: share } = await supabase
    .from('list_shares')
    .select('list_id')
    .eq('id', shareId)
    .single();

  if (!share) {
    return NextResponse.json({ error: 'Compartilhamento não encontrado' }, { status: 404 });
  }

  const isOwner = await requireOwner(share.list_id, user.id);
  if (!isOwner) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
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
