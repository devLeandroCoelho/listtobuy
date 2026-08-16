import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';

interface MonthlyStats {
  month: string;
  totalSpent: number;
  totalItems: number;
  listCount: number;
}

interface TopItem {
  name: string;
  count: number;
  totalSpent: number;
}

interface StatsResponse {
  monthly: MonthlyStats[];
  topItems: TopItem[];
  averagePerList: number;
  currentMonthTotal: number;
  previousMonthTotal: number;
  monthOverMonthChange: number | null;
}

export async function GET(request: Request) {
  const rateLimited = checkRateLimit(request);
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;

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
      monthly: [],
      topItems: [],
      averagePerList: 0,
      currentMonthTotal: 0,
      previousMonthTotal: 0,
      monthOverMonthChange: null,
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

  const priceMap = new Map<string, number>();
  for (const p of prices || []) {
    const num = Number(p.value);
    if (!Number.isFinite(num)) continue;
    const current = priceMap.get(p.item_id);
    priceMap.set(p.item_id, (current || 0) + num);
  }

  const listMap = new Map<string, string>();
  for (const l of userLists || []) {
    listMap.set(l.id, l.month);
  }

  const monthlyMap = new Map<string, { totalSpent: number; itemCount: number; listSet: Set<string> }>();
  const itemCountMap = new Map<string, { count: number; totalSpent: number }>();

  for (const item of items || []) {
    const month = listMap.get(item.list_id);
    if (!month) continue;

    const spent = priceMap.get(item.id) || 0;

    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { totalSpent: 0, itemCount: 0, listSet: new Set() });
    }
    const monthData = monthlyMap.get(month)!;
    monthData.totalSpent += spent;
    monthData.itemCount += 1;
    monthData.listSet.add(item.list_id);

    if (!itemCountMap.has(item.name)) {
      itemCountMap.set(item.name, { count: 0, totalSpent: 0 });
    }
    const itemData = itemCountMap.get(item.name)!;
    itemData.count += 1;
    itemData.totalSpent += spent;
  }

  const monthly: MonthlyStats[] = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      totalSpent: Number(data.totalSpent.toFixed(2)),
      totalItems: data.itemCount,
      listCount: data.listSet.size,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const topItems: TopItem[] = Array.from(itemCountMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      totalSpent: Number(data.totalSpent.toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalSpentAll = monthly.reduce((sum, m) => sum + m.totalSpent, 0);
  const totalLists = listIds.length;
  const averagePerList = totalLists > 0 ? Number((totalSpentAll / totalLists).toFixed(2)) : 0;

  const currentMonthData = monthly.find((m) => m.month === currentMonth);
  const previousMonthData = monthly.find((m) => m.month === previousMonth);

  const currentMonthTotal = currentMonthData?.totalSpent || 0;
  const previousMonthTotal = previousMonthData?.totalSpent || 0;

  let monthOverMonthChange: number | null = null;
  if (previousMonthTotal > 0) {
    monthOverMonthChange = Number(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100);
  } else if (currentMonthTotal > 0) {
    monthOverMonthChange = 100;
  }

  return NextResponse.json({
    monthly,
    topItems,
    averagePerList,
    currentMonthTotal,
    previousMonthTotal,
    monthOverMonthChange,
  });
}
