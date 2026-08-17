'use client';

import { useState, useEffect } from 'react';
import { ItemSuggestions } from '@/components/ItemSuggestions';
import { CATEGORIES, guessCategoryByName } from '@/lib/categories';
import { sanitizePriceInput, parsePrice } from '@/lib/price';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (itemData: {
    name: string;
    quantity: number;
    unit: string;
    price?: number | string;
    category?: string;
  }) => Promise<void>;
  unitOptions: Array<{ value: string; label: string }>;
}

export function AddItemModal({
  isOpen,
  onClose,
  onAddItem,
  unitOptions,
}: AddItemModalProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('un');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('outros');
  // True quando o usuário escolheu a seção manualmente: o auto-guess pelo nome
  // deixa de sobrescrever a escolha (ex.: "café" → mercearia, mas usuário quer Bebidas).
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Tecla ESC para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Digite o nome do item');
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantidade deve ser maior que zero');
      return;
    }

    if (price.trim()) {
      const parsedPrice = parsePrice(price);
      if (parsedPrice === null) {
        setError('Preço inválido. Use valores de 0 a 999.999,99');
        return;
      }
    }

    try {
      setSubmitting(true);
      // Só envia category se o usuário tocou no seletor: sem interação a coluna
      // fica NULL no banco e o auto-guess pelo nome roda a cada render/renomeação.
      const payload: {
        name: string;
        quantity: number;
        unit: string;
        price?: number | string;
        category?: string;
      } = {
        name: name.trim(),
        quantity: qty,
        unit,
        price: price.trim() ? parsePrice(price)! : undefined,
      };
      if (categoryTouched) {
        payload.category = category;
      }
      await onAddItem(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-guess só enquanto o usuário não escolheu a seção manualmente
    if (!categoryTouched) {
      setCategory(guessCategoryByName(val));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop de clique para fechar */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Conteúdo do Modal (Slide-up no Mobile) */}
      <div className="relative w-full max-w-lg bg-[var(--app-surface)] rounded-t-2xl sm:rounded-2xl shadow-xl p-6 z-10 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <h2 id="modal-title" className="text-xl font-bold text-[var(--app-text)] flex items-center gap-2">
            <span>➕</span> Novo Item
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[var(--app-text-secondary)] hover:text-[var(--app-text-secondary)] rounded-full hover:bg-[var(--app-muted)] transition-colors"
            aria-label="Fechar modal"
            title="Fechar modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Item */}
          <div>
            <label htmlFor="modal-item-name" className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">
              Nome do Item *
            </label>
            <ItemSuggestions
              id="modal-item-name"
              value={name}
              onValueChange={handleNameChange}
              onSelect={handleNameChange}
              placeholder="Ex: Leite, Arroz, Feijão..."
              required
            />
          </div>

          {/* Quantidade e Unidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="modal-item-qty" className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">
                Quantidade *
              </label>
              <input
                id="modal-item-qty"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2.5 border border-[var(--app-border)] rounded-lg text-base text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="modal-item-unit" className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">
                Unidade *
              </label>
              <select
                id="modal-item-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2.5 border border-[var(--app-border)] rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--app-surface)]"
              >
                {unitOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Categoria / Seção do Mercado */}
          <div>
            <label htmlFor="modal-item-category" className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">
              Seção / Categoria no Mercado
            </label>
            <select
              id="modal-item-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setCategoryTouched(true);
              }}
              className="w-full px-3 py-2.5 border border-[var(--app-border)] rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--app-surface)]"
              aria-describedby="modal-item-category-hint"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            <p id="modal-item-category-hint" className="text-xs text-gray-500 mt-1">
              Sugerida automaticamente pelo nome do item — você pode trocar antes de salvar.
            </p>
          </div>

          {/* Preço (opcional) */}
          <div>
            <label htmlFor="modal-item-price" className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">
              Preço Estimado/Atual (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
              <input
                id="modal-item-price"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={price}
                onChange={(e) => setPrice(sanitizePriceInput(e.target.value))}
                className="w-full pl-9 pr-3 py-2.5 border border-[var(--app-border)] rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-[var(--app-border)] text-[var(--app-text-secondary)] rounded-xl font-medium hover:bg-[var(--app-muted)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {submitting ? 'Adicionando...' : 'Adicionar Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
