'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * BudgetSummary — Exibe as 3 visões de valor da lista:
 * - Orçamento total (editável inline)
 * - Total gasto (itens comprados com preço)
 * - Quanto falta gastar ("Ainda tem para gastar") ou estouro ("Estourou em")
 *
 * Acessibilidade: WCAG 2.1 AA — aria-labels, contraste adequado,
 * navegação por teclado, sem animações piscantes. O card de status usa
 * aria-live="polite" para anunciar mudanças em tempo real.
 */

interface BudgetSummaryProps {
  /** Orçamento total definido na lista */
  budget: number;
  /** Total gasto (soma dos preços dos itens comprados) */
  totalSpent: number;
  /** Quanto falta gastar (budget - totalSpent) */
  remaining: number;
  /** Callback para salvar o novo orçamento (PATCH) */
  onSaveBudget?: (budget: number) => Promise<void>;
}

/**
 * Formata valor numérico para moeda brasileira (R$).
 * Exemplo: 123.45 → "R$ 123,45"
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function BudgetSummary({ budget, totalSpent, remaining, onSaveBudget }: BudgetSummaryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(budget));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const percentage = budget > 0 ? (totalSpent / budget) * 100 : 0;
  const isOverBudget = remaining < 0;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = useCallback(() => {
    setEditValue(String(budget));
    setSaveError('');
    setIsEditing(true);
  }, [budget]);

  const cancelEditing = useCallback(() => {
    setEditValue(String(budget));
    setSaveError('');
    setIsEditing(false);
  }, [budget]);

  const handleSave = useCallback(async () => {
    const parsed = Number(editValue);
    if (isNaN(parsed) || parsed < 0) {
      setSaveError('Orçamento deve ser um número positivo');
      return;
    }

    if (!onSaveBudget) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      await onSaveBudget(parsed);
      setIsEditing(false);
    } catch {
      setSaveError('Erro ao salvar orçamento');
    } finally {
      setSaving(false);
    }
  }, [editValue, onSaveBudget]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      }
    },
    [handleSave, cancelEditing]
  );

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
      role="region"
      aria-label="Resumo financeiro da lista"
    >
      {/* Card: Orçamento Total */}
      <div
        className={`bg-white p-6 rounded-xl shadow text-center ${isEditing ? 'ring-2 ring-blue-500' : ''}`}
        aria-label={`Orçamento total: ${formatCurrency(budget)}`}
      >
        <div className="text-sm text-gray-600 mb-1">Orçamento</div>
        {isEditing ? (
          <div className="mt-1 space-y-2">
            <input
              ref={inputRef}
              type="number"
              inputMode="decimal"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-center
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Novo valor do orçamento"
              min="0"
              step="0.01"
              disabled={saving}
            />
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Salvar orçamento"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Cancelar edição do orçamento"
              >
                Cancelar
              </button>
            </div>
            {saveError && (
              <p className="text-xs text-red-600 mt-1" role="alert">{saveError}</p>
            )}
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(budget)}
            </div>
            {onSaveBudget && (
              <button
                type="button"
                onClick={startEditing}
                className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                aria-label="Editar orçamento"
              >
                <svg aria-hidden="true" focusable="false" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Editar
              </button>
            )}
          </>
        )}
      </div>

      {/* Card: Total Comprado */}
      <div
        className="bg-white p-6 rounded-xl shadow text-center"
        aria-label={`Já comprado: ${formatCurrency(totalSpent)}, ${percentage.toFixed(1)}% do orçamento`}
      >
        <div className="text-sm text-gray-600 mb-1">Já Comprado</div>
        <div className="text-2xl font-bold text-green-600">
          {formatCurrency(totalSpent)}
        </div>
        {/* Barra de progresso */}
        <div
          className="mt-2 w-full bg-gray-200 rounded-full h-2"
          role="progressbar"
          aria-valuenow={Math.min(percentage, 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${percentage.toFixed(1)}% do orçamento utilizado`}
        >
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {percentage.toFixed(1)}% do orçamento
        </div>
      </div>

      {/* Card: Ainda Tem para Gastar / Estouro */}
      <div
        className={`bg-white p-6 rounded-xl shadow text-center ${
          isOverBudget ? 'ring-2 ring-red-300' : ''
        }`}
        aria-label={
          isOverBudget
            ? `Estourou em ${formatCurrency(Math.abs(remaining))}`
            : `Ainda tem para gastar: ${formatCurrency(remaining)}`
        }
        aria-live="polite"
      >
        <div className="text-sm text-gray-600 mb-1">
          {isOverBudget ? 'Estourou em' : 'Ainda tem para gastar'}
        </div>
        <div
          className={`text-2xl font-bold ${
            isOverBudget ? 'text-red-600' : 'text-purple-600'
          }`}
        >
          {formatCurrency(isOverBudget ? Math.abs(remaining) : remaining)}
        </div>
        {isOverBudget && (
          <div className="text-xs text-red-500 mt-1" role="alert">
            Ultrapassou o orçamento!
          </div>
        )}
      </div>
    </div>
  );
}
