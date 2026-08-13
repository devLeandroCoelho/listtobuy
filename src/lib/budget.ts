/**
 * Helpers de orçamento — soma de valores dos itens comprados.
 *
 * O preço pode chegar como `number` ou `string` dependendo da origem
 * (estado local após salvar preço, resposta da API de preços ou seed).
 * A soma é robusta: nunca concatena strings e itens sem preço não contam.
 */

/** Item com campos mínimos necessários para o cálculo de gasto. */
export interface SpentItem {
  completed: string; // "0" ou "1"
  price?: number | string | null;
}

/**
 * Converte um preço para número, tolerando os formatos que podem chegar da
 * API/estado. Suporta vírgula decimal e separador de milhar pt-BR ("1.234,56"),
 * além do ponto decimal ("12.50"). Valores inválidos/ausentes viram 0.
 */
export function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const raw = value.trim();
  if (raw === '') return 0;

  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw;

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Soma os valores dos itens comprados (completed === '1').
 * Itens comprados sem preço não somam, mas não quebram o cálculo.
 */
export function sumCompletedSpent(items: SpentItem[]): number {
  return items
    .filter((i) => i.completed === '1')
    .reduce((sum, i) => sum + toNumber(i.price), 0);
}
