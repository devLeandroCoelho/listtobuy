import { CATEGORIES, guessCategoryByName } from '@/lib/categories';

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
