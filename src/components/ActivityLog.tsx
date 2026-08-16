'use client';

import { useEffect, useState } from 'react';

interface Activity {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  user_id: string;
}

interface ActivityLogProps {
  listId: string;
}

const ACTION_LABELS: Record<string, string> = {
  create: 'adicionou',
  update: 'alterou',
  delete: 'removeu',
};

export function ActivityLog({ listId }: ActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch(`/api/lists/${listId}/activity`);
        if (res.ok) {
          const data = await res.json();
          setActivities(data.activity || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 5000);
    return () => clearInterval(interval);
  }, [listId]);

  if (loading) return null;
  if (activities.length === 0) return null;

  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Histórico de alterações</h3>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {activities.slice(0, 10).map((activity) => {
          const itemName = typeof activity.details?.name === 'string' ? activity.details.name : null;
          return (
            <div key={activity.id} className="text-xs text-gray-600 flex items-center gap-2">
              <span className="font-medium">
                {new Date(activity.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span>{ACTION_LABELS[activity.action] || activity.action}</span>
              {itemName && (
                <span className="font-medium text-gray-800">"{itemName}"</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
