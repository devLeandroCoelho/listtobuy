import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;
const FETCH_CAP = 500;

type Suggestion = { name: string; frequency: number; last_purchase: string };

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();

  const limitRaw = Number(searchParams.get('limit') ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(Math.floor(limitRaw), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  let query = supabase
    .from('items')
    .select('name, created_at')
    .eq('completed', '1')
    .order('created_at', { ascending: false })
    .limit(FETCH_CAP);

  if (q) {
    const escaped = q.replace(/[\\%_]/g, '\\$&');
    query = query.ilike('name', `%${escaped}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  const grouped = new Map<string, { frequency: number; last_purchase: string }>();
  for (const row of rows) {
    if (!row.name) continue;
    const name = row.name as string;
    const createdAt = row.created_at as string;
    const existing = grouped.get(name);
    if (existing) {
      existing.frequency += 1;
      if (createdAt > existing.last_purchase) {
        existing.last_purchase = createdAt;
      }
    } else {
      grouped.set(name, { frequency: 1, last_purchase: createdAt });
    }
  }

  const sorted = Array.from(grouped.entries())
    .sort((a, b) => {
      if (b[1].frequency !== a[1].frequency) return b[1].frequency - a[1].frequency;
      return b[1].last_purchase.localeCompare(a[1].last_purchase);
    })
    .slice(0, limit);

  const suggestions: Suggestion[] = sorted.map(([name, info]) => ({
    name,
    frequency: info.frequency,
    last_purchase: info.last_purchase,
  }));

  return NextResponse.json({ suggestions });
}
