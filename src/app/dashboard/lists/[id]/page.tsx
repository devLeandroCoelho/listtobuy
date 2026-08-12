'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BudgetSummary } from '@/components/BudgetSummary';
import { PriceHistory } from '@/components/PriceHistory';
import { ItemSuggestions } from '@/components/ItemSuggestions';

/**
 * Página de detalhes da lista com gerenciamento de itens e orçamento.
 *
 * Funcionalidades:
 * - Visualiza lista e seus itens
 * - Adiciona novos itens (com quantidade e unidade)
 * - Marca/desmarca itens como comprados
 * - Edita e remove itens
 * - Registra preço por item comprado
 * - Exibe resumo: total de itens, comprados, pendentes
 * - BudgetSummary com orçamento, gasto e resta
 *
 * Acessibilidade (WCAG 2.1 AA):
 * - Todos os elementos interativos com aria-label
 * - Navegação por teclado completa (Tab, Enter, Espaço)
 * - aria-live para mensagens de estado
 * - Contraste mínimo 4.5:1
 * - Fonte mínima 16px
 */

interface ListData {
  id: string;
  name: string;
  month: string;
  budget: string;
  created_at: string;
  updated_at: string;
}

interface ItemData {
  id: string;
  list_id: string;
  name: string;
  quantity: string;
  unit: string;
  completed: string; // "0" ou "1"
  created_at: string;
  updated_at: string;
  price?: number | null; // preço registrado (pode vir do join com prices)
}

/** Formata mês para exibição (YYYY-MM → "Agosto de 2026") */
function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

/** Formata valor monetário */
function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Unidades de medida disponíveis */
const UNIT_OPTIONS = [
  { value: 'un', label: 'Unidade' },
  { value: 'kg', label: 'Quilograma' },
  { value: 'g', label: 'Grama' },
  { value: 'l', label: 'Litro' },
  { value: 'ml', label: 'Mililitro' },
  { value: 'cx', label: 'Caixa' },
  { value: 'pct', label: 'Pacote' },
];

