'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useListItemsSync(listId: string) {
  const supabase = createClient();

  useEffect(() => {
    if (!listId) return;

    const channel = supabase.channel(`list:${listId}:items`);

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'items',
        filter: `list_id=eq.${listId}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          window.dispatchEvent(
            new CustomEvent('list-item-delete', { detail: { id: payload.old.id } })
          );
        } else {
          window.dispatchEvent(
            new CustomEvent('list-item-upsert', { detail: payload.new })
          );
        }
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId, supabase]);
}
