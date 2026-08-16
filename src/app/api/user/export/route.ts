import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const [listsRes, sharesRes] = await Promise.all([
    supabase.from('lists').select('*').eq('user_id', user.id),
    supabase.from('list_shares').select('*').eq('shared_with', user.id),
  ]);

  if (listsRes.error) {
    return NextResponse.json({ error: listsRes.error.message }, { status: 500 });
  }

  const listIds = (listsRes.data ?? []).map((l) => l.id);

  let items: unknown[] = [];
  let prices: unknown[] = [];

  if (listIds.length > 0) {
    const [itemsRes, pricesRes] = await Promise.all([
      supabase.from('items').select('*').in('list_id', listIds),
      supabase.from('prices').select('*').in('list_id', listIds),
    ]);

    if (itemsRes.error) {
      return NextResponse.json({ error: itemsRes.error.message }, { status: 500 });
    }
    if (pricesRes.error) {
      return NextResponse.json({ error: pricesRes.error.message }, { status: 500 });
    }

    items = itemsRes.data ?? [];
    prices = pricesRes.data ?? [];
  }

  const profile = {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
  };

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    profile,
    lists: listsRes.data ?? [],
    items,
    prices,
    shared_lists: sharesRes.data ?? [],
  });
}
