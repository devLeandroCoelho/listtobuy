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
  archived_at: string | null;
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
  const [archiveFilter, setArchiveFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [monthSearch, setMonthSearch] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [editingList, setEditingList] = useState<ListData | null>(null);
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

      let query = supabase
        .from('lists')
        .select('*')
        .eq('user_id', userId);

      if (archiveFilter === 'active') {
        query = query.is('archived_at', null);
      } else if (archiveFilter === 'archived') {
        query = query.not('archived_at', 'is', null);
      }

      const { data: userLists } = await query.order('created_at', { ascending: false });

      let filtered = userLists || [];

      if (nameSearch.trim()) {
        const term = nameSearch.trim().toLowerCase();
        filtered = filtered.filter((list) => list.name.toLowerCase().includes(term));
      }

      if (monthSearch.trim()) {
        const term = monthSearch.trim().toLowerCase();
        filtered = filtered.filter((list) => list.month.includes(term));
      }

      setLists(filtered);
    } catch {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [supabase, archiveFilter, nameSearch, monthSearch]);

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
  }, [supabase, router, loadData, archiveFilter]);

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

  const handleToggleArchive = async (list: ListData) => {
    const isArchived = !!list.archived_at;
    const confirmMessage = isArchived
      ? `Desarquivar lista "${list.name}"? Ela voltará a aparecer na listagem principal.`
      : `Arquivar lista "${list.name}"? Ela será ocultada da listagem principal.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setError('');
      const response = await fetch(`/api/lists/${list.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived_at: !isArchived }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao atualizar lista');
        return;
      }

      setSuccess(isArchived ? 'Lista desarquivada' : 'Lista arquivada');
      await loadData(user!.id);
    } catch {
      setError('Erro de conexão');
    }
  };

  const handleEditList = (list: ListData) => {
    setEditingList(list);
  };

  const handleCloseEditModal = () => {
    setEditingList(null);
  };

  const handleSaveEditList = async (updated: Partial<ListData>) => {
    if (!editingList) return;
    try {
      setError('');
      const response = await fetch(`/api/lists/${editingList.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar lista');
      }

      setSuccess('Lista atualizada');
      await loadData(user!.id);
      setEditingList(null);
    } catch {
      setError('Erro ao salvar alterações');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  // Modal de edição unificada
  const [editName, setEditName] = useState('');
  const [editMonth, setEditMonth] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const openEditModal = (list: ListData) => {
    setEditName(list.name);
    setEditMonth(list.month);
    setEditBudget(String(list.budget));
    setEditingList(list);
    setEditError('');
  };

  const handleSaveEditListModal = async () => {
    if (!editingList) return;
    setEditSaving(true);
    setEditError('');
    try {
      const response = await fetch(`/api/lists/${editingList.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          month: editMonth,
          budget: Number(editBudget) || 0,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar lista');
      }

      setSuccess('Lista atualizada');
      await loadData(user!.id);
      setEditingList(null);
    } catch {
      setEditError('Erro ao salvar alterações');
    } finally {
      setEditSaving(false);
    }
  };

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
          <div className="flex items-center gap-2">
            <select
              value={archiveFilter}
              onChange={(e) => setArchiveFilter(e.target.value as 'all' | 'active' | 'archived')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filtrar listas por status"
            >
              <option value="active">Ativas</option>
              <option value="archived">Arquivadas</option>
              <option value="all">Todas</option>
            </select>
            <Link
              href="/dashboard/lists/new"
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm transition-colors"
              aria-label="Criar nova lista de compras"
            >
              + Nova Lista
            </Link>
          </div>
        </div>

        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Buscar por nome..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Buscar lista por nome"
            />
            <input
              type="text"
              value={monthSearch}
              onChange={(e) => setMonthSearch(e.target.value)}
              placeholder="Filtrar por mês (YYYY-MM)"
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filtrar listas por mês"
            />
            {(nameSearch || monthSearch) && (
              <button
                onClick={() => { setNameSearch(''); setMonthSearch(''); }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Limpar filtros"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {lists.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-xs">
            <div className="text-6xl mb-4" aria-hidden="true">📝</div>
            <h2 className="text-xl font-semibold mb-2">
              {archiveFilter === 'archived' ? 'Nenhuma lista arquivada' : archiveFilter === 'active' ? 'Nenhuma lista ativa' : 'Nenhuma lista ainda'}
            </h2>
            <p className="text-gray-600 mb-6">
              {archiveFilter === 'archived' ? 'Quando arquivar uma lista, ela aparecerá aqui.' : 'Crie sua primeira lista de compras e comece a economizar.'}
            </p>
            {archiveFilter !== 'archived' && (
              <Link
                href="/dashboard/lists/new"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
                aria-label="Criar sua primeira lista de compras"
              >
                Criar Primeira Lista
              </Link>
            )}
          </div>
        ) : (
          /* Grid de Listas */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lists.map((list) => {
              const isArchived = !!list.archived_at;
              return (
                <div
                  key={list.id}
                  className={`bg-white rounded-xl border p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between ${
                    isArchived ? 'border-gray-300 opacity-75' : 'border-gray-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link
                        href={`/dashboard/lists/${list.id}`}
                        className={`text-lg font-bold transition-colors truncate ${
                          isArchived ? 'text-gray-500' : 'text-gray-900 hover:text-blue-600'
                        }`}
                      >
                        {list.name}
                      </Link>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditList(list)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          aria-label={`Editar lista ${list.name}`}
                          title="Editar lista"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleArchive(list)}
                          className={`p-2 rounded-lg transition-colors ${
                            isArchived
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                          }`}
                          aria-label={isArchived ? `Desarquivar lista ${list.name}` : `Arquivar lista ${list.name}`}
                          title={isArchived ? 'Desarquivar' : 'Arquivar'}
                        >
                          {isArchived ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 01-2-2V3a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 01-2 2M5 8a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2" />
                            </svg>
                          )}
                        </button>
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
                    </div>
                    <p className={`text-sm capitalize mb-4 ${isArchived ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatMonth(list.month)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm">
                    <span className={`font-medium ${isArchived ? 'text-gray-400' : 'text-gray-600'}`}>
                      Orçamento: {Number(list.budget) > 0 ? `R$ ${Number(list.budget).toFixed(2)}` : 'Não definido'}
                    </span>
                    <Link
                      href={`/dashboard/lists/${list.id}`}
                      className={`font-semibold ${isArchived ? 'text-gray-400' : 'text-blue-600 hover:underline'}`}
                    >
                      Ver Lista →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {editingList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={handleCloseEditModal}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Editar Lista</h2>
            {editError && <p className="text-red-600 text-sm mb-2">{editError}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
                <input
                  type="text"
                  value={editMonth}
                  onChange={(e) => setEditMonth(e.target.value)}
                  placeholder="YYYY-MM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento (R$)</label>
                <input
                  type="number"
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleCloseEditModal}
                disabled={editSaving}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditListModal}
                disabled={editSaving}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {editSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
