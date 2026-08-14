# 🏗️ ListToBuy — Arquitetura do MVP (Fase 1)

**Autor**: Ivan (tech-lead) · **Data**: 2026-08-03
**Registro formalizado por**: Beatriz (copywriter) em 2026-08-03 — conteúdo técnico preservado na íntegra (seções 0–13), sem alteração de decisões técnicas.

---

**Autor**: Ivan (tech-lead) · **Data**: 2026-08-03 · **Modo**: somente leitura — documento de referência para os devs implementarem. Nenhum arquivo foi editado.
**Root do app**: `projetos/lista-de-mercado/` (já é repo git `listtobuy` — o app será criado AQUI, junto da memória/docs; `docs/` e `*.md` da raiz não são código e ficam intocados).

---

## 0. Decisões que baseiam tudo (da memória — não reverter)

D1 sem categoria · D2 histórico = mesmo item mês a mês (não entre lojas) · D3 orçamento por lista + 3 visões · D4 preço manual por item (sem código de barras) · D5 Freemium (grátis 1–2 listas; Premium R$ 29,90/ano) · D6 nome ListToBuy, domínio Vercel.

> ⚠️ **2 conflitos internos encontrados na leitura** — ver seção 12 (precisam de decisão do chefe antes/durante a implementação; a arquitetura foi desenhada para permitir as duas saídas).

---

## 1. Estrutura de pastas

```
projetos/lista-de-mercado/            # root do app (repo git)
├── app/                              # Next.js App Router — rotas e layouts
│   ├── layout.tsx                    # Root layout (fonts, ThemeProvider)
│   ├── page.tsx                      # Landing curta → CTA login/cadastro
│   ├── error.tsx / loading.tsx / not-found.tsx
│   ├── (auth)/
│   │   ├── login/  ├── cadastro/  └── recuperar/   # telas de auth (server components)
│   ├── (app)/                        # área autenticada — layout com nav inferior (mobile-first)
│   │   ├── listas/                   # listagem das listas do usuário + "nova lista"
│   │   ├── listas/[id]/              # detalhe da lista: 3 visões + itens + comprado/preço
│   │   ├── listas/[id]/convidar/     # compartilhamento (link/email + membros)
│   │   └── perfil/                   # perfil + plano (free/premium, gerenciar assinatura)
│   ├── item/[itemId]/                # histórico de preços mês a mês do item
│   ├── api/stripe/webhook/route.ts   # webhook Stripe (único route handler do MVP)
│   └── auth/callback/route.ts        # callback magic link / OAuth (futuro)
├── src/
│   ├── middleware.ts                 # refresh de sessão + proteção de rotas (Supabase SSR)
│   ├── components/
│   │   ├── ui/                       # primitivas shadcn-ui (button, dialog, input…)
│   │   └── …                         # componentes de domínio (ItemRow, PriceChart…) — colocalizados por feature
│   ├── features/                     # ★ módulos verticais (colocação por feature)
│   │   ├── lists/                    # components + lib + server actions (CRUD, orçamento)
│   │   ├── items/                    # adicionar/marcar comprado/preço/sugestão
│   │   ├── prices/                   # histórico + gráfico + cálculo das 3 visões (fórmula ÚNICA aqui)
│   │   ├── sharing/                  # convites, membros, subscription Realtime
│   │   ├── auth/                     # helpers de sessão/perfil
│   │   └── billing/                  # plano, checkout, entitling (isPremium)
│   ├── lib/
│   │   ├── supabase/                 # client server.ts / browser.ts (único lugar de criação)
│   │   ├── money.ts                  # formatBRL(cents) — Intl pt-BR
│   │   ├── plans.ts                  # ★ constantes dos limites free/premium (espelho do SQL)
│   │   └── utils.ts                  # cn() do shadcn
│   ├── server/                       # código server-only (nunca importar em client)
│   │   ├── queries/                  # queries Drizzle tipadas (getListWithItems, getItemHistory…)
│   │   └── stripe/                   # client Stripe + handler de webhook tipado
│   └── db/
│       ├── schema.ts                 # ★ Drizzle schema (tabelas + tipos) — fonte do banco
│       ├── migrations/               # SQL gerado pelo drizzle-kit (dba commita)
│       └── rls/                      # policies.sql + triggers.sql (SQL bruto, aplicado via supabase CLI)
├── drizzle.config.ts                 # dba
├── .env.example                      # variáveis documentadas (zero secrets)
├── .github/workflows/ci.yml          # devops
├── vercel.json / next.config.ts / package.json / tsconfig.json   # devops
└── README.md, project-state.md, ROADMAP.md, docs/                # memória (não mexer)
```

