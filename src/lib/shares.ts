import { createClient } from '@/lib/supabase/server';

export type SharePermission = 'owner' | 'editor' | 'viewer' | null;

export async function getListPermission(listId: string, userId?: string, token?: string): Promise<SharePermission> {
  const supabase = await createClient();
  
  const { data: list } = await supabase
    .from('lists')
    .select('user_id')
    .eq('id', listId)
    .single();

  if (!list) return null;

  if (list.user_id === userId) return 'owner';

  let query = supabase
    .from('list_shares')
    .select('permission')
    .eq('list_id', listId);

  if (token) {
    query = query.or(`token.eq.${token},user_id.eq.${userId}`);
  } else if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data } = await query.maybeSingle();
  return (data?.permission as SharePermission) || null;
}

export async function requireEditor(listId: string, userId?: string, token?: string): Promise<boolean> {
  const perm = await getListPermission(listId, userId, token);
  return perm === 'owner' || perm === 'editor';
}

export async function requireOwner(listId: string, userId?: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: list } = await supabase
    .from('lists')
    .select('user_id')
    .eq('id', listId)
    .single();

  return list?.user_id === userId;
}
