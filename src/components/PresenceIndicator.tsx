'use client';

import { RemoteUser } from '@/lib/realtime/use-list-realtime';

interface PresenceIndicatorProps {
  users: RemoteUser[];
}

export function PresenceIndicator({ users }: PresenceIndicatorProps) {
  if (users.length === 0) return null;

  const now = Date.now();
  const onlineUsers = users.filter((u) => {
    const onlineAt = new Date(u.online_at).getTime();
    return now - onlineAt < 5 * 60 * 1000;
  });

  if (onlineUsers.length === 0) return null;

  const editingUsers = onlineUsers.filter((u) => u.editing_item);
  const viewingUsers = onlineUsers.filter((u) => !u.editing_item);

  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-blue-50/80 border border-blue-100 rounded-lg mb-4">
      <div className="flex -space-x-2">
        {onlineUsers.map((user) => (
          <div
            key={user.user_id}
            className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm"
            title={user.name || user.email || 'Usuário'}
            aria-label={user.name || user.email || 'Usuário online'}
          >
            {(user.name || user.email || '?').slice(0, 2).toUpperCase()}
          </div>
        ))}
      </div>
      <div className="text-sm text-blue-800" aria-live="polite">
        {editingUsers.length > 0 && (
          <span>
            {editingUsers.map((u) => u.name || u.email).join(', ')}{' '}
            {editingUsers.length === 1 ? 'está' : 'estão'} editando
            {viewingUsers.length > 0 && (
              <span className="text-blue-500 mx-1">
                · {viewingUsers.map((u) => u.name || u.email).join(', ')}{' '}
                {viewingUsers.length === 1 ? 'está' : 'estão'} online
              </span>
            )}
          </span>
        )}
        {editingUsers.length === 0 && viewingUsers.length > 0 && (
          <span>
            {viewingUsers.map((u) => u.name || u.email).join(', ')}{' '}
            {viewingUsers.length === 1 ? 'está' : 'estão'} online
          </span>
        )}
      </div>
    </div>
  );
}
