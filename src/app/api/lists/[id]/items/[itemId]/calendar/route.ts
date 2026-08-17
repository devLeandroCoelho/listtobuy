import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateGoogleCalendarUrl, generateICS } from '@/lib/calendar';

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id, itemId } = await params;

  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('*')
    .eq('id', itemId)
    .eq('list_id', id)
    .single();

  if (itemError || !item) {
    return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
  }

  const { data: list } = await supabase
    .from('lists')
    .select('name')
    .eq('id', id)
    .single();

  const title = `${item.name} — ${list?.name || 'Lista de Compras'}`;
  const reminderDate = item.reminder_date ? new Date(item.reminder_date) : new Date();
  const endDate = new Date(reminderDate.getTime() + 60 * 60 * 1000);

  const event = {
    title,
    description: `Item de lista de compras: ${item.name}\nQuantidade: ${item.quantity} ${item.unit}`,
    start: reminderDate,
    end: endDate,
  };

  const googleUrl = generateGoogleCalendarUrl(event);
  const ics = generateICS(event);

  return NextResponse.json({
    googleUrl,
    ics,
    title,
    start: reminderDate.toISOString(),
  });
}
