'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isValidMonth } from '@/lib/month';

interface User {
  id: string;
  name: string;
  email: string;
}

interface ListData {
  id: string;
  name: string;
  month: string;
  budget: string;
  created_at: string;
  updated_at: string;
}

function formatMonth(month: string): string {
  if (!month) return '';
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<ListData[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const loadData = useCallback(async (userId: string) => {
    try {
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      setUser(userProfile);

      const { data: userLists } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setLists(userLists || []);
    } catch {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login');
        return;
      }

      await loadData(authUser.id);
    };

    checkAuthAndLoad();
  }, [supabase, router, loadData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDuplicateList = async (list: ListData) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const newMonth = prompt(
      `Duplicar lista "${list.name}"\nDigite o mês no formato YYYY-MM:`,
      currentMonth
    );

    if (newMonth === null) return; // cancelou

    const month = newMonth.trim() || currentMonth;
    if (!isValidMonth(month)) {
      setError('Mês inválido. Use o formato YYYY-MM com mês entre 01 e 12.');
      return;
    }

    try {
      setDuplicatingId(list.id);
      setError('');

      const response = await fetch(`/api/lists/${list.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${list.name} (Cópia)`,
          month,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao duplicar lista');
        return;
      }

      setSuccess('Lista duplicada com sucesso!');
      router.push(`/dashboard/lists/${data.list.id}`);
    } catch {
      setError('Erro de conexão ao duplicar lista');
    } finally {
      setDuplicatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🛒</span>
            <span className="text-xl font-bold">ListToBuy</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Olá, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
              aria-label="Sair da conta"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Mensagens de aviso */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-6 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="underline text-xs">Fechar</button>
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg mb-6 text-sm">
            {success}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Minhas Listas</h1>
          <Link
            href="/dashboard/lists/new"
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm transition-colors"
            aria-label="Criar nova lista de compras"
          >
            + Nova Lista
          </Link>
        </div>

        {lists.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-xs">
            <div className="text-6xl mb-4" aria-hidden="true">📝</div>
            <h2 className="text-xl font-semibold mb-2">Nenhuma lista ainda</h2>
            <p className="text-gray-600 mb-6">
              Crie sua primeira lista de compras e comece a economizar.
            </p>
            <Link
              href="/dashboard/lists/new"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
              aria-label="Criar sua primeira lista de compras"
            >
              Criar Primeira Lista
            </Link>
          </div>
        ) : (
          /* Grid de Listas */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lists.map((list) => (
              <div
                key={list.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link
                      href={`/dashboard/lists/${list.id}`}
                      className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors truncate"
                    >
                      {list.name}
                    </Link>
                    <button
                      onClick={() => handleDuplicateList(list)}
                      disabled={duplicatingId === list.id}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                      aria-label={`Duplicar lista ${list.name}`}
                      title="Duplicar esta lista"
                    >
                      {duplicatingId === list.id ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 capitalize mb-4">
                    {formatMonth(list.month)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm">
                  <span className="text-gray-600 font-medium">
                    Orçamento: {Number(list.budget) > 0 ? `R$ ${Number(list.budget).toFixed(2)}` : 'Não definido'}
                  </span>
                  <Link
                    href={`/dashboard/lists/${list.id}`}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Ver Lista →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
