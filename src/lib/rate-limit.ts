import { NextResponse } from 'next/server';

/**
 * Rate limiting para as rotas de escrita (issue #75).
 *
 * Estratégia: **janela fixa em memória**, chaveada por usuário autenticado
 * (todas as rotas de escrita exigem auth — o `user.id` é o identificador
 * natural; limite por IP agrega pouco quando toda chamada é logada).
 *
 * Limites moderados (janela de 60s) para não quebrar o uso normal do app;
 * o POST /api/shares tem o limite mais baixo por ser o alvo de abuso
 * (enumeração de e-mail, issue #76).
 *
 * Nota de arquitetura: o store é em memória (sem Redis/Upstash no stack).
 * Em serverless cada instância mantém o próprio contador — é um controle de
 * "melhor esforço" (defense in depth); a autorização real continua sendo
 * RLS + ownership no handler. Suficiente para o MVP.
 */

export interface RateLimitConfig {
  /** Tamanho da janela em milissegundos. */
  windowMs: number;
  /** Máximo de requisições permitidas dentro da janela. */
  max: number;
}

export interface RateLimitResult {
  /** true se a requisição pode passar; false se estourou o limite. */
  ok: boolean;
  /** Requisições restantes na janela atual (0 quando bloqueado). */
  remaining: number;
  /** Segundos até a janela resetar (0 quando ok). */
  retryAfter: number;
}

type RateLimitScope =
  | 'lists:create'
  | 'lists:update'
  | 'lists:delete'
  | 'lists:duplicate'
  | 'items:create'
  | 'items:update'
  | 'items:delete'
  | 'prices:create'
  | 'shares:create'
  | 'shares:delete';

/** Limites por escopo (janela curta, moderados p/ uso normal). */
export const RATE_LIMITS: Record<RateLimitScope, RateLimitConfig> = {
  'lists:create': { windowMs: 60_000, max: 30 },
  'lists:update': { windowMs: 60_000, max: 30 },
  'lists:delete': { windowMs: 60_000, max: 30 },
  'lists:duplicate': { windowMs: 60_000, max: 10 }, // operação pesada (copia itens)
  'items:create': { windowMs: 60_000, max: 60 },
  'items:update': { windowMs: 60_000, max: 60 },
  'items:delete': { windowMs: 60_000, max: 60 },
  'prices:create': { windowMs: 60_000, max: 30 },
  'shares:create': { windowMs: 60_000, max: 10 }, // anti-enumeração de e-mail (#76)
  'shares:delete': { windowMs: 60_000, max: 10 },
};

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

/**
 * Verifica o rate limit para uma chave (ex.: user.id). Janela fixa com
 * cleanup lazy (bucket expirado é substituído na próxima chamada).
 * `now` é injetável para testes puros; default: Date.now().
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  now: number = Date.now()
): RateLimitResult {
  // A chave inclui a config para escopos com mesmos valores não colidirem
  const bucketKey = `${config.windowMs}:${config.max}:${key}`;
  const bucket = store.get(bucketKey);

  // Janela expirada ou primeira chamada → cria/reinicia o bucket
  if (!bucket || bucket.resetAt <= now) {
    store.set(bucketKey, { count: 1, resetAt: now + config.windowMs });
    return { ok: true, remaining: config.max - 1, retryAfter: 0 };
  }

  if (bucket.count >= config.max) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: config.max - bucket.count, retryAfter: 0 };
}

/** Resposta 429 padronizada (shape `{ error }` — mesmo contrato das demais rotas). */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: 'Muitas requisições. Tente novamente em instantes.' },
    { status: 429, headers: { 'Retry-After': String(result.retryAfter) } }
  );
}

/**
 * Guarda padrão para rotas de escrita: retorna a resposta 429 se o usuário
 * estourou o limite do escopo, ou `null` para seguir o fluxo normal.
 */
export function enforceRateLimit(
  userId: string,
  config: RateLimitConfig
): NextResponse | null {
  const result = checkRateLimit(userId, config);
  return result.ok ? null : rateLimitResponse(result);
}

/** Zera o store (usado nos testes entre casos). */
export function resetRateLimitStore(): void {
  store.clear();
}
