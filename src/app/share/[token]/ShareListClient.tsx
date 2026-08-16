'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface ItemData {
  id: string;
  list_id: string;
  name: string;
  quantity: string;
  unit: string;
  completed: string;
  category: string | null;
  reminder_date: string | null;
  reminder_notified: string;
  created_at: string;
  updated_at: string;
}

interface ListData {
  id: string;
  name: string;
  month: string;
  budget: string;
  category: string | null;
  user_id: string;
  items: ItemData[];
}

interface ShareListClientProps {
  list: ListData;
  permission: string;
  canEdit: boolean;
  token: string;
}

export default function ShareListClient({ list, permission, canEdit, token }: ShareListClientProps) {
  const [items, setItems] = useState<ListData['items']>(list.items);
  const [adding, setAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const supabase = createClient();

  const addItem = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !canEdit) return;

    setAdding(true);
    setError('');

    const res = await fetch('/api/lists/' + list.id + '/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newItemName.trim(), quantity: 1, unit: 'un' }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Erro ao adicionar');
      setAdding(false);
      return;
    }

    const data = await res.json();
    setItems((prev) => [...prev, data.item]);
    setNewItemName('');
    setAdding(false);
  }, [list.id, newItemName, canEdit]);

  const toggleComplete = useCallback(async (item: ItemData) => {
    if (!canEdit) return;

    const newStatus = item.completed === '1' ? '0' : '1';
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, completed: newStatus } : i));

    const res = await fetch('/api/lists/' + list.id + '/items/' + item.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: newStatus }),
    });

    if (!res.ok) {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, completed: item.completed } : i));
      setError('Erro ao atualizar');
    }
  }, [list.id, canEdit]);

  const saveEdit = useCallback(async (itemId: string) => {
    if (!editName.trim() || !canEdit) return;

    const res = await fetch('/api/lists/' + list.id + '/items/' + itemId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    });

    if (!res.ok) {
      setError('Erro ao salvar');
      return;
    }

    const data = await res.json();
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, ...data.item } : i));
    setEditingId(null);
    setEditName('');
  }, [list.id, editName, canEdit]);

  const deleteItem = useCallback(async (itemId: string) => {
    if (!canEdit) return;
    if (!confirm('Remover item?')) return;

    setItems((prev) => prev.filter((i) => i.id !== itemId));

    const res = await fetch('/api/lists/' + list.id + '/items/' + itemId, {
      method: 'DELETE',
    });

    if (!res.ok) {
      setError('Erro ao remover');
    }
  }, [list.id, canEdit]);

  // Polling para sincronização em tempo real (fallback para usuários anônimos)
  useEffect(() => {
    if (!list?.id) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/lists/${list.id}?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setItems(data.list?.items || []);
        }
      } catch {
        // silencia erro de polling
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [list?.id]);

  const completedCount = items.filter((i) => i.completed === '1').length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{list.name}</h1>
          <p className="text-sm text-gray-500">
            {list.month} · {permission === 'owner' ? 'Dono' : permission === 'editor' ? 'Editor' : 'Visualizador'}
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Sair
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg mb-4" role="alert">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">Fechar</button>
        </div>
      )}

      {canEdit && (
        <form onSubmit={addItem} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Adicionar item..."
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button type="submit" disabled={adding} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            {adding ? '...' : '+'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow divide-y">
        {items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Nenhum item</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3">
              {canEdit ? (
                <button
                  onClick={() => toggleComplete(item)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    item.completed === '1' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                  }`}
                >
                  {item.completed === '1' && '✓'}
                </button>
              ) : (
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  item.completed === '1' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                }`}>
                  {item.completed === '1' && '✓'}
                </div>
              )}

              {editingId === item.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => saveEdit(item.id)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)}
                  className="flex-1 px-2 py-1 border rounded"
                  autoFocus
                />
              ) : (
                <span className={`flex-1 ${item.completed === '1' ? 'line-through text-gray-400' : ''}`}>
                  {item.name}
                </span>
              )}

              {canEdit && editingId !== item.id && (
                <button
                  onClick={() => { setEditingId(item.id); setEditName(item.name); }}
                  className="text-gray-400 hover:text-blue-600"
                >
                  ✏️
                </button>
              )}

              {canEdit && (
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  🗑️
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        {completedCount} de {items.length} itens comprados
      </div>
    </div>
  );
}
