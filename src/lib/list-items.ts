/**
 * Normalização dos campos `completed` e `price` na fronteira da API.
 *
 * Contexto (issues #51/#52): o banco (Supabase/PostgreSQL) persiste
 * `completed` como NUMERIC (0 = pendente, 1 = comprado) e o PostgREST devolve
 * `number` nativo. O contrato do client, porém, é string ('0'/'1') — o
 * frontend filtra com `item.completed === '0'`. O mismatch derrubou a
 * renderização de itens em produção (regressão do PR #43).
 *
 * Contexto (issue #56): o `price` também vem de coluna NUMERIC — do PostgREST
 * ele sai como `number` nativo em valores de baixa precisão, MAS como `string`
 * em valores altos (numeral além da precisão segura). O frontend soma com
 * `sum + (i.price ?? 0)` — string aí vira concatenação ("05.50"...) e quebra o
 * total gasto do orçamento. O contrato do client é `number | null`.
 *
 * Este módulo é o ponto único de normalização: converte `completed` para
 * string e `price` para `number | null` nas respostas da API e expõe o split
 * pendentes/comprados tolerante a ambos os tipos. NÃO altera o que é gravado
 * no banco (colunas NUMERIC).
 */

/** Mínimo que um item precisa expor: `completed` pode vir number OU string. */
export interface ItemLike {
  completed?: number | string | null;
  price?: unknown;
  reminderDate?: unknown;
  reminderNotified?: unknown;
  [key: string]: unknown;
}

/**
 * Item serializado: `completed` sempre string '0' (pendente) ou '1' (comprado)
 * e `price` sempre `number | null` (nunca string — ver issue #56).
 */
export type SerializedItem<T extends ItemLike> = Omit<T, 'completed' | 'price' | 'reminderDate' | 'reminderNotified'> & {
  completed: string;
  price: number | null;
  reminderDate: string | null;
  reminderNotified: string;
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

/**
 * Normaliza `price` para `number | null` (contrato do client, issue #56).
 *
 * O PostgREST devolve NUMERIC como number (baixa precisão) OU string (numeral
 * alto). O frontend soma com `sum + (i.price ?? 0)` — string quebraria a soma
 * por concatenação. Coagimos com `Number()` e validamos com `Number.isFinite`:
 * `'5.50'` → 5.5, `5.5` → 5.5, `null`/`undefined`/`''`/não-numérico → null.
 */
export function normalizePrice(price: unknown): number | null {
  if (price === undefined || price === null) return null;
  if (typeof price === 'string' && price.trim() === '') return null;
  const value = Number(price);
  return Number.isFinite(value) ? value : null;
}

/**
 * Normaliza `reminderDate` para `string | null` (contrato do client).
 */
export function normalizeReminderDate(reminderDate: unknown): string | null {
  if (reminderDate === undefined || reminderDate === null) return null;
  if (typeof reminderDate === 'string' && reminderDate.trim() === '') return null;
  return String(reminderDate);
}

/**
 * Normaliza `reminderNotified` para `'0' | '1'` (contrato do client).
 */
export function normalizeReminderNotified(reminderNotified: unknown): '0' | '1' {
  const value = String(reminderNotified).trim();
  return value === '1' ? '1' : '0';
}

/**
 * Serializa um item para a fronteira da API: `completed` sempre string e
 * `price` sempre number (ou null — item sem preço não quebra a soma, #56).
 */
export function serializeItem<T extends ItemLike>(item: T): SerializedItem<T> {
  return {
    ...item,
    completed: normalizeCompleted(item.completed),
    price: normalizePrice(item.price),
    reminderDate: normalizeReminderDate(item.reminderDate),
    reminderNotified: normalizeReminderNotified(item.reminderNotified),
  };
}

/** Serializa uma lista de itens para a fronteira da API. */
export function serializeItems<T extends ItemLike>(items: T[]): SerializedItem<T>[] {
  return items.map(serializeItem);
}

/** Linha mínima da tabela `prices` (o campo monetário é `value`, não `price`). */
export interface PriceLike {
  value?: unknown;
  [key: string]: unknown;
}

/** Linha de preço serializada: `value` sempre `number | null`. */
export type SerializedPrice<T extends PriceLike> = Omit<T, 'value'> & {
  value: number | null;
};

/** Serializa uma linha de preço para a fronteira: `value` sempre number/null. */
export function serializePriceRow<T extends PriceLike>(row: T): SerializedPrice<T> {
  return { ...row, value: normalizePrice(row.value) };
}

/** Serializa uma lista de linhas de preço para a fronteira. */
export function serializePriceRows<T extends PriceLike>(rows: T[]): SerializedPrice<T>[] {
  return rows.map(serializePriceRow);
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

/** Payload do quick-add da barra de base (estilo Listonic). */
export interface QuickAddPayload {
  name: string;
  quantity: number;
  unit: string;
}

/**
 * Monta o payload do quick-add (barra de base, delta 13/08).
 *
 * Defaults: quantity 1 e unit 'un'. SEM price e SEM category de propósito: a
 * coluna `category` fica NULL no banco e o auto-guess pelo nome roda a cada
 * render (respeita o fix A1/PR#50); preço entra depois, ao marcar comprado.
 * O nome deve chegar já trimado pela página.
 */
export function buildQuickAddPayload(name: string): QuickAddPayload {
  return { name, quantity: 1, unit: 'un' };
}
