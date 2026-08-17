import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateGoogleCalendarUrl, generateICS } from '@/lib/calendar';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  const { data: list, error: listError } = await supabase
    .from('lists')
    .select('*')
    .eq('id', id)
    .single();

  if (listError || !list) {
    return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
  }

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('list_id', id);

  const now = new Date();
  const reminderItems = (items || [])
    .filter((item) => item.reminder_date)
    .sort((a, b) => new Date(a.reminder_date!).getTime() - new Date(b.reminder_date!).getTime());

  const title = `Lista de Compras: ${list.name}`;
  const description = reminderItems.length > 0
    ? `Itens com lembrete:\n${reminderItems.map((item) => `• ${item.name} (${new Date(item.reminder_date!).toLocaleString('pt-BR')})`).join('\n')}`
    : `Lista de compras: ${list.name}`;

  const startDate = reminderItems.length > 0
    ? new Date(reminderItems[0].reminder_date!)
    : now;
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const event = {
    title,
    description,
    start: startDate,
    end: endDate,
  };

  const googleUrl = generateGoogleCalendarUrl(event);
  const ics = generateICS(event);

  return NextResponse.json({
    googleUrl,
    ics,
    title,
    start: startDate.toISOString(),
    itemCount: reminderItems.length,
  });
}
