'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BudgetSummary } from '@/components/BudgetSummary';
import { PriceHistory } from '@/components/PriceHistory';
import { ItemSuggestions } from '@/components/ItemSuggestions';
import { getCategoryById, guessCategoryByName, CATEGORIES } from '@/lib/categories';
import { groupItemsByCategory, resolveItemCategory } from '@/lib/grouping';
import { sumCompletedSpent } from '@/lib/budget';
import { buildQuickAddPayload } from '@/lib/list-items';

/**
 * Página de detalhes da lista com gerenciamento de itens e orçamento.
 *
 * Layout estilo Listonic (redesign 13/08/2026):
 * - Header sticky único com "← Voltar", nome + mês curto, miniStatus
 *   "x de y · %" (D10) e resumo em accordion colapsado (#54, D2)
 * - Linhas de item compactas: círculo 44px para marcar comprado, nome
 *   truncado (riscado quando comprado), chip de quantidade (toca → edição
 *   com foco no qty, D7), sub-linha de preço só em comprados e ações
 *   editar/excluir de 44px — box único com dividers finos (D6)
 * - Histórico de preços INLINE na linha do item (D5), single-open
 * - Comprados em accordion colapsável no fundo, itens riscados (D8)
 * - Barra de base FIXA (delta 13/08): quick-add com ItemSuggestions
 *   (payload { name, quantity: 1, unit: 'un' }, sem price/category) +
 *   chip de orçamento que abre um bottom-sheet para cima com o
 *   BudgetSummary — único local de orçamento e única entrada de adição
 *   em mobile E desktop (FAB e form inline removidos)
 * - Marca/desmarca comprados, edita, remove e registra preço por item
 *   comprado (o quick-add não pede preço; preço entra ao marcar comprado)
 *
 * Acessibilidade (WCAG 2.1 AA):
 * - Todos os elementos interativos com aria-label e alvo ≥ 44px
 * - Navegação por teclado completa (Tab, Enter, Espaço, Esc fecha)
 * - aria-pressed no círculo de comprado, aria-expanded/aria-controls nos
 *   accordions (header, comprados) e no sheet de orçamento
 * - Sheet: role="dialog" aria-modal, Tab trap, foco entra no painel e
 *   volta ao chip ao fechar
 * - aria-live: role="status" na barra (adição) e role="alert" (erro inline)
 * - Contraste mínimo 4.5:1, fonte mínima 16px, sem animações piscantes
 */

interface ListData {
  id: string;
  name: string;
  month: string;
  budget: string;
  archived_at: string | null;
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
  price?: number | string | null; // preço registrado (number ou string, tolerado na soma)
  category?: string | null; // seção do mercado (null = não categorizado)
}

/** Formata mês para exibição (YYYY-MM → "Agosto de 2026") */
function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

