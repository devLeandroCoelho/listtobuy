'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RemoteUser {
  user_id: string;
  name?: string;
  email?: string;
  online_at: string;
  editing_item?: string | null;
}

export function useListRealtime(listId: string, currentUserId?: string) {
  const [onlineUsers, setOnlineUsers] = useState<RemoteUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!listId) return;

    const channel = supabase.channel(`list:${listId}:presence`, {
      config: {
        presence: {
          key: currentUserId || 'anonymous',
        },
      },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users: RemoteUser[] = [];

      Object.values(state as Record<string, any[]>).forEach((presences) => {
        presences.forEach((p: any) => {
          if (currentUserId && p.user_id === currentUserId) return;
          if (!users.find((u) => u.user_id === p.user_id)) {
            users.push(p as RemoteUser);
          }
        });
      });

      setOnlineUsers(users);
    });

    channel.subscribe();

    if (currentUserId) {
      channel.track({
        user_id: currentUserId,
        online_at: new Date().toISOString(),
        editing_item: null,
      });
    }

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId, currentUserId, supabase]);

  const trackPresence = useCallback(
    (editingItemId?: string | null) => {
      if (!channelRef.current || !currentUserId) return;

      channelRef.current.track({
        user_id: currentUserId,
        online_at: new Date().toISOString(),
        editing_item: editingItemId || null,
      });
    },
    [currentUserId]
  );

  return {
    onlineUsers,
    trackPresence,
  };
}
