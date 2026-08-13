/**
 * Normalização do campo `completed` na fronteira da API.
 *
 * Contexto (issues #51/#52): o banco (Supabase/PostgreSQL) persiste
 * `completed` como NUMERIC (0 = pendente, 1 = comprado) e o PostgREST devolve
 * `number` nativo. O contrato do client, porém, é string ('0'/'1') — o
 * frontend filtra com `item.completed === '0'`. O mismatch derrubou a
 * renderização de itens em produção (regressão do PR #43).
 *
 * Este módulo é o ponto único de normalização: converte `completed` para
 * string nas respostas da API e expõe o split pendentes/comprados tolerante
 * a ambos os tipos. NÃO altera o que é gravado no banco (coluna NUMERIC).
 */

/** Mínimo que um item precisa expor: `completed` pode vir number OU string. */
export interface ItemLike {
  completed?: number | string | null;
  [key: string]: unknown;
}

/** Item serializado: `completed` sempre string '0' (pendente) ou '1' (comprado). */
export type SerializedItem<T extends ItemLike> = Omit<T, 'completed'> & {
  completed: string;
};

/** Resultado do split pendentes/comprados. */
export interface CompletedSplit<T> {
  pending: T[];
  completed: T[];
}

/**
 * Normaliza `completed` para '0' (pendente) ou '1' (comprado).
 * Aceita number 0/1 (banco) e string '0'/'1' (contrato do client).
 * Qualquer outro valor (undefined, null, etc.) vira '0' — o default do banco —
 * mantendo o contrato sempre válido.
 */
export function normalizeCompleted(completed: unknown): '0' | '1' {
  const value = String(completed).trim();
  return value === '1' ? '1' : '0';
}

/** Serializa um item para a fronteira da API: `completed` sempre string. */
export function serializeItem<T extends ItemLike>(item: T): SerializedItem<T> {
  return { ...item, completed: normalizeCompleted(item.completed) };
}

/** Serializa uma lista de itens para a fronteira da API. */
export function serializeItems<T extends ItemLike>(items: T[]): SerializedItem<T>[] {
  return items.map(serializeItem);
}

/**
 * Divide itens entre pendentes e comprados, tolerando `completed` como
 * number (0/1 — banco) ou string ('0'/'1' — contrato do client).
 */
export function splitByCompleted<T extends ItemLike>(items: T[]): CompletedSplit<T> {
  const pending: T[] = [];
  const completed: T[] = [];

  for (const item of items) {
    if (normalizeCompleted(item.completed) === '1') {
      completed.push(item);
    } else {
      pending.push(item);
    }
  }

  return { pending, completed };
}