**Regras de acesso (AGENTS.md)**: `src/**` → backend-dev/frontend-dev · `src/db/*`, drizzle.config → dba · `package.json`, next.config, vercel.json, `.github/**` → devops · `*.md`, docs → copywriter · tech-lead/demais = leitura.

---

## 2. Modelo de dados (Drizzle — `src/db/schema.ts`)

**Princípio monetário: valores em `INTEGER` centavos** (`price_cents`, `budget_cents`) — zero float, alinhado ao Stripe. Formatação só na UI.

### Tabelas

| Tabela | Campos-chave | Notas |
|---|---|---|
| **profiles** | `id uuid PK = auth.users.id` · `email` · `full_name` · `avatar_url` (nullable) · `created_at` · `updated_at` | 1:1 com auth.users; criada por **trigger** no `auth.users` (padrão Supabase) |
| **lists** | `id uuid PK` · `owner_id → profiles` · `name text` · `month smallint (1-12)` · `year smallint` · `budget_cents int NOT NULL` · `deleted_at timestamptz NULL` · `created_at/updated_at` | **Soft delete** (preserva histórico — ver 2.1). **Sem** unique (owner, month, year) → permite várias listas no mesmo mês (decisão, seção 12) |
| **list_members** | PK `(list_id, user_id)` · `role text: 'owner' \| 'editor'` · `created_at` | **Owner também é linha aqui** (criada por trigger no INSERT de lists) → RLS consulta UMA tabela. Grátis = 1 editor por lista; Premium = ilimitado |
| **items** | `id uuid PK` · `list_id → lists` · `name text` (exibição) · **`name_key text`** (normalizado: minúsculas, sem acento, sem espaços duplos — identidade canônica do MVP) · `quantity numeric NULL` · `unit text NULL` (kg, un, cx…) · `bought boolean DEFAULT false` · **`price_cents int NULL`** (preço atual registrado) · `sort_order int` · `deleted_at NULL` · `created_by → profiles` · `created_at/updated_at` | Index: `(list_id, deleted_at)` e `name_key`. Duplicatas com mesmo name_key permitidas (2× "Café") |
| **item_prices** | `id uuid PK` · `item_id → items` (ON DELETE SET NULL) · **`item_key text NOT NULL`** (cópia do name_key no registro) · `name text` (snapshot) · `price_cents int` · `month/year smallint` · `recorded_at timestamptz` · `recorded_by → profiles` | **Append-only** (sem UPDATE/DELETE). Base do histórico D2. Index `(item_key, year, month)` |
| **user_items** | PK `(user_id, name_key)` · `name text` (último usado) · `times_used int` · `last_used_at` · `created_at` | Mantida por **trigger** no INSERT de items. Base da sugestão (seção 7) |
| **subscriptions** | `user_id → profiles` (UNIQUE) · `stripe_customer_id` · `stripe_subscription_id` · `status text` ('active'\|'trialing'\|'past_due'\|'canceled'\|'incomplete'\|'expired') · `plan text DEFAULT 'premium'` · `current_period_end timestamptz` · `trial_end timestamptz` · `created_at/updated_at` | Escrita **somente via webhook** (service role). `is_premium` é **derivado** (view/helper), nunca coluna armazenada |
| ~~invites~~ | — | **MVP: sem tabela de convites** — link de convite é só um token → recomendo `sharing_tokens`: `token uuid PK` · `list_id` · `created_by` · `expires_at` · `used_by` (nullable) · `created_at` | Convite por email pode vir na Fase 2; link resolve o caso família |

