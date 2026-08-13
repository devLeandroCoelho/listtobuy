'use client';

/**
 * BudgetSummary — Exibe as 3 visões de valor da lista:
 * - Orçamento total
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

export function BudgetSummary({ budget, totalSpent, remaining }: BudgetSummaryProps) {
  // Porcentagem gasta do orçamento
  const percentage = budget > 0 ? (totalSpent / budget) * 100 : 0;
  const isOverBudget = remaining < 0;

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
      role="region"
      aria-label="Resumo financeiro da lista"
    >
      {/* Card: Orçamento Total */}
      <div
        className="bg-white p-6 rounded-xl shadow text-center"
        aria-label={`Orçamento total: ${formatCurrency(budget)}`}
      >
        <div className="text-sm text-gray-600 mb-1">Orçamento</div>
        <div className="text-2xl font-bold text-blue-600">
          {formatCurrency(budget)}
        </div>
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
