'use client';

import { useState } from 'react';
import { ShareList } from '@/components/ShareList';

interface Share {
  id: string;
  user_id?: string;
  token?: string;
  permission: string;
  users?: { name?: string; email?: string };
}

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  listName: string;
}

export default function ShareModal({ open, onOpenChange, listId, listName }: ShareModalProps) {
  const [linkPermission, setLinkPermission] = useState<'viewer' | 'editor'>('viewer');
  const [generatedLink, setGeneratedLink] = useState('');
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    const res = await fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list_id: listId, permission: linkPermission, generate_link: true }),
    });
    const data = await res.json();
    if (res.ok) {
      setGeneratedLink(data.link);
      loadShares();
    }
    setLoading(false);
  };

  const loadShares = async () => {
    const res = await fetch('/api/shares?list_id=' + listId);
    if (res.ok) {
      const data = await res.json();
      setShares(data.data ?? []);
    }
  };

  const revokeShare = async (shareId: string) => {
    const res = await fetch('/api/shares?id=' + shareId, { method: 'DELETE' });
    if (res.ok) {
      setShares((prev) => prev.filter((s) => s.id !== shareId));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => onOpenChange(false)}>
      <div
        className="bg-[var(--app-surface)] rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="share-modal-title" className="text-lg font-bold">Compartilhar Lista</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="w-10 h-10 flex items-center justify-center text-[var(--app-text-secondary)] hover:bg-[var(--app-muted)] rounded-lg"
            aria-label="Fechar compartilhamento"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-2">Link público</h3>
            <div className="flex gap-2 mb-2">
              <select
                value={linkPermission}
                onChange={(e) => setLinkPermission(e.target.value as 'viewer' | 'editor')}
                className="px-3 py-2 border rounded-lg bg-[var(--app-surface)]"
              >
                <option value="viewer">Visualizador</option>
                <option value="editor">Editor</option>
              </select>
              <button
                onClick={generateLink}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '...' : 'Gerar link'}
              </button>
            </div>
            {generatedLink && (
              <div className="flex gap-2">
                <input readOnly value={generatedLink} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                <button
                  onClick={() => navigator.clipboard.writeText(generatedLink)}
                  className="px-3 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300"
                >
                  Copiar
                </button>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Compartilhar por email</h3>
            <ShareList listId={listId} listName={listName} />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Acessos</h3>
            <div className="space-y-2">
              {shares.length === 0 && <p className="text-sm text-gray-500">Nenhum acesso compartilhado</p>}
              {shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between p-2 bg-[var(--app-muted)] rounded-lg">
                  <div>
                    <p className="text-sm font-medium">
                      {share.users?.name || share.users?.email || share.token ? 'Link público' : 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {share.permission === 'owner' ? 'Dono' : share.permission === 'editor' ? 'Editor' : 'Visualizador'}
                    </p>
                  </div>
                  <button
                    onClick={() => revokeShare(share.id)}
                    className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                  >
                    Revogar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