**Relação histórica (D2) — ponto crítico**: o item pertence à lista do mês; no mês seguinte o usuário cria lista nova e os itens são re-digitados. A **identidade entre meses = `name_key`** (normalizado). `item_prices` guarda `item_key` (desnormalizado) para o histórico sobreviver a delete/recriação. Um registro em `item_prices` aponta para o `item` daquele mês (rastreabilidade) mas a agregação do histórico é por `item_key`.

### 2.1 Estratégia "mesmo item em meses diferentes" (ADR-1)

- **Opção A — tabela catálogo `canonical_items`** (mais normalizada; pronta para IA/OCR mapear) ✗ sobre-engenharia no MVP: custo de manutenção, merges de duplicatas, sem ganho visível ao usuário.
- **Opção B — `name_key` derivado do nome digitado** ✅: `normalize(name)` = lowercase + remove acentos (NFC) + trim/collapse spaces. "Café Pilão 500g" ≡ "cafe pilao 500g". Sem catálogo; ranking e histórico agrupam por `name_key`.
- **Evolução Fase 2**: adicionar tabela `canonical_items` + coluna `canonical_item_id` em `items`/`user_items` — **não quebra nada** (name_key continua como fallback/identidade legada; OCR escreve no catálogo).

**Decisão**: B. Trade-off aceito: "Arroz" e "Arroz 5kg" são itens distintos (D2 compara o que o usuário digitou). Nível de confiança: **ALTO**.

---

## 3. Cálculo das 3 visões (D3) — fórmula exata

**Fonte da verdade: SQL view `list_summary`** (uma fórmula, correção garantida no servidor):

```sql
CREATE VIEW list_summary AS
SELECT l.id AS list_id,
       COALESCE(SUM(i.price_cents) FILTER (WHERE i.price_cents IS NOT NULL AND i.deleted_at IS NULL), 0) AS total_cents,
       COALESCE(SUM(i.price_cents) FILTER (WHERE i.bought AND i.price_cents IS NOT NULL AND i.deleted_at IS NULL), 0) AS bought_cents,
       l.budget_cents - COALESCE(SUM(i.price_cents) FILTER (WHERE i.bought AND i.price_cents IS NOT NULL AND i.deleted_at IS NULL), 0) AS remaining_cents
FROM lists l
LEFT JOIN items i ON i.list_id = l.id
GROUP BY l.id;
```

| Visão | Fórmula |
|---|---|
| 💰 VALOR TOTAL DA LISTA | Σ `price_cents` de itens **com preço** (não-deletados) — item sem preço = ignorado |
| ✅ VALOR DO COMPRADO | Σ `price_cents` de itens com `bought = true` |
| ⏳ AINDA TEM PARA GASTAR | `budget_cents` − COMPRADO |

**Onde executar**: render inicial via query da view (server component + Drizzle); **atualização em tempo real = recálculo no client** a partir do payload do Realtime de `items` (a lista já está toda no client). A fórmula client fica em **um único arquivo** `src/features/prices/lib/summary.ts` (mesma aritmética, testada por unit test contra a view). RPC **não** é necessário no MVP.

**Consistência preço/histórico (ADR-2)**: o preço atual mora em `items.price_cents`; cada registro de preço **appenda** `item_prices` na mesma transação (server action única `registerPrice(itemId, cents)`). Assim a view lê `items` (rápido) e o histórico lê `item_prices` (append-only) sem divergir. Se registrar 2º preço no mesmo mês: ambos persistidos; histórico mostra o **último** (`DISTINCT ON (item_key, year, month) ORDER BY recorded_at DESC`).

**Nível de confiança: ALTO** (formula simples; decisão chave = item sem preço entra como 0/ignorado → ignorado, seção 12).

---

## 4. RLS (Supabase) — modelo por tabela

