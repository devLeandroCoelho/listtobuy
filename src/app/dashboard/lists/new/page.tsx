'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { CATEGORIES } from '@/lib/categories';
import { LIST_TEMPLATES, getTemplateById, type ListTemplate } from '@/lib/templates';
import localforage from 'localforage';

/**
 * Página de criação de lista de compras.
 *
 * Formulário acessível (WCAG 2.1 AA) com:
 * - Labels associados via htmlFor/id
 * - aria-required em campos obrigatórios
 * - aria-live para mensagens de erro/sucesso
 * - Navegação por teclado completa
 * - Feedback visual em todas as interações
 * - Fonte mínima 16px (via Tailwind text-base)
 */

/** Gera opções de mês para os próximos 12 meses */
function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
    options.push({ value, label });
  }

  return options;
}

const PENDING_LISTS_KEY = 'pending_lists';

export default function NewListPage() {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isOnline = useOnlineStatus();
  const { addToQueue } = useOfflineSync();

  // Campos do formulário
  const [name, setName] = useState('');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [budget, setBudget] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const router = useRouter();
  const supabase = createClient();
  const monthOptions = getMonthOptions();

  const selectedTemplate = getTemplateById(selectedTemplateId);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Auth timeout')), 3000);
        });

        const { data: { user: authUser } } = await Promise.race([
          authPromise,
          timeoutPromise,
        ]);

        if (!authUser) {
          if (isOnline) {
            router.push('/login');
            return;
          }
          setLoading(false);
          return;
        }

        setUser({ id: authUser.id, name: authUser.email?.split('@')[0] || 'Usuário' });
        setLoading(false);
      } catch {
        if (isOnline) {
          router.push('/login');
          return;
        }
        setLoading(false);
      }
    };

    checkAuth();
  }, [supabase, router, isOnline]);

  /** Atualiza nome quando template é selecionado */
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = getTemplateById(templateId);
      if (template) {
        setName(`Lista de ${template.name}`);
      }
    } else {
      setName('');
    }
  };

  /** Envia formulário de criação de lista */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!name.trim()) {
      setError('Digite o nome da lista');
      setSubmitting(false);
      return;
    }

    if (!month) {
      setError('Selecione o mês');
      setSubmitting(false);
      return;
    }

    try {
      if (!isOnline) {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const localList = {
          id: tempId,
          name: name.trim(),
          month,
          budget: budget ? Number(budget) : 0,
          category: category || null,
          user_id: user?.id || 'local',
          archived_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const pendingLists = await localforage.getItem<typeof localList[]>('pending_lists') || [];
        pendingLists.push(localList);
        await localforage.setItem('pending_lists', pendingLists);

        await addToQueue({
          type: 'create',
          endpoint: '/api/lists',
          method: 'POST',
          body: { name: name.trim(), month, budget: budget ? Number(budget) : 0 },
        });

        router.push('/dashboard');
        return;
      }

      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          month,
          budget: budget ? Number(budget) : 0,
          category: category || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao criar lista');
        setSubmitting(false);
        return;
      }

      // Redireciona para a lista criada, com template param se houver
      if (selectedTemplateId) {
        router.push(`/dashboard/lists/${data.list.id}?template=${selectedTemplateId}`);
      } else {
        router.push(`/dashboard/lists/${data.list.id}`);
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Carregando">
        <div className="text-[var(--app-text-secondary)] text-base">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      {/* Header */}
      <header className="bg-[var(--app-surface)] border-b border-[var(--app-border)]" role="banner">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🛒</span>
            <span className="text-xl font-bold">ListToBuy</span>
          </div>
          <nav aria-label="Navegação do usuário">
            <Link
              href="/dashboard"
              className="text-[var(--app-text-secondary)] hover:text-[var(--app-text)] text-base"
              aria-label="Voltar para o painel"
            >
              ← Voltar
            </Link>
          </nav>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-8 max-w-lg" role="main">
        <h1 className="text-2xl font-bold mb-6">Nova Lista de Compras</h1>

        {/* Mensagem de erro — aria-live para leitores de tela */}
        {error && (
          <div
            className="p-4 bg-red-50 text-red-700 rounded-lg mb-6 text-base"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--app-surface)] rounded-xl shadow-sm border border-[var(--app-border)] p-6 space-y-6"
          noValidate
        >
          {/* Campo: Template */}
          <div>
            <label
              htmlFor="list-template"
              className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1"
            >
              Template
            </label>
            <select
              id="list-template"
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-4 py-3 border border-[var(--app-border)] rounded-lg text-base
                         focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent
                         bg-[var(--app-surface)]"
            >
              <option value="">Sem template</option>
              {LIST_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.icon} {template.name}
                </option>
              ))}
            </select>
            {selectedTemplate && (
              <p className="mt-1 text-sm text-[var(--app-text-secondary)]">
                {selectedTemplate.items.length} itens pré-definidos serão adicionados
              </p>
            )}
          </div>

          {/* Campo: Nome da Lista */}
          <div>
            <label
              htmlFor="list-name"
              className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1"
            >
              Nome da Lista <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="list-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Compras de Agosto"
              className="w-full px-4 py-3 border border-[var(--app-border)] rounded-lg text-base
                         focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent
                         placeholder:text-[var(--app-text-secondary)]"
              required
              aria-required="true"
              aria-describedby="list-name-help"
              autoComplete="off"
            />
            <p id="list-name-help" className="mt-1 text-sm text-[var(--app-text-secondary)]">
              Exemplo: &quot;Compras do Mês&quot;, &quot;Feira da Semana&quot;
            </p>
          </div>

          {/* Campo: Mês de Referência */}
          <div>
            <label
              htmlFor="list-month"
              className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1"
            >
              Mês de Referência <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="list-month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-4 py-3 border border-[var(--app-border)] rounded-lg text-base
                         focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent
                         bg-[var(--app-surface)]"
              required
              aria-required="true"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Campo: Categoria */}
          <div>
            <label
              htmlFor="list-category"
              className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1"
            >
              Categoria
            </label>
            <select
              id="list-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-[var(--app-border)] rounded-lg text-base
                         focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent
                         bg-[var(--app-surface)]"
            >
              <option value="">Sem categoria</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Campo: Orçamento Mensal */}
          <div>
            <label
              htmlFor="list-budget"
              className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1"
            >
              Orçamento Mensal (R$)
            </label>
            <input
              id="list-budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0,00"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-[var(--app-border)] rounded-lg text-base
                         focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent
                         placeholder:text-[var(--app-text-secondary)]"
              aria-describedby="list-budget-help"
            />
            <p id="list-budget-help" className="mt-1 text-sm text-[var(--app-text-secondary)]">
              Quanto você pretende gastar este mês? (opcional)
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-6 bg-[var(--app-accent)] text-white rounded-lg text-base font-medium
                         hover:opacity-90 focus:ring-2 focus:ring-[var(--app-accent)] focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-150"
              aria-label={submitting ? 'Criando lista...' : 'Criar nova lista'}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Criando...
                </span>
              ) : (
                'Criar Lista'
              )}
            </button>

            <Link
              href="/dashboard"
              className="py-3 px-6 border border-[var(--app-border)] text-[var(--app-text-secondary)] rounded-lg text-base font-medium
                         hover:bg-[var(--app-bg)] focus:ring-2 focus:ring-[var(--app-border)] focus:ring-offset-2
                         transition-colors duration-150 text-center"
              aria-label="Cancelar e voltar ao painel"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
