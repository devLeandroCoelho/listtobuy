import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';

interface CompareItem {
  name: string;
  spentA: number;
  spentB: number;
  difference: number;
  variation: number | null;
}

interface CompareResponse {
  monthA: string;
  monthB: string;
  totalA: number;
  totalB: number;
  absoluteDifference: number;
  percentageDifference: number | null;
  items: CompareItem[];
}

export async function GET(request: Request) {
  const rateLimited = checkRateLimit(request);
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const url = new URL(request.url);
  const monthA = url.searchParams.get('monthA');
  const monthB = url.searchParams.get('monthB');

  if (!monthA || !monthB) {
    return NextResponse.json(
      { error: 'Informe monthA e monthB no formato YYYY-MM' },
      { status: 400 }
    );
  }

  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(monthA) || !monthRegex.test(monthB)) {
    return NextResponse.json(
      { error: 'Formato de mês inválido. Use YYYY-MM' },
      { status: 400 }
    );
  }

  const { data: userLists, error: listsError } = await supabase
    .from('lists')
    .select('id, month')
    .eq('user_id', user.id);

  if (listsError) {
    return NextResponse.json({ error: listsError.message }, { status: 500 });
  }

  const listIds = (userLists || []).map((l) => l.id);
  if (listIds.length === 0) {
    return NextResponse.json({
      monthA,
      monthB,
      totalA: 0,
      totalB: 0,
      absoluteDifference: 0,
      percentageDifference: null,
      items: [],
    });
  }

  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('id, list_id, name, completed')
    .in('list_id', listIds)
    .eq('completed', 1);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const itemIds = (items || []).map((i) => i.id);

  const { data: prices, error: pricesError } = await supabase
    .from('prices')
    .select('item_id, value, month')
    .in('item_id', itemIds.length > 0 ? itemIds : ['00000000-0000-0000-0000-000000000000']);

  if (pricesError) {
    return NextResponse.json({ error: pricesError.message }, { status: 500 });
  }

  const priceMap = new Map<string, Map<string, number>>();
  for (const p of prices || []) {
    const num = Number(p.value);
    if (!Number.isFinite(num)) continue;
    if (!priceMap.has(p.item_id)) {
      priceMap.set(p.item_id, new Map());
    }
    const monthMap = priceMap.get(p.item_id)!;
    monthMap.set(p.month, (monthMap.get(p.month) || 0) + num);
  }

  const listMap = new Map<string, string>();
  for (const l of userLists || []) {
    listMap.set(l.id, l.month);
  }

  const monthAItems = new Map<string, number>();
  const monthBItems = new Map<string, number>();

  for (const item of items || []) {
    const listMonth = listMap.get(item.list_id);
    if (!listMonth) continue;

    const itemPrices = priceMap.get(item.id) || new Map();
    const spentA = itemPrices.get(monthA) || 0;
    const spentB = itemPrices.get(monthB) || 0;

    if (spentA > 0) {
      monthAItems.set(item.name, (monthAItems.get(item.name) || 0) + spentA);
    }
    if (spentB > 0) {
      monthBItems.set(item.name, (monthBItems.get(item.name) || 0) + spentB);
    }
  }

  const allItems = new Set([...monthAItems.keys(), ...monthBItems.keys()]);
  const compareItems: CompareItem[] = Array.from(allItems)
    .map((name) => {
      const spentA = monthAItems.get(name) || 0;
      const spentB = monthBItems.get(name) || 0;
      const difference = spentB - spentA;
      const variation = spentA > 0 ? (difference / spentA) * 100 : (spentB > 0 ? 100 : null);
      return { name, spentA, spentB, difference, variation: variation !== null ? Number(variation.toFixed(2)) : null };
    })
    .filter((item) => item.spentA > 0 || item.spentB > 0)
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

  const totalA = Number(compareItems.reduce((sum, item) => sum + item.spentA, 0).toFixed(2));
  const totalB = Number(compareItems.reduce((sum, item) => sum + item.spentB, 0).toFixed(2));
  const absoluteDifference = Number((totalB - totalA).toFixed(2));

  let percentageDifference: number | null = null;
  if (totalA > 0) {
    percentageDifference = Number(((totalB - totalA) / totalA) * 100);
  } else if (totalB > 0) {
    percentageDifference = 100;
  }

  return NextResponse.json({
    monthA,
    monthB,
    totalA,
    totalB,
    absoluteDifference,
    percentageDifference,
    items: compareItems,
  });
}