**Padrão (ADR-3)**: `auth.uid()` = usuário logado. Acesso a qualquer coisa de uma lista = ser linha de `list_members` daquela lista. Owner é membro (trigger). Policies em `src/db/rls/policies.sql` (dba aplica via Supabase CLI; Drizzle não gerencia RLS — separação clara).

| Tabela | Policy | Regra |
|---|---|---|
| **profiles** | SELECT | `id = auth.uid()` (próprio) |
| | INSERT | `id = auth.uid()` (trigger já cria; policy como segurança) |
| | UPDATE | `id = auth.uid()` |
| **lists** | SELECT / UPDATE / DELETE | `EXISTS (SELECT 1 FROM list_members lm WHERE lm.list_id = id AND lm.user_id = auth.uid())` |
| | INSERT | `owner_id = auth.uid()` |
| **list_members** | SELECT | usuário é membro da lista (mesmo EXISTS) |
| | INSERT | quem insere é membro (owner) da lista — convite |
| | UPDATE/DELETE | `role = 'owner'` naquela linha (só dono remove membro) |
| **items** | SELECT / UPDATE / DELETE | `EXISTS (SELECT 1 FROM list_members lm WHERE lm.list_id = items.list_id AND lm.user_id = auth.uid())` |
| | INSERT | idem + `created_by = auth.uid()` |
| **item_prices** | SELECT / INSERT | via join: `EXISTS (SELECT 1 FROM items i JOIN lists l ON l.id=i.list_id JOIN list_members lm ON lm.list_id=l.id WHERE i.id = item_prices.item_id AND lm.user_id = auth.uid())` |
| | UPDATE/DELETE | **nenhuma** (append-only) |
| **user_items** | SELECT / UPDATE / DELETE / INSERT | `user_id = auth.uid()` |
| **subscriptions** | SELECT | `user_id = auth.uid()` (write só via webhook/service role) |
| **sharing_tokens** | INSERT/SELECT | criador; `use` via RPC `join_list_by_token(token)` (SECURITY DEFINER, valida expiração e cria list_members) |

**Realtime herda RLS** (Supabase aplica policies em subscriptions de postgres_changes). Entitling de limite (1–2 listas, 1 editor) **não é RLS** — é trigger (seção 6). **Nível de confiança: ALTO**.

---

## 5. Auth

- **Métodos**: email+senha **e** magic link (OTP) — ambos nativos Supabase, cobertura do público BR sem fricção de senha. **Google OAuth: Fase 2** (spec item 1: "social depois"; evita escopo de configuração OAuth no MVP).
- **Confirmação de email**: ON (Supabase `Email confirmations`) — LGPD, anti-spam e pré-requisito para Stripe.
- **Fluxo**: `signUp` → email de confirmação → trigger cria `profiles` → login → `(app)/listas`. Magic link: `signInWithOtp` → callback em `/auth/callback` → sessão.
- **Sessão SSR**: `@supabase/ssr` — `src/lib/supabase/server.ts` (lê cookies), `client.ts` (browser), `middleware.ts` (refresh + redirect p/ login se não autenticado nas rotas `(app)`).
- **PWA**: manifest + service worker básico (mobile do MVP — ROADMAP Fase 2 nativo).

---

## 6. Freemium / entitling (D5)

**Onde fica a regra — banco como backstop, app como UX (ADR-4)**:

| Mecanismo | O quê |
|---|---|
| **Triggers no banco** (nunca contornáveis — valem p/ API direta) | `tg_limit_lists`: BEFORE INSERT em `lists` → se dono não é premium e `count(lists ativas do dono) >= LIMIT_FREE_LISTS` → `raise exception`. `tg_limit_editors`: BEFORE INSERT em `list_members` (role='editor') → se não premium e já tem 1 editor → bloqueia |
| **App-level** | server action consulta `isPremium(userId)` ANTES e devolve erro amigável pt-BR ("Limite de 2 listas no plano grátis — vire Premium") — o trigger é a rede de segurança |
| **Limites em um lugar só** | `src/lib/plans.ts` (constantes) **espelhadas** nas constantes SQL do trigger — comentário cruzado obrigatório; simples o suficiente no MVP (sem tabela de settings) |
| **isPremium** | helper único: `SELECT EXISTS (FROM subscriptions WHERE user_id = X AND status IN ('active','trialing') AND (current_period_end IS NULL OR current_period_end > now()))` — **derivado**, nunca armazenado |

