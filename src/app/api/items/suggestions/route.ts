import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/items/suggestions?q=arroz&limit=8
 * Sugere nomes de itens que o usuário JÁ USOU em listas anteriores (autocomplete).
 * - Sem `q` → retorna os mais recentes do histórico (para popular o dropdown no foco).
 * - `q` → filtra por name ILIKE '%q%' (case-insensitive, busca literal).
 * - `limit` → máx de sugestões (default 8, máx 20).
 * Resposta: { suggestions: [{ name: string, last_used: string (ISO) }] }
 *
 * O RLS de `items` (auth.uid() via lists) já isola os dados por usuário — sem
 * service role, sem join manual.
 */

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;
const FETCH_CAP = 500; // cap interno de itens recentes a analisar (PostgREST default max rows = 1000)

type Suggestion = { name: string; last_used: string };

export async function GET(request: Request) {
  const supabase = await createClient();

  // Autenticação obrigatória (cookie de sessão)
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

  // Etapa 1: itens mais recentes do usuário (RLS já filtra por auth.uid()).
  // Busca um pouco além do `limit` para absorver duplicatas antes do dedup.
  let query = supabase
    .from('items')
    .select('name, created_at')
    .order('created_at', { ascending: false })
    .limit(Math.min(limit * 10, FETCH_CAP));

  if (q) {
    // Escapa wildcards para tratar a busca como literal (ex.: "50%" não vira coringa)
    const escaped = q.replace(/[\\%_]/g, '\\$&');
    query = query.ilike('name', `%${escaped}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Etapa 2: dedup por nome, mantendo o primeiro item visto (o mais recente, pois
  // a query está ordenada por created_at DESC) como last_used.
  const seen = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.name && !seen.has(item.name)) {
      seen.set(item.name, item.created_at);
    }
    if (seen.size >= limit) break;
  }

  const suggestions: Suggestion[] = Array.from(seen, ([name, last_used]) => ({
    name,
    last_used,
  }));

  return NextResponse.json({ suggestions });
}