/** Formata mês curto para o header sticky (YYYY-MM → "Ago 2026") */
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatMonthShort(month: string): string {
  const [year, m] = month.split('-');
  const idx = Number(m) - 1;
  return `${MONTHS_SHORT[idx] ?? ''} ${year}`;
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

  // Estado do quick-add na barra de base (estilo Listonic)
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddError, setQuickAddError] = useState('');
  const [quickAddStatus, setQuickAddStatus] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  // Estado de edição de item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editCategory, setEditCategory] = useState(''); // '' = sem categoria (detectar)
  // Campo que recebe foco ao abrir a edição: 'name' (lápis) ou 'qty' (chip de quantidade, D7)
  const [editFocusField, setEditFocusField] = useState<'name' | 'qty'>('name');
  const [savingEdit, setSavingEdit] = useState(false);

  // Estado do modal de edição unificada
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editListName, setEditListName] = useState('');
  const [editListMonth, setEditListMonth] = useState('');
  const [editListBudget, setEditListBudget] = useState('');
  const [editListSaving, setEditListSaving] = useState(false);
  const [editListError, setEditListError] = useState('');
  const editModalTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Estado de preço por item
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [savingPrice, setSavingPrice] = useState<Record<string, boolean>>({});
  const [focusPriceItemId, setFocusPriceItemId] = useState<string | null>(null);

  // Estado de histórico de preços
  const [showPriceHistory, setShowPriceHistory] = useState<string | null>(null);

  // Estado do sheet de orçamento (expande para cima a partir da barra)
  const [isBudgetSheetOpen, setIsBudgetSheetOpen] = useState(false);

  // Estado de recolhimento da seção de Comprados (colapsada por padrão)
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(true);

  // Estado de recolhimento do resumo no header sticky (colapsado por padrão)
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(true);

  // Refs p/ foco e scroll do painel de histórico inline (D5)
  const historyToggleRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const historyPanelRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Refs do chip de orçamento e do painel do sheet (foco restaurado/trap)
  const budgetChipRef = useRef<HTMLButtonElement | null>(null);
  const budgetSheetRef = useRef<HTMLDivElement | null>(null);

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

  /** Salva novo orçamento da lista (PATCH /api/lists/[id]) */
  const handleSaveBudget = useCallback(
    async (newBudget: number) => {
      const response = await fetch(`/api/lists/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ budget: newBudget }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar orçamento');
      }

      const data = await response.json();
      setList((prev) => (prev ? { ...prev, budget: String(data.list.budget) } : prev));
      showSuccess('Orçamento atualizado');
    },
    [id, showSuccess]
  );

  /** Sheet de orçamento: ao abrir, foca o painel (foco entra no sheet) */
  /** Adiciona item via barra de base (quick-add estilo Listonic).
   *  Payload mínimo: { name, quantity: 1, unit: 'un' } — SEM price/category
   *  (coluna fica NULL → auto-guess pela categoria via resolveItemCategory). */
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = quickAddName.trim();

    // Erro inline na própria barra (role="alert"), sem POST
    if (!name) {
      setQuickAddError('Digite o nome do item');
      return;
    }

    setAddingItem(true);

    try {
      const response = await fetch(`/api/lists/${id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildQuickAddPayload(name)),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Erro ao adicionar item');
        return;
      }

      // Categoria via auto-guess local (mesmo padrão do fluxo do modal antigo)
      const newItem: ItemData = {
        ...data.item,
        category: guessCategoryByName(name),
      };

      setItems((prev) => [...prev, newItem]);
      setQuickAddName('');
      setQuickAddStatus(`${name} adicionado`);
      setTimeout(() => setQuickAddStatus(''), 2500);
      // Mantém o foco no input para adição em sequência
      focusQuickAdd();
    } catch {
      setError('Erro de conexão');
    } finally {
      setAddingItem(false);
    }
  };

  /** Digitação no quick-add: limpa o erro inline da barra */
  const handleQuickAddNameChange = (val: string) => {
    setQuickAddName(val);
    if (quickAddError) setQuickAddError('');
  };

  /** Devolve o foco ao input do quick-add (após adição) */
  const focusQuickAdd = () => {
    document.getElementById('quick-add-name')?.focus();
  };

  /** Abre o sheet de orçamento e foca o painel */
  const openBudgetSheet = () => {
    setIsBudgetSheetOpen(true);
  };

  /** Fecha o sheet e restaura o foco no chip de orçamento */
  const closeBudgetSheet = () => {
    setIsBudgetSheetOpen(false);
    budgetChipRef.current?.focus();
  };

  /** Teclado no sheet: Esc fecha; Tab fica preso no painel (trap) */
  const handleBudgetSheetKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeBudgetSheet();
      return;
    }
    if (e.key !== 'Tab') return;

    const focusables = budgetSheetRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
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
          // Desmarcou: limpa preço do estado e fecha histórico se estiver aberto
          setPriceInputs((prev) => ({ ...prev, [item.id]: '' }));
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, price: null } : i
            )
          );
          if (showPriceHistory === item.id) {
            setShowPriceHistory(null);
          }
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

  /** Inicia edição de um item (field = campo que recebe foco ao abrir: 'name' ou 'qty') */
  const startEdit = (item: ItemData, field: 'name' | 'qty' = 'name') => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditQty(item.quantity);
    setEditUnit(item.unit);
    setEditCategory(item.category ?? '');
    setEditFocusField(field);
  };

  /** Cancela edição */
  const cancelEdit = () => {
    setEditingItemId(null);
    setEditName('');
    setEditQty('');
    setEditUnit('');
    setEditCategory('');
  };

  /** Alterna o histórico de preços inline do item (single-open) */
  const togglePriceHistory = (itemId: string) => {
    if (showPriceHistory === itemId) {
      closePriceHistory(itemId);
    } else {
      setShowPriceHistory(itemId);
      // Rola o painel para a área visível após o render (D5)
      setTimeout(() => {
        historyPanelRefs.current[itemId]?.scrollIntoView({ block: 'nearest' });
      }, 0);
    }
  };

  /** Fecha o histórico e devolve o foco ao toggle (Esc ou botão Fechar) */
  const closePriceHistory = (itemId: string) => {
    setShowPriceHistory(null);
    historyToggleRefs.current[itemId]?.focus();
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
          // '' → null: limpa a categoria persistida e passa a detectar pelo nome
          category: editCategory === '' ? null : editCategory,
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

  /** Abre o modal de edição unificado com os dados atuais da lista */
  const openEditModal = useCallback(() => {
    if (!list) return;
    setEditListName(list.name);
    setEditListMonth(list.month);
    setEditListBudget(String(list.budget));
    setEditListError('');
    setIsEditModalOpen(true);
    editModalTriggerRef.current?.focus();
  }, [list]);

  /** Fecha o modal de edição unificado */
  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    editModalTriggerRef.current?.focus();
  }, []);

  /** Salva edição unificada da lista (nome, mês, orçamento) */
  const handleSaveEditList = useCallback(async () => {
    if (!list) return;
    const trimmedName = editListName.trim();
    const trimmedMonth = editListMonth.trim();
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!trimmedName) {
      setEditListError('Nome da lista não pode ser vazio');
      return;
    }
    if (!monthRegex.test(trimmedMonth)) {
      setEditListError('Mês inválido. Use YYYY-MM');
      return;
    }
    const [, m] = trimmedMonth.split('-');
    const monthNum = Number(m);
    if (monthNum < 1 || monthNum > 12) {
      setEditListError('Mês inválido. Use um mês entre 01 e 12.');
      return;
    }

    setEditListSaving(true);
    setEditListError('');
    try {
      const response = await fetch(`/api/lists/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          month: trimmedMonth,
          budget: Number(editListBudget) || 0,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar lista');
      }

      setList((prev) => (prev ? { ...prev, ...data.list } : prev));
      closeEditModal();
      showSuccess('Lista atualizada');
    } catch {
      setEditListError('Erro ao salvar alterações');
    } finally {
      setEditListSaving(false);
    }
  }, [id, list, editListName, editListMonth, editListBudget, closeEditModal, showSuccess]);

  /** Arquivar/desarquivar a lista a partir do modal de edição */
  const handleArchiveFromModal = useCallback(async () => {
    if (!list) return;
    const isArchived = !!list.archived_at;
    const confirmMessage = isArchived
      ? `Desarquivar lista "${list.name}"? Ela voltará a aparecer na listagem principal.`
      : `Arquivar lista "${list.name}"? Ela será ocultada da listagem principal.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setEditListError('');
      const response = await fetch(`/api/lists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived_at: !isArchived }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar lista');
      }

      setList((prev) => (prev ? { ...prev, archived_at: data.list.archived_at } : prev));
      closeEditModal();
      showSuccess(isArchived ? 'Lista desarquivada' : 'Lista arquivada');
    } catch {
      setEditListError('Erro ao arquivar lista');
    }
  }, [id, list, closeEditModal, showSuccess]);

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

  // miniStatus (D10): contador "x de y · %" no header sticky
  const miniStatus =
    totalItems > 0 ? `${completedItems} de ${totalItems} · ${progressPercent}%` : 'Sem itens ainda';

  // Cálculos do orçamento (#56): soma tolerante a price number OU string.
  // Item comprado sem preço não soma, mas não quebra o cálculo.
  const totalSpent = sumCompletedSpent(items);
  const budget = Number(list?.budget ?? 0);

  /** Renderiza cada linha de item da lista (reutilizado nas seções de pendentes e comprados).
   *  Layout compacto estilo Listonic (D6/D7/D5): círculo 44px para marcar comprado, nome truncado,
   *  chip de quantidade (toca → edição com foco no qty), sub-linha de preço só quando comprado,
   *  ações editar/excluir de 44px e histórico de preços inline. */
  const renderListItem = (item: ItemData) => {
    const isCompleted = item.completed === '1';
    const currentPrice = priceInputs[item.id] || '';
    const cat = getCategoryById(resolveItemCategory(item));
    const isHistoryOpen = showPriceHistory === item.id;

    return (
      <li
        key={item.id}
        className={`rounded-lg transition-colors duration-150
          ${isCompleted ? 'bg-green-50/40' : 'hover:bg-[var(--app-muted)]'}`}
      >
        <div className="flex items-start gap-2 px-1.5 sm:px-2 py-1.5">
          {editingItemId === item.id ? (
            /* Modo de edição (compacto) */
            <div className="flex-1 min-w-0 p-1 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 border border-[var(--app-border)] rounded-lg text-base
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Nome do item"
                  autoFocus={editFocusField !== 'qty'}
                />
                <button
                  onClick={() => handleSaveEdit(item.id)}
                  disabled={savingEdit}
                  className="w-11 h-11 shrink-0 flex items-center justify-center text-green-600 hover:bg-green-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Salvar alterações"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={cancelEdit}
                  className="w-11 h-11 shrink-0 flex items-center justify-center text-[var(--app-text-secondary)] hover:bg-[var(--app-muted)] rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Cancelar edição"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  min="0.01"
                  step="0.01"
                  className="w-20 px-2 py-2 border border-[var(--app-border)] rounded-lg text-base text-center
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Quantidade"
                  autoFocus={editFocusField === 'qty'}
                />
                <select
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="px-2 py-2 border border-[var(--app-border)] rounded-lg text-base
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--app-surface)]"
                  aria-label="Unidade"
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="flex-1 min-w-[180px] px-2 py-2 border border-[var(--app-border)] rounded-lg text-base
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--app-surface)]"
                  aria-label="Seção / Categoria no mercado"
                >
                  <option value="">Sem categoria (detectar pelo nome)</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <>
              {/* Círculo de marcar comprado — alvo 44px (D6) */}
              <button
                onClick={() => handleToggleComplete(item)}
                className={`shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center
                  transition-colors duration-150
                  focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                  ${isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-[var(--app-border)] hover:border-green-500'
                  }`}
                aria-label={
                  isCompleted
                    ? `Marcar ${item.name} como pendente`
                    : `Marcar ${item.name} como comprado`
                }
                aria-pressed={isCompleted}
              >
                {isCompleted && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {/* Nome + chip de quantidade + sub-linha de preço */}
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`flex-1 min-w-0 truncate text-base font-medium ${
                      isCompleted ? 'line-through text-[var(--app-text-secondary)]' : 'text-[var(--app-text)]'
                    }`}
                  >
                    <span className="mr-1 text-xs opacity-75" aria-hidden="true">{cat.icon}</span>
                    {item.name}
                  </span>
                  {/* Chip de quantidade → abre a edição com foco no campo qty (D7) */}
                  <button
                    onClick={() => startEdit(item, 'qty')}
                    className="shrink-0 min-h-11 -my-1.5 px-1.5 flex items-center rounded-lg
                               text-sm font-semibold text-[var(--app-text-secondary)] hover:bg-[var(--app-muted)]
                               focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={`Quantidade ${item.quantity} ${item.unit}; toque para editar ${item.name}`}
                  >
                    {item.quantity} {item.unit}
                  </button>
                </div>

                {/* Sub-linha de preço — sempre visível */}
                <div className="flex items-center gap-2 mt-0.5 min-h-11">
                  {item.price != null ? (
                    <>
                      <span
                        className="text-sm font-medium text-green-700"
                        aria-label={`Preço registrado: ${formatCurrency(Number(item.price))}`}
                      >
                        {formatCurrency(Number(item.price))}
                      </span>
                      <button
                        ref={(el) => {
                          historyToggleRefs.current[item.id] = el;
                        }}
                        onClick={() => togglePriceHistory(item.id)}
                        className="min-h-11 -my-1.5 px-1.5 text-xs font-medium text-blue-600 underline rounded-lg
                                   hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-expanded={isHistoryOpen}
                        aria-controls={`price-history-${item.id}`}
                        aria-label={isHistoryOpen ? `Ocultar histórico de ${item.name}` : `Ver histórico de ${item.name}`}
                      >
                        {isHistoryOpen ? 'Ocultar' : 'Histórico'}
                      </button>
                    </>
                  ) : (
                    /* Input de preço para registrar (compacto) */
                    <div className="flex items-center gap-2 w-full">
                      <label
                        htmlFor={`price-${item.id}`}
                        className="text-sm text-[var(--app-text-secondary)] whitespace-nowrap"
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
                        className="w-20 px-2 py-1 text-sm border border-[var(--app-border)] rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        aria-label={`Digite o preço de ${item.name}`}
                      />
                      <button
                        onClick={() => handleSavePrice(item.id)}
                        disabled={!currentPrice || savingPrice[item.id]}
                        className="min-h-11 -my-1.5 px-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:visible:ring-2 focus:visible:ring-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              </div>

              {/* Ações secundárias — discretas, alvo 44px */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => startEdit(item, 'name')}
                  className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg
                             transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label={`Editar ${item.name}`}
                  title={`Editar ${item.name}`}
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteItem(item)}
                  className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg
                             transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label={`Remover ${item.name}`}
                  title={`Remover ${item.name}`}
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Painel do histórico de preços inline (D5) */}
        {isHistoryOpen && (
          <div
            ref={(el) => {
              historyPanelRefs.current[item.id] = el;
            }}
            id={`price-history-${item.id}`}
            className="mx-1.5 sm:mx-2 mb-1.5 rounded-lg border border-[var(--app-border)] bg-gray-50/80 p-3"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                closePriceHistory(item.id);
              }
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-sm font-semibold text-[var(--app-text-secondary)]">📊 Histórico — {item.name}</p>
              <button
                onClick={() => closePriceHistory(item.id)}
                className="min-h-11 -my-1.5 px-1.5 text-sm text-[var(--app-text-secondary)] hover:text-[var(--app-text)] rounded-lg
                           focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Fechar histórico de preços"
              >
                Fechar
              </button>
            </div>
            <PriceHistory itemId={item.id} itemName={item.name} />
          </div>
        )}
      </li>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Carregando">
        <div className="text-[var(--app-text-secondary)] text-base">Carregando lista...</div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--app-text-secondary)] text-base mb-4">Lista não encontrada</p>
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
    <div className="min-h-screen bg-gray-50 pb-32 sm:pb-24">
      {/* Header sticky único (D1/D2): "← Voltar", nome + mês curto, trigger do resumo,
          excluir e miniStatus "x de y · %" (D10). Resumo vira accordion colapsado por
          padrão (padrão #54) — contagem/progresso/data ficam SÓ aqui (redundância zero). */}
      <header className="sticky top-0 z-30 bg-[var(--app-surface)] border-b border-[var(--app-border)] shadow-sm" role="banner">
        <div className="mx-auto max-w-2xl px-4">
          {/* Linha 1 */}
          <div className="flex items-center justify-between gap-2 min-h-14">
            <Link
              href="/dashboard"
              className="min-h-11 flex items-center gap-1 text-[var(--app-text-secondary)] hover:text-[var(--app-accent)] text-base shrink-0"
              aria-label="Voltar ao painel"
            >
              ← Voltar
            </Link>
            <div className="flex-1 min-w-0 text-center">
              <h1 className="text-lg font-bold text-[var(--app-text)] truncate">
                {list.name}
                <span className="hidden sm:inline text-sm font-normal text-[var(--app-text-secondary)]"> · {formatMonthShort(list.month)}</span>
              </h1>
              <p className="hidden sm:block text-xs text-[var(--app-text-secondary)]" aria-live="polite">
                {miniStatus}
              </p>
            </div>
            <div className="flex items-center shrink-0">
              <button
                onClick={() => setIsSummaryCollapsed((prev) => !prev)}
                className="hidden sm:flex w-11 h-11 items-center justify-center text-[var(--app-text-secondary)] hover:text-[var(--app-text)] hover:bg-[var(--app-muted)] rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]"
                aria-expanded={!isSummaryCollapsed}
                aria-controls="list-summary"
                aria-label={isSummaryCollapsed ? 'Mostrar resumo da lista' : 'Ocultar resumo da lista'}
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  className={`w-4 h-4 transition-transform duration-200 ${isSummaryCollapsed ? '' : 'rotate-180'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={openEditModal}
                className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Editar lista"
                title="Editar lista"
                ref={editModalTriggerRef}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={handleDeleteList}
                className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={`Excluir lista ${list.name}`}
                title="Excluir lista"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Linha 2 (mobile): mês curto + miniStatus + chevron */}
          <div className="sm:hidden flex items-center gap-2 min-h-11 border-t border-gray-100">
            <button
              onClick={() => setIsSummaryCollapsed((prev) => !prev)}
              className="flex-1 min-h-11 flex items-center gap-2 text-left text-sm text-[var(--app-text-secondary)] hover:text-[var(--app-text)] transition-colors rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-expanded={!isSummaryCollapsed}
              aria-controls="list-summary"
              aria-label={isSummaryCollapsed ? 'Mostrar resumo da lista' : 'Ocultar resumo da lista'}
            >
              <span aria-hidden="true">📅</span>
              <span>{formatMonthShort(list.month)}</span>
              <span className="ml-auto text-xs font-semibold text-blue-700" aria-live="polite">
                {miniStatus}
              </span>
              <svg
                aria-hidden="true"
                focusable="false"
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isSummaryCollapsed ? '' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Linha 3: resumo colapsável (accordion #54) */}
          <div id="list-summary" hidden={isSummaryCollapsed} className="border-t border-gray-100 py-4">
            <p className="text-sm text-[var(--app-text-secondary)] mb-3">{formatMonth(list.month)}</p>
            <div className="grid grid-cols-3 gap-3 text-center" role="region" aria-label="Resumo da lista">
              <div>
                <div className="text-lg font-bold text-[var(--app-text)]" aria-label={`${totalItems} itens no total`}>
                  {totalItems}
                </div>
                <div className="text-xs text-[var(--app-text-secondary)]">Total</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-700" aria-label={`${completedItems} itens comprados`}>
                  {completedItems}
                </div>
                <div className="text-xs text-[var(--app-text-secondary)]">Comprados</div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-700" aria-label={`${pendingItems} itens pendentes`}>
                  {pendingItems}
                </div>
                <div className="text-xs text-[var(--app-text-secondary)]">Pendentes</div>
              </div>
            </div>
            {totalItems > 0 && (
              <div
                className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden"
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
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-6 max-w-2xl" role="main">
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

        {/* Cabeçalho da lista removido: nome/excluir/contagem/progresso/data
            agora vivem no header sticky (D1/D2/D10) — redundância zero. */}

        {/* Formulário inline desktop removido (delta 13/08): a adição agora é
            pela barra de base fixa (quick-add com ItemSuggestions) — entrada
            única de itens em mobile E desktop. */}

        {/* Lista de itens — box único com linhas planas + dividers (estilo Listonic, D6) */}
        <div className="bg-[var(--app-surface)] rounded-xl shadow-sm border border-[var(--app-border)] p-4 sm:p-6">
          {items.length === 0 ? (
            <div className="text-center py-12 text-[var(--app-text-secondary)]">
              <div className="text-4xl mb-3" aria-hidden="true">📝</div>
              <p className="text-base">Nenhum item ainda. Adicione o primeiro!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* Seção 1: Itens Pendentes */}
              <div className="pb-2">
                <h2 className="text-lg font-semibold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span>🛒</span> Pendentes
                  </span>
                  <span className="text-sm font-normal text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {pendingItems} {pendingItems === 1 ? 'item' : 'itens'}
                  </span>
                </h2>

                {items.filter((i) => i.completed === '0').length === 0 ? (
                  <div className="p-4 text-center bg-green-50 rounded-lg border border-green-100 text-green-800 text-sm font-medium">
                    🎉 Tudo comprado! Nenhum item pendente.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupItemsByCategory(
                      items.filter((item) => item.completed === '0')
                    ).map((group) => (
                      <div key={group.categoryId} className="space-y-2">
                        <h3 className="text-xs font-bold text-[var(--app-text-secondary)] uppercase tracking-wider flex items-center gap-1.5 pt-1">
                          <span aria-hidden="true">{group.icon}</span> {group.name} ({group.items.length})
                        </h3>
                        <ul className="divide-y divide-gray-100" role="list" aria-label={`Itens pendentes de ${group.name}`}>
                          {group.items.map((item) => renderListItem(item))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seção 2: Itens Comprados (Colapsável) */}
              {/* Seção 2: Itens Comprados (Colapsável — padrão #54, D8) */}
              {completedItems > 0 && (
                <div className="pt-4">
                  <button
                    onClick={() => setIsCompletedCollapsed((prev) => !prev)}
                    className="w-full flex items-center justify-between min-h-[44px] text-left font-semibold text-[var(--app-text-secondary)] hover:text-[var(--app-text)] transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    aria-expanded={!isCompletedCollapsed}
                    aria-controls="completed-items-list"
                  >
                    <span className="flex items-center gap-2 text-base">
                      <span>✅</span> Comprados ({completedItems})
                    </span>
                    <span className="text-sm text-[var(--app-text-secondary)] flex items-center gap-1 font-normal">
                      {isCompletedCollapsed ? 'Mostrar' : 'Ocultar'}
                      <svg
                        aria-hidden="true"
                        focusable="false"
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isCompletedCollapsed ? '' : 'rotate-180'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>

                  <ul
                    id="completed-items-list"
                    hidden={isCompletedCollapsed}
                    className="mt-3 divide-y divide-gray-100"
                    role="list"
                    aria-label="Itens comprados"
                  >
                    {items
                      .filter((item) => item.completed === '1')
                      .map((item) => renderListItem(item))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Barra de base única (delta 13/08 — estilo Listonic): quick-add com
          ItemSuggestions + chip de orçamento (abre o sheet para cima).
          Substitui o footer-accordion de orçamento, o FAB e o form inline
          desktop — entrada única de adição em mobile E desktop. */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[var(--app-surface)] border-t border-[var(--app-border)] shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div
          className="max-w-2xl mx-auto px-3 sm:px-4 py-2.5 flex flex-col gap-1.5"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.625rem)' }}
        >
          {/* Erro inline do quick-add (role="alert", some ao digitar) */}
          {quickAddError && (
            <p id="quick-add-error" role="alert" className="text-sm font-medium text-red-700">
              {quickAddError}
            </p>
          )}

          <div className="flex items-center gap-2">
            <form className="flex-1 min-w-0 flex items-center gap-2" onSubmit={handleQuickAdd} noValidate>
              <label htmlFor="quick-add-name" className="sr-only">
                Nome do item
              </label>
              <ItemSuggestions
                id="quick-add-name"
                value={quickAddName}
                onValueChange={handleQuickAddNameChange}
                onSelect={handleQuickAddNameChange}
                placeholder="Adicionar item..."
                required
              />
              <button
                type="submit"
                disabled={addingItem}
                className="w-11 h-11 shrink-0 rounded-xl bg-blue-600 text-white text-2xl font-light flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label={addingItem ? 'Adicionando item...' : 'Adicionar item'}
              >
                +
              </button>
            </form>

            {/* Chip de orçamento — mostra gasto total fixo; ao clicar expande o sheet com resumo */}
            <button
              ref={budgetChipRef}
              onClick={openBudgetSheet}
              className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3 shrink-0 flex items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-sm font-semibold hover:bg-[var(--app-muted)] transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-expanded={isBudgetSheetOpen}
              aria-controls="budget-sheet"
              aria-haspopup="dialog"
              aria-label="Ver resumo do orçamento"
              title="Ver resumo do orçamento"
            >
              <span aria-hidden="true">💰</span>
              <span className="text-[var(--app-text-secondary)]">
                {budget > 0 ? (
                  <span className="text-amber-700">Gasto: {formatCurrency(totalSpent)}</span>
                ) : (
                  <span className="text-xs font-medium">Definir orçamento</span>
                )}
              </span>
              <span className="sr-only">
                {budget > 0
                  ? `Gasto total: ${formatCurrency(totalSpent)}`
                  : 'Definir orçamento'}
              </span>
              <svg
                aria-hidden="true"
                focusable="false"
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isBudgetSheetOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Região ao vivo do quick-add — anúncio sem banner duplicado */}
        <div className="sr-only" role="status" aria-live="polite">
          {quickAddStatus}
        </div>
      </div>

      {/* Sheet de Orçamento — bottom-sheet que expande para cima e cobre a
          barra (z-50 > z-40). Fecha por X · Esc · backdrop; Tab preso no
          painel; ao fechar o foco volta ao chip. */}
      {isBudgetSheetOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="budget-sheet-title">
          {/* Backdrop — fecha no toque */}
          <div className="absolute inset-0 bg-black/50" onClick={closeBudgetSheet} aria-hidden="true" />
          <div
            ref={budgetSheetRef}
            tabIndex={-1}
            onKeyDown={handleBudgetSheetKeyDown}
            className="absolute bottom-0 inset-x-0 max-w-2xl mx-auto bg-[var(--app-surface)] rounded-t-2xl shadow-xl max-h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-200 focus:outline-none"
          >
            <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2 shrink-0">
              <h2 id="budget-sheet-title" className="text-lg font-semibold text-[var(--app-text)]">
                Orçamento
              </h2>
              <button
                onClick={closeBudgetSheet}
                className="w-11 h-11 flex items-center justify-center text-[var(--app-text-secondary)] hover:bg-[var(--app-muted)] rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Fechar orçamento"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4 sm:p-6 pt-0">
              <BudgetSummary budget={budget} totalSpent={totalSpent} remaining={budget - totalSpent} onSaveBudget={handleSaveBudget} />
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição unificada da lista */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeEditModal}>
          <div
            className="bg-[var(--app-surface)] rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-list-title"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="edit-list-title" className="text-lg font-bold text-[var(--app-text)]">Editar Lista</h2>
              <button
                onClick={closeEditModal}
                className="w-10 h-10 flex items-center justify-center text-[var(--app-text-secondary)] hover:bg-[var(--app-muted)] rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Fechar edição"
                title="Fechar edição"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {editListError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4" role="alert">{editListError}</div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="edit-list-name" className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">Nome</label>
                <input
                  id="edit-list-name"
                  type="text"
                  value={editListName}
                  onChange={(e) => setEditListName(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--app-border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="edit-list-month" className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">Mês (YYYY-MM)</label>
                <input
                  id="edit-list-month"
                  type="text"
                  value={editListMonth}
                  onChange={(e) => setEditListMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--app-border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="edit-list-budget" className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">Orçamento (R$)</label>
                <input
                  id="edit-list-budget"
                  type="number"
                  value={editListBudget}
                  onChange={(e) => setEditListBudget(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-[var(--app-border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-6">
              <button
                type="button"
                onClick={handleArchiveFromModal}
                className="px-4 py-2 text-sm font-medium text-[var(--app-text-secondary)] bg-[var(--app-muted)] rounded-lg hover:bg-[var(--app-muted)] transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {list?.archived_at ? 'Desarquivar' : 'Arquivar'}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={editListSaving}
                  className="px-4 py-2 text-sm font-medium text-[var(--app-text-secondary)] bg-[var(--app-muted)] rounded-lg hover:bg-[var(--app-muted)] disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditList}
                  disabled={editListSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {editListSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