**Stripe**:
- Produto/Price no dashboard Stripe: `premium_anual` — **brl, 2990 (R$ 29,90), intervalo `year`**.
- **Trial 7 dias**: `subscription_data.trial_period_days: 7` no Checkout Session (Stripe vira `status=trialing` até o trial_end; após, cobra 1ª parcela; sem pagamento → `past_due` → `canceled`).
- Checkout: server action `billing/checkout.ts` cria Session (price_id, customer_email, success_url=`/perfil?upgrade=ok`, cancel_url=`/perfil`).
- **Webhook** (`/api/stripe/webhook`, `STRIPE_WEBHOOK_SECRET`): eventos `checkout.session.completed` (cria customer+subscription), `customer.subscription.updated` (upsert status/period/trial), `customer.subscription.deleted`, `invoice.payment_succeeded` (log). Upsert `subscriptions` com **service role**.
- **Não-RLS**: entitling é *entitlement*, não dado — nunca via RLS.

**Nível de confiança: ALTO** (padrão Stripe+Supabase consagrado).

---

## 7. Sugestão de itens "já usados"

- **Base**: `user_items` (por usuário), alimentada por trigger no INSERT de `items` (incrementa `times_used`, atualiza `last_used_at`/nome).
- **MVP**: autocomplete **híbrido** — (a) carrega top-50 por frequência no primeiro foco do input (filtro local = instantâneo) e (b) RPC `suggest_items(owner_id, q, limit=8)` → `WHERE name_key ILIKE q% ORDER BY times_used DESC, last_used_at DESC` para busca mais funda. Escala por usuário é trivial (centenas de itens) — sem pg_trgm no MVP.
- **Fase 2 (IA/OCR) sem quebrar**: adicionar `canonical_items` + `canonical_item_id` em `user_items`; o OCR (código de barras) resolve o item canônico e a sugestão passa a misturar ranking pessoal + catálogo. A RPC existente continua funcionando (interface estável). **Nível de confiança: ALTO**.

---

## 8. Compartilhamento em tempo real

- **Publicação Realtime** (Supabase: `alter publication supabase_realtime add table lists, items, list_members`) — `postgres_changes` com filtro por `list_id` no client.
- **Experiência**: convite por **link** (`/listas/[id]/convidar` → gera `sharing_tokens.token`; quem abre com token → RPC `join_list_by_token` valida e cria `list_members` role='editor'). Email-opcional Fase 2.
- **Concorrência (ADR-5)**: **optimistic updates + last-write-wins** por linha — cada mudança (check, preço, nome, ordem via `sort_order`) é 1 update; Realtime entrega o delta; `updated_at` para detectar conflito grosseiro (aviso "outra pessoa editou" se divergir >N s). Sem transações multi-linha no client. Canal `broadcast` de presença/typing: **fora do MVP**.
- **RLS vale no Realtime** — membro só vê suas listas.
- **Custo**: Realtime incluso nos planos Supabase free/Pro — ok no MVP; monitorar concorrência quando > ~200 users simultâneos.
- **Limite free vs premium**: free = **1 editor por lista** (trigger `tg_limit_editors`); premium = ilimitado. "Compartilhamento com 1 pessoa" do B1 interpretado como por-lista (simples e testável) — ver seção 12. **Nível de confiança: MÉDIO** (semântica do limite a confirmar com o chefe).

---

## 9. CI/CD + Deploy

