'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface BugReportData {
  title: string;
  description: string;
  email?: string;
  category: 'bug' | 'suggestion' | 'other';
}

interface BugReportButtonProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BugReportButton({ open, onOpenChange }: BugReportButtonProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setIsOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setInternalOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [formData, setFormData] = useState<BugReportData>({
    title: '',
    description: '',
    email: '',
    category: 'bug',
  });

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstFocusable = modalRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setError('');
    setSuccess(false);
    setFormData({ title: '', description: '', email: '', category: 'bug' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar report');
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch {
      setError('Erro ao enviar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!isControlled && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-30 w-14 h-14 bg-[var(--app-accent)] text-white rounded-full shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Reportar bug"
          title="Reportar bug"
        >
          <span className="text-2xl" aria-hidden="true">🐛</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
          <div
            ref={modalRef}
            className="bg-[var(--app-surface)] rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bug-report-title"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="bug-report-title" className="text-lg font-bold text-[var(--app-text)]">
                🐛 Reportar Bug
              </h2>
              <button
                ref={closeButtonRef}
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-center text-[var(--app-text-secondary)] hover:bg-[var(--app-muted)] rounded-lg transition-colors"
                aria-label="Fechar"
                title="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4" role="alert">{error}</div>
            )}

            {success ? (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg text-center">
                ✅ Report enviado com sucesso!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="bug-title" className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">
                    Título *
                  </label>
                  <input
                    id="bug-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--app-border)] rounded-lg focus:ring-2 focus:ring-[var(--app-accent)]"
                    placeholder="Ex: Erro ao criar lista"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="bug-description" className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">
                    Descrição *
                  </label>
                  <textarea
                    id="bug-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--app-border)] rounded-lg focus:ring-2 focus:ring-[var(--app-accent)] min-h-[100px]"
                    placeholder="Descreva o que aconteceu..."
                    required
                  />
                </div>

                <div>
                  <label htmlFor="bug-email" className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">
                    Email (opcional)
                  </label>
                  <input
                    id="bug-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--app-border)] rounded-lg focus:ring-2 focus:ring-[var(--app-accent)]"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="bug-category" className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">
                    Categoria
                  </label>
                  <select
                    id="bug-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as BugReportData['category'] })}
                    className="w-full px-3 py-2 border border-[var(--app-border)] rounded-lg focus:ring-2 focus:ring-[var(--app-accent)]"
                  >
                    <option value="bug">Bug</option>
                    <option value="suggestion">Sugestão</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-[var(--app-text-secondary)] bg-[var(--app-muted)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-[var(--app-accent)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