export default function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [list, setList] = useState<ListData | null>(null);
  const [items, setItems] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado do formulário de novo item
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('un');
  const [newItemPrice, setNewItemPrice] = useState(''); // preço opcional ao adicionar
  const [addingItem, setAddingItem] = useState(false);

  // Estado de edição de item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Estado de preço por item
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [savingPrice, setSavingPrice] = useState<Record<string, boolean>>({});
  const [focusPriceItemId, setFocusPriceItemId] = useState<string | null>(null);

  // Estado de histórico de preços
  const [showPriceHistory, setShowPriceHistory] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  /** Limpa mensagem de sucesso após 3 segundos */
  const showSuccess = useCallback((msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  }, []);

  /** Carrega lista e itens */
  const loadData = useCallback(async () => {
    try {
      const response = await fetch(`/api/lists/${id}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao carregar lista');
        setLoading(false);
        return;
      }

      setList(data.list);

      // Para cada item comprado, busca o preço registrado
      const rawItems: ItemData[] = data.list.items || [];
      const itemsWithPrices = await Promise.all(
        rawItems.map(async (item) => {
          if (item.completed === '1') {
            try {
              const priceResponse = await fetch(`/api/prices?item_id=${item.id}`);
              if (priceResponse.ok) {
                const priceData = await priceResponse.json();
                const latestPrice = priceData.prices?.[0];
                return { ...item, price: latestPrice?.value ?? null };
              }
            } catch {
              // Ignora erro de preço — item continua sem preço
            }
          }
          return item;
        })
      );

      setItems(itemsWithPrices);
      setLoading(false);
    } catch {
      setError('Erro de conexão');
      setLoading(false);
    }
  }, [id]);

  /** Verifica autenticação e carrega dados */
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      await loadData();
    };

    checkAuthAndLoad();
  }, [supabase, router, loadData]);

  /** Adiciona novo item à lista */
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingItem(true);
    setError('');

    if (!newItemName.trim()) {
      setError('Digite o nome do item');
      setAddingItem(false);
      return;
    }

    const qty = Number(newItemQty);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantidade deve ser maior que zero');
      setAddingItem(false);
      return;
    }

    try {
      const response = await fetch(`/api/lists/${id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName.trim(),
          quantity: qty,
          unit: newItemUnit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao adicionar item');
        setAddingItem(false);
        return;
      }

      const newItem = data.item;

      // Se um preço foi informado, salva já vinculado ao item
      if (newItemPrice) {
        const priceValue = parseFloat(newItemPrice.replace(',', '.'));
        if (!isNaN(priceValue) && priceValue >= 0) {
          const currentMonth = list?.month || new Date().toISOString().slice(0, 7);
          await fetch('/api/prices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: newItem.id, value: priceValue, month: currentMonth }),
          });
          newItem.price = priceValue;
        }
      }

      // Adiciona item à lista localmente (evita refetch)
      setItems((prev) => [...prev, newItem]);
      setNewItemName('');
      setNewItemQty('1');
      setNewItemUnit('un');
      setNewItemPrice('');
      showSuccess('Item adicionado com sucesso!');
    } catch {
      setError('Erro de conexão');
    } finally {
      setAddingItem(false);
    }
  };

  /** Alterna status comprado/pendente de um item */
  const handleToggleComplete = async (item: ItemData) => {
    const newStatus = item.completed === '1' ? '0' : '1';

    // Optimistic update — atualiza UI imediatamente
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, completed: newStatus } : i))
    );

    try {
      const response = await fetch(`/api/lists/${id}/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newStatus }),
      });

      if (!response.ok) {
        // Reverte em caso de erro
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, completed: item.completed } : i
          )
        );
        setError('Erro ao atualizar item');
      } else {
        if (newStatus === '0') {
          // Desmarcou: limpa preço do estado
          setPriceInputs((prev) => ({ ...prev, [item.id]: '' }));
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, price: null } : i
            )
          );
        } else {
          // Marcou como comprado: foca automaticamente no input de preço
          setFocusPriceItemId(item.id);
          setTimeout(() => setFocusPriceItemId(null), 500);
        }
      }
    } catch {
      // Reverte em caso de erro de conexão
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, completed: item.completed } : i
        )
      );
      setError('Erro de conexão');
    }
  };

  /** Remove um item da lista */
  const handleDeleteItem = async (item: ItemData) => {
    if (!confirm(`Remover "${item.name}" da lista?`)) {
      return;
    }

    // Optimistic update
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    try {
      const response = await fetch(`/api/lists/${id}/items/${item.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Recarrega em caso de erro
        await loadData();
        setError('Erro ao remover item');
      } else {
        showSuccess('Item removido');
      }
    } catch {
      await loadData();
      setError('Erro de conexão');
    }
  };

  /** Inicia edição de um item */
  const startEdit = (item: ItemData) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditQty(item.quantity);
    setEditUnit(item.unit);
  };

  /** Cancela edição */
  const cancelEdit = () => {
    setEditingItemId(null);
    setEditName('');
    setEditQty('');
    setEditUnit('');
  };

  /** Salva edição de item */
  const handleSaveEdit = async (itemId: string) => {
    setSavingEdit(true);

    if (!editName.trim()) {
      setError('Nome do item não pode ser vazio');
      setSavingEdit(false);
      return;
    }

    try {
      const response = await fetch(`/api/lists/${id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          quantity: Number(editQty),
          unit: editUnit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao salvar item');
        setSavingEdit(false);
        return;
      }

      // Atualiza item localmente
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, ...data.item } : i))
      );
      cancelEdit();
      showSuccess('Item atualizado!');
    } catch {
      setError('Erro de conexão');
    } finally {
      setSavingEdit(false);
    }
  };

  /** Remove a lista inteira */
  const handleDeleteList = async () => {
    if (!confirm(`Tem certeza que deseja excluir a lista "${list?.name}"? Todos os itens serão removidos.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/lists/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        setError('Erro ao excluir lista');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Erro de conexão');
    }
  };

  /** Salva preço para um item comprado */
  const handleSavePrice = async (itemId: string) => {
    const priceStr = priceInputs[itemId];
    if (!priceStr) return;

    const priceValue = parseFloat(priceStr.replace(',', '.'));
    if (isNaN(priceValue) || priceValue < 0) {
      setError('Preço inválido');
      return;
    }

    try {
      setSavingPrice((prev) => ({ ...prev, [itemId]: true }));

      const currentMonth = list?.month || new Date().toISOString().slice(0, 7);

      const response = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          value: priceValue,
          month: currentMonth,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao salvar preço');
      }

      // Atualiza estado local com o preço
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, price: priceValue } : i
        )
      );

      // Limpa input
      setPriceInputs((prev) => ({ ...prev, [itemId]: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar preço');
    } finally {
      setSavingPrice((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  /** Atualiza valor do input de preço */
  const handlePriceChange = (itemId: string, value: string) => {
    setPriceInputs((prev) => ({ ...prev, [itemId]: value }));
    if (error) setError('');
  };

  // Cálculos do resumo
  const totalItems = items.length;
  const completedItems = items.filter((i) => i.completed === '1').length;
  const pendingItems = totalItems - completedItems;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Cálculos do orçamento
  const totalSpent = items
    .filter((i) => i.completed === '1' && i.price)
    .reduce((sum, i) => sum + (i.price || 0), 0);
  const budget = Number(list?.budget ?? 0);
  const remaining = budget - totalSpent;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Carregando">
        <div className="text-gray-600 text-base">Carregando lista...</div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-base mb-4">Lista não encontrada</p>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:underline text-base"
            aria-label="Voltar ao painel"
          >
            Voltar ao painel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200" role="banner">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🛒</span>
            <span className="text-xl font-bold">ListToBuy</span>
          </div>
          <nav aria-label="Navegação do usuário">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 text-base"
              aria-label="Voltar para o painel"
            >
              ← Voltar
            </Link>
          </nav>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-8 max-w-2xl" role="main">
        {/* Mensagens de estado */}
        {error && (
          <div
            className="p-4 bg-red-50 text-red-700 rounded-lg mb-6 text-base"
            role="alert"
            aria-live="assertive"
          >
            {error}
            <button
              onClick={() => setError('')}
              className="ml-2 underline hover:text-red-900"
              aria-label="Fechar mensagem de erro"
            >
              Fechar
            </button>
          </div>
        )}

        {success && (
          <div
            className="p-4 bg-green-50 text-green-700 rounded-lg mb-6 text-base"
            role="status"
            aria-live="polite"
          >
            {success}
          </div>
        )}

        {/* Cabeçalho da lista */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{list.name}</h1>
              <p className="text-gray-600 text-base mt-1">
                {formatMonth(list.month)}
              </p>
            </div>
            <button
              onClick={handleDeleteList}
              className="p-2 text-gray-400 hover:text-red-600 rounded-lg
                         hover:bg-red-50 transition-colors duration-150"
              aria-label={`Excluir lista ${list.name}`}
              title="Excluir lista"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4 text-center" role="region" aria-label="Resumo da lista">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900" aria-label={`${totalItems} itens no total`}>
                {totalItems}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-700" aria-label={`${completedItems} itens comprados`}>
                {completedItems}
              </div>
              <div className="text-sm text-gray-600">Comprados</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-amber-700" aria-label={`${pendingItems} itens pendentes`}>
                {pendingItems}
              </div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </div>
          </div>

          {/* Barra de progresso */}
          {totalItems > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progresso</span>
                <span aria-label={`${progressPercent} por cento completo`}>{progressPercent}%</span>
              </div>
              <div
                className="h-2 bg-gray-200 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progresso da compra: ${progressPercent}%`}
              >
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Orçamento */}
          {budget > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
              <span className="text-sm text-gray-600">Orçamento: </span>
              <span className="text-lg font-bold text-blue-700">
                {formatCurrency(budget)}
              </span>
            </div>
          )}
        </div>

        {/* BudgetSummary */}
        {budget > 0 && (
          <div className="mb-6">
            <BudgetSummary
              budget={budget}
              totalSpent={totalSpent}
              remaining={remaining}
            />
          </div>
        )}

        {/* Formulário de novo item */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Adicionar Item</h2>

          <form onSubmit={handleAddItem} className="space-y-4">
            {/* Linha responsiva: no mobile (< 640px) o campo de nome ocupa a
                largura total em linha própria e quantidade/unidade ficam lado a
                lado — evita o campo espremido em viewports 320–375px. Em telas
                >= 640px mantém o layout original de três colunas. */}
            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Nome do item (com autocomplete de sugestões) */}
              <div className="w-full sm:flex-1 sm:min-w-0">
                <label htmlFor="item-name" className="sr-only">
                  Nome do item
                </label>
                <ItemSuggestions
                  id="item-name"
                  value={newItemName}
                  onValueChange={setNewItemName}
                  onSelect={setNewItemName}
                  placeholder="Ex: Leite, Arroz, Feijão..."
                  required
                />
              </div>

              {/* Quantidade + Unidade — lado a lado; cabem juntas em 320px */}
              <div className="flex gap-3 shrink-0">
                <div className="w-24">
                  <label htmlFor="item-qty" className="sr-only">
                    Quantidade
                  </label>
                  <input
                    id="item-qty"
                    type="number"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base text-center
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    aria-required="true"
                    aria-label="Quantidade"
                  />
                </div>
                <div className="w-28">
                  <label htmlFor="item-unit" className="sr-only">
                    Unidade de medida
                  </label>
                  <select
                    id="item-unit"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    aria-label="Unidade de medida"
                  >
                    {UNIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Preço opcional */}
            <div className="flex items-center gap-3">
              <label htmlFor="item-price" className="text-sm text-gray-600 whitespace-nowrap">
                Preço (opcional)
              </label>
              <div className="relative w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                <input
                  id="item-price"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg text-base
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Preço do item (opcional)"
                />
              </div>
              <span className="text-xs text-gray-400">Pode registrar depois também</span>
            </div>

            <button
              type="submit"
              disabled={addingItem}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg text-base font-medium
                         hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-150"
              aria-label={addingItem ? 'Adicionando item...' : 'Adicionar item à lista'}
            >
              {addingItem ? 'Adicionando...' : '+ Adicionar Item'}
            </button>
          </form>
        </div>

        {/* Lista de itens */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">
            Itens da Lista
            <span className="text-gray-500 font-normal ml-2">({totalItems})</span>
          </h2>

          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3" aria-hidden="true">📝</div>
              <p className="text-base">Nenhum item ainda. Adicione o primeiro!</p>
            </div>
          ) : (
            <ul className="space-y-2" role="list" aria-label="Itens da lista de compras">
              {items.map((item) => {
                const isCompleted = item.completed === '1';
                const currentPrice = priceInputs[item.id] || '';

                return (
                  <li
                    key={item.id}
                    className={`p-3 rounded-lg border transition-colors duration-150
                      ${isCompleted
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    {editingItemId === item.id ? (
                      /* Modo de edição */
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-base
                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-label="Nome do item"
                          autoFocus
                        />
                        <input
                          type="number"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          min="0.01"
                          step="0.01"
                          className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-base text-center
                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-label="Quantidade"
                        />
                        <select
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value)}
                          className="px-2 py-2 border border-gray-300 rounded-lg text-base
                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          aria-label="Unidade"
                        >
                          {UNIT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          disabled={savingEdit}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          aria-label="Salvar alterações"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="Cancelar edição"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      /* Modo de visualização */
                      <div className="flex items-start gap-3">
                        {/* Checkbox de comprado */}
                        <div className="pt-1">
                          <button
                            onClick={() => handleToggleComplete(item)}
                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                              transition-colors duration-150
                              ${isCompleted
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-green-500'
                              }`}
                            aria-label={
                              isCompleted
                                ? `Marcar ${item.name} como pendente`
                                : `Marcar ${item.name} como comprado`
                            }
                            aria-pressed={isCompleted}
                          >
                            {isCompleted && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>

                        {/* Informações do item */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-base font-medium ${
                                isCompleted
                                  ? 'line-through text-gray-500'
                                  : 'text-gray-900'
                              }`}
                            >
                              {item.name}
                            </span>
                            <span className="text-sm text-gray-500 whitespace-nowrap">
                              {item.quantity} {item.unit}
                            </span>
                          </div>

                          {/* Seção de preço — aparece apenas quando item está comprado */}
                          {isCompleted && (
                            <div className="mt-2 flex items-center gap-2">
                              {item.price != null ? (
                                /* Preço já registrado */
                                <div className="flex items-center gap-2">
                                  <span
                                    className="text-sm font-medium text-green-700"
                                    aria-label={`Preço registrado: ${formatCurrency(item.price)}`}
                                  >
                                    {formatCurrency(item.price)}
                                  </span>
                                  <button
                                    onClick={() => setShowPriceHistory(showPriceHistory === item.id ? null : item.id)}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    aria-label={showPriceHistory === item.id ? `Ocultar histórico de ${item.name}` : `Ver histórico de ${item.name}`}
                                  >
                                    {showPriceHistory === item.id ? 'Ocultar' : 'Histórico'}
                                  </button>
                                </div>
                              ) : (
                                /* Input para registrar preço */
                                <div className="flex items-center gap-2 w-full">
                                  <label
                                    htmlFor={`price-${item.id}`}
                                    className="text-sm text-gray-600 whitespace-nowrap"
                                  >
                                    Preço:
                                  </label>
                                  <input
                                    id={`price-${item.id}`}
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0,00"
                                    value={currentPrice}
                                    onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSavePrice(item.id);
                                      }
                                    }}
                                    autoFocus={focusPriceItemId === item.id}
                                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    aria-label={`Digite o preço de ${item.name}`}
                                  />
                                  <button
                                    onClick={() => handleSavePrice(item.id)}
                                    disabled={!currentPrice || savingPrice[item.id]}
                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    aria-label={
                                      savingPrice[item.id]
                                        ? 'Salvando preço...'
                                        : `Salvar preço de ${item.name}`
                                    }
                                  >
                                    {savingPrice[item.id] ? '...' : 'OK'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Botões de ação */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg
                                       transition-colors duration-150"
                            aria-label={`Editar ${item.name}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg
                                       transition-colors duration-150"
                            aria-label={`Remover ${item.name}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Histórico de preços - aparece quando um item é selecionado */}
        {showPriceHistory && (
          <div className="mt-6">
            <PriceHistory 
              itemId={showPriceHistory} 
              itemName={items.find(i => i.id === showPriceHistory)?.name || ''} 
            />
            <button
              onClick={() => setShowPriceHistory(null)}
              className="mt-2 text-sm text-gray-600 hover:text-gray-900"
              aria-label="Fechar histórico de preços"
            >
              Fechar histórico
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