| Item | Decisão |
|---|---|
| **CI** | GitHub Actions `.github/workflows/ci.yml`: on PR → `npm ci` → `tsc --noEmit` → `eslint` → `vitest run` → `build`. Bloqueia merge com falha. |
| **Deploy** | Vercel Git Integration: **master → prod** automático; PRs → previews. Sem Actions de deploy custom. |
| **Migrations** | `drizzle-kit generate` local (dba) → commits de `src/db/migrations/`. **Aplicação = manual e controlada pelo devops** (`npm run db:migrate:prod`, usa `SUPABASE_DB_URL` via Supabase CLI/`drizzle-kit migrate`): roda **antes** do merge do código dependente (ordem: migrate → merge → Vercel). RLS/triggers: `supabase db push` no arquivo `src/db/rls/*.sql` (dba). **Nunca** auto-migrar prod no CI. |
| **Secrets** | `.env.example` commitado com chaves documentadas; `.env*` no `.gitignore`; variáveis reais só no dashboard Vercel/Supabase. |
| **Env vars** | `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` (server) · `SUPABASE_DB_URL` (migrações) · `STRIPE_SECRET_KEY` · `STRIPE_WEBHOOK_SECRET` · `NEXT_PUBLIC_APP_URL` |
| **Node** | `.nvmrc` 20+ (requisito Next 16); engines no package.json |

**Check pré-entrega** (AGENTS.md) vale para todo branch.

---

## 10. Ordem de implementação (branches — mínimo conflito)

**Sequência 1 → 2 → depois 3–6 em paralelo** (backend/frontend sem pisar nos mesmos arquivos: schema/RLS primeiro para o front consumir tipos reais).

| # | Branch | Dono | Entrega | Critério de aceite |
|---|---|---|---|---|
| 1 | `chore/scaffold` | devops + frontend-dev | Next 16 + TS strict + Tailwind v4 + shadcn-ui + `.env.example` + CI + Vercel conectar + PWA manifest | `npm run build` verde no CI; preview deploy ok |
| 2 | `feat/db-core` | dba (+ backend-dev no schema) | schema Drizzle completo, migrations, **RLS + triggers** (owner, user_items, limites, `list_summary` view), `isPremium` helper SQL | `tsc` verde; policies testadas via SQL (dba) |
| 3 | `feat/auth` | backend-dev + frontend-dev | login/cadastro/magic link, `profiles` trigger, middleware, perfil básico | login→criar perfil→rota protegida |
| 4 | `feat/lists` | frontend (depende de 2) | CRUD de listas + orçamento + 3 visões (view + client recalcula) | critérios aceite: criar lista c/ orçamento + 3 visões corretas |
| 5 | `feat/items` | backend + frontend | adicionar item + sugestão (user_items/RPC) + check + preço (registerPrice txn) | digitar→sugestão→marcar→preço→visões atualizam |
| 6 | `feat/prices-history` | backend + frontend | histórico mês a mês (`DISTINCT ON`), tela `/item/[id]` + gráfico simples | comparação mês a mês correta p/ mesmo item |
| 7 | `feat/sharing` | backend + frontend | convite por link, `list_members`, Realtime, limites free/premium de membros | 2 contas editam mesma lista em tempo real |
| 8 | `feat/billing` | backend + frontend | Checkout Stripe (trial 7d, R$29,90/ano), webhook, `subscriptions`, entitling/upsells | upgrade→limites liberados; downgrade→limites voltam |
| 9 | `fix/hardening` | qa + security-blue-team | auditoria pós-merge (LGPD/RLS/Stripe), testes e2e críticos | zero CRITICAL; CI verde |

Melhor execução: **backend-dev faz 3/5/6/8 backend; frontend-dev faz 4/5/6/7/8 UI em paralelo** — o conflito real é só em 2 (precisa estar master antes de 4+).

---

## 11. ADR — resumo das decisões técnicas

