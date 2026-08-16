import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getListPermission } from '@/lib/shares';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { id } = await params;

  const perm = await getListPermission(id, user?.id);
  if (!perm) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('list_activity')
    .select('*')
    .eq('list_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activity: data ?? [] });
}
