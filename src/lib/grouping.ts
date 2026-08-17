import { CATEGORIES, guessCategoryByName } from '@/lib/categories';
import { formatMonth } from '@/lib/month';

/**
 * Lógica de agrupamento de itens por categoria/seção do mercado (issue #41).
 *
 * Regras:
 * - A categoria PERSISTIDA no item tem prioridade;
 * - Sem categoria persistida (null/undefined), adivinha pelo nome
 *   (guessCategoryByName) — itens existentes criados antes da migração 005
 *   caem aqui;
 * - A ordem dos grupos segue a ordem de CATEGORIES (a ordem das seções no
 *   mercado);
 * - Grupos vazios são omitidos;
 * - Id de categoria desconhecido (dado antigo/renomeado) cai em "outros"
 *   em vez de derrubar o item do agrupamento.
 */

/** Mínimo que um item precisa expor para ser categorizado/agrupado. */
export interface CategorizableItem {
  name: string;
  category?: string | null;
}

/** Grupo de itens de uma categoria (ordem = ordem de CATEGORIES). */
export interface CategoryGroup<T> {
  categoryId: string;
  name: string;
  icon: string;
  items: T[];
}

/**
 * Resolve a categoria efetiva de um item:
 * categoria persistida se existir; senão adivinha pelo nome.
 */
export function resolveItemCategory(item: CategorizableItem): string {
  return item.category || guessCategoryByName(item.name);
}

/**
 * Agrupa itens por categoria, na ordem das seções do mercado (CATEGORIES).
 * Grupos vazios são omitidos. Itens sem categoria persistida entram no grupo
 * adivinhado pelo nome; ids desconhecidos caem em "outros".
 */
export function groupItemsByCategory<T extends CategorizableItem>(
  items: T[]
): CategoryGroup<T>[] {
  const groups: CategoryGroup<T>[] = CATEGORIES.map((cat) => ({
    categoryId: cat.id,
    name: cat.name,
    icon: cat.icon,
    items: [],
  }));

  for (const item of items) {
    const catId = resolveItemCategory(item);
    const group =
      groups.find((g) => g.categoryId === catId) ??
      groups.find((g) => g.categoryId === 'outros');
    group?.items.push(item);
  }

  return groups.filter((g) => g.items.length > 0);
}

/** Mínimo que uma lista precisa expor para ser agrupada por mês (issue #104). */
export interface MonthCategorizable {
  month: string;
  budget?: string | number | null;
}

/** Grupo de listas de um mesmo mês. */
export interface MonthGroup<T> {
  month: string;
  label: string;
  lists: T[];
  count: number;
  totalBudget: number;
}

/**
 * Agrupa listas por mês/ano (campo `month` no formato YYYY-MM).
 *
 * Regras:
 * - Listas são agrupadas pelo valor do campo `month`;
 * - Os grupos são ordenados do mês mais recente para o mais antigo;
 * - Grupos vazios são omitidos;
 * - `label` é o nome localizado do mês (ex.: "agosto de 2024").
 */
export function groupListsByMonth<T extends MonthCategorizable>(
  lists: T[]
): MonthGroup<T>[] {
  if (lists.length === 0) return [];

  const groups = new Map<string, T[]>();

  for (const list of lists) {
    const key = list.month || '';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(list);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, lists]) => ({
      month,
      label: formatMonth(month),
      lists,
      count: lists.length,
      totalBudget: lists.reduce(
        (sum, list) => sum + (Number(list.budget) || 0),
        0
      ),
    }));
}