| # | Decisão | Trade-off | Nível |
|---|---|---|---|
| ADR-1 | Item canônico = **`name_key` normalizado** (sem tabela catálogo) | ✗ variações ("Arroz 5kg" ≠ "Arroz") contam como itens distintos ✓ zero infra, histórico simples, evolui p/ IA sem quebrar | ALTO |
| ADR-2 | **`items.price_cents` (atual) + `item_prices` (append-only)** com gravação em transação única; 3 visões = view SQL + client recalcula | ✗ duplicidade lógica de fórmula (mitigada: 1 arquivo + teste) ✓ view = fonte correta, Realtime barato | ALTO |
| ADR-3 | RLS model: **owner como membro** (uma tabela `list_members` = um padrão de policy) | ✗ linha extra por lista ✓ políticas simples e uniformes; Realtime herda RLS | ALTO |
| ADR-4 | **Entitling no banco (trigger) + app (UX)**; `is_premium` derivado | ✗ constantes em 2 lugares (espelho comentado) ✓ infalível (não contorna via API) e mensagem amigável | ALTO |
| ADR-5 | **Realtime `postgres_changes` em lists/items/list_members + optimistic LWW**; broadcast/typing fora | ✗ LWW pode perder edição simultânea rara ✓ simples, escala no plano free; custo monitorado | MÉDIO |
| ADR-6 | **Moeda em `int` centavos** em todo o banco | ✗ require formatação central (`money.ts`) ✓ sem float, alinhado ao Stripe | ALTO |
| ADR-7 | **Soft delete** em lists/items (`deleted_at`) | ✗ dados mortos acumulam (triviais) ✓ histórico D2 sobrevive a "apaguei a lista de julho" | ALTO |

---

## 12. ⚠️ Ambiguidades — precisam de decisão do chefe (via Marina)

| # | Ponto | Conflito | Recomendação (arquitetura já suporta os 2 lados) |
|---|---|---|---|
| A1 | **3 visões no plano grátis?** | B1/D5 lista "orçamento 3 visões" como **Premium**; mas o critério de aceite do MVP e a decisão D3 (produto) incluem as 3 visões | **Free vê as 3 visões** (é o núcleo do produto; upsell = listas ilimitadas + histórico + família + sem anúncios). Se chefe escolher premium-only: gate em `isPremium` na UI — 1 linha por visão |
| A2 | **Listas grátis: 1 ou 2?** | D5 diz "1–2" | **2** (mostra valor; B1 cita "1-2"; limite é trigger, mudar = 1 constante) |
| A3 | **Várias listas no mesmo mês?** | Spec: "várias listas simultâneas, cada uma vinculada a um mês" — não diz se 1 por mês | **Sim, várias** (cada uma com orçamento próprio); sem unique no schema. Bloqueio 1/mês = fácil de adicionar depois |
| A4 | **"Compartilhamento com 1 pessoa" no free** | 1 convidado por lista ou 1 total? | **1 editor por lista** (simples, testável, fácil de comunicar) |
| A5 | **Item sem preço no VALOR TOTAL** | "soma dos preços de todos os itens" — itens não comprados não têm preço | **Ignorado** (só soma itens com preço); documentar na UI com tooltip |
| A6 | **Re-registrar preço no mesmo mês** | histórico mostra qual? | Mantém ambos; histórico mostra o **último** registrado (DISTINCT ON) |

---

## 13. Pendências de configuração (devops, antes do milestone 1)

1. Criar projeto **Supabase** (dev + prod) — ativar Auth (email confirmations ON), Realtime, publicação das 3 tabelas.
2. Criar **produto/price no Stripe** (R$ 29,90/ano, trial 7d no checkout) + webhook endpoint local (`stripe listen`) e prod (`/api/stripe/webhook`).
3. Conectar **Vercel** ao repo (master → prod; previews por PR).
4. Preencher `.env.example` e variáveis nos dashboards. Zero secrets no repo.

---

## Próximo passo: decisões A1–A6 pelo chefe

Documento completo acima — pronto para o dev-manager distribuir os milestones da seção 10. **Pré-requisito antes do milestone 4 (lists)**: chefe decidir A1 (3 visões free?) e A2 (1 ou 2 listas grátis) — impactam só constantes/gates, não a arquitetura. Sugiro atualizar o `project-state.md` com a seção "Arquitetura do MVP" + os 7 ADRs (Marina edita `projetos/**`; o tech-lead é somente leitura).
