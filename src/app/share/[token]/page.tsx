import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ShareListClient from './ShareListClient';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: share } = await supabase
    .from('list_shares')
    .select('list_id, permission')
    .eq('token', token)
    .maybeSingle();

  if (!share) {
    redirect('/');
  }

  const { data: list } = await supabase
    .from('lists')
    .select('id, name, month, budget, category, user_id')
    .eq('id', share.list_id)
    .single();

  if (!list) {
    redirect('/');
  }

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('list_id', list.id)
    .order('created_at', { ascending: true });

  const canEdit = share.permission === 'editor' || share.permission === 'owner';

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <ShareListClient
        list={{ ...list, items: items ?? [] }}
        permission={share.permission}
        canEdit={canEdit}
        token={token}
      />
    </div>
  );
}
