import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe não configurado' }, { status: 500 });
  }

  const body = await request.text();
  const signature = (await headers()).get('stripe-signature') as string;

  let event: { type: string; data: { object: Record<string, unknown> } };

  try {
    const rawEvent = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    event = rawEvent as unknown as { type: string; data: { object: Record<string, unknown> } };
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { metadata?: { userId?: string } };
    const userId = session.metadata?.userId;

    if (userId) {
      const supabase = await createClient();

      const { error } = await supabase
        .from('users')
        .update({ is_premium: true })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user premium status:', error);
        return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
