'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ShareListProps {
  listId: string;
  listName: string;
}

/**
 * ShareList — Componente para compartilhar lista com outros usuários.
 *
 * Funcionalidades:
 * - Compartilhar lista por email
 * - Definir permissão (visualizar ou editar)
 * - Mensagens de feedback
 *
 * Acessibilidade (WCAG 2.1 AA):
 * - aria-label em todos os elementos interativos
 * - Contraste mínimo 4.5:1
 * - Fonte mínima 16px
 * - Sem animações piscantes
 */
export function ShareList({ listId, listName }: ShareListProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createClient();

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage('Erro: não autenticado');
      setLoading(false);
      return;
    }

    // Chamar API de compartilhamento
    const response = await fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list_id: listId, email, permission }),
    });

    const result = await response.json();

    if (response.ok) {
      setMessage('Lista compartilhada com sucesso!');
      setEmail('');
    } else {
      setMessage(`Erro: ${result.error}`);
    }

    setLoading(false);
  };

  return (
    <div className="bg-[var(--app-surface)] rounded-xl shadow p-4">
      <h3 className="font-semibold mb-3" aria-label={`Compartilhar lista ${listName}`}>
        👥 Compartilhar Lista
      </h3>
      
      <form onSubmit={handleShare} className="space-y-3">
        <div>
          <label htmlFor="share-email" className="block text-sm text-gray-600 mb-1">
            Email do usuário
          </label>
          <input
            id="share-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@email.com"
            className="w-full px-3 py-2 border border-[var(--app-border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="share-permission" className="block text-sm text-gray-600 mb-1">
            Permissão
          </label>
          <select
            id="share-permission"
            value={permission}
            onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
            className="w-full px-3 py-2 border border-[var(--app-border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-[var(--app-surface)]"
            aria-label="Permissão de acesso"
          >
            <option value="view">Apenas visualizar</option>
            <option value="edit">Pode editar</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium"
          aria-label={loading ? 'Compartilhando lista...' : 'Compartilhar lista'}
        >
          {loading ? 'Compartilhando...' : 'Compartilhar'}
        </button>
      </form>

      {message && (
        <div 
          className={`mt-3 text-sm ${message.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      )}
    </div>
  );
}