# ListToBuy — Estado do Projeto (Memória Canônica)

> **Regra de ouro**: TODO agente deve ler este arquivo ANTES de varrer o repositório.
> Ao final de cada missão, atualize este arquivo com o que mudou.
> Última atualização: 2026-08-03 (README.md público criado)

---

## 1. Visão Geral

**ListToBuy** — aplicativo comercial de listas de compras de mercado com orçamento
mensal, controle de gastos por lista (total / comprado / resta) e histórico de
preços mês a mês. Mobile + Web sincronizados. **Modelo Freemium** (grátis 1-2
listas + Premium R$ 29,90/ano).

- **Nome oficial**: ListToBuy (aprovado pelo chefe em 03/08/2026, decisão D6)
- **Domínio**: por enquanto endereço Vercel gratuito (ex.: `listtobuy.vercel.app`);
  domínio próprio/INPI **postergados** (decisão D6)

## 2. Stack

```
Frontend:    Next.js 16 / React 19 / TypeScript strict / Tailwind v4 / shadcn-ui
Styling:     Tailwind v4 + shadcn-ui
Backend:     Supabase (PostgreSQL + Auth + Storage) + Drizzle ORM
Áudio/Voz:   n/a
Payments:    Stripe (assinatura Freemium — Premium R$ 29,90/ano)
Hosting:     Vercel
Analytics:   a definir
```

## 3. Status Atual (produção)

| Item | Status |
|---|---|
| Deploy | ⬜ não iniciado |
| Migrations | ⬜ |
| RLS/Segurança | ⬜ |
| Build | ⬜ |
| Testes | ⬜ |
| CI | 🟡 PR #5 (feat/ci-cd) — GitHub Actions CI/CD |
| Landing Page | 🟡 PR #6 (feat/landing-page-auth) — Hero, Features, Pricing, Auth |
| Price Tracking + Budget Views | 🟡 PR #8 (feat/prices-views) — API preços, BudgetSummary, página lista |
| Price History | 🟡 PR #11 (feat/price-history) — Componente PriceHistory, API /api/prices/history |
| List Sharing | 🟡 PR #12 (feat/sharing) — Tabela list_shares, API CRUD, componente ShareList |

## 4. Decisões Arquiteturais (não reverter sem discussão)

| # | Decisão | Motivo |
|---|---|---|
| D1 | Sem controle por categoria de gasto (decisão de produto) | Definido na entrevista (item 10) |
| D2 | Comparativo de preço: mesmo item, mês a mês (não entre lojas) | Definido na entrevista (itens 7-8) |
| D3 | Orçamento mensal por lista + 3 visões (total/comprado/resta) | Definido na entrevista (item 9) |
| D4 | Preço registrado manualmente por item (sem código de barras) | Definido na entrevista (item 6) |
| D5 | Monetização Freemium: grátis 1-2 listas; Premium R$ 29,90/ano com listas ilimitadas, histórico de preços, orçamento 3 visões e família ilimitada | Decisão B1 aprovada pelo chefe (03/08/2026), com base em pesquisa de mercado |
| D6 | **Nome do produto: ListToBuy** (validação de mercado com 6 rodadas: Gastô/Listô/Listei/ListAI/BotaAí/SacolaAí/Meu Carrinho/ListMe rejeitados por colisão; ListToBuy aprovado: domínios .com.br/.com/.app livres, loja limpa, inglês simples "lista pra comprar"). **Domínio próprio + INPI postergados** — por enquanto endereço Vercel gratuito | Decisão do chefe 03/08/2026; pesquisa Rafael; evita custo inicial de ~R$150-200/ano; registrar quando houver tração |

## 5. Arquivos-Chave

| Arquivo | Propósito | Notas |
|---|---|---|
| `docs/especificacao.md` | Definição do produto (decisões da entrevista) | Fonte da verdade de produto |
| `ROADMAP.md` | Fases e entregas planejadas | |
| `project-state.md` | Memória canônica do projeto | Este arquivo |
| `README.md` | Vitrine pública do projeto (pt-BR, tom comercial) | Criado em 03/08/2026 — pronto para o repo público |

## 6. Auditorias Recentes

| Auditor | Resultado | Foco |
|---|---|---|
| — | — | Nenhuma ainda (projeto recém-criado) |

## 7. Pendências Priorizadas (Backlog)

### 🔴 Bloqueadores de negócio
| ID | Item | Dono | Origem | Status |
|---|---|---|---|---|
| B1 | Modelo de monetização (assinatura vs. gratuito) | market-researcher | Planejamento | ✅ fechado: Freemium (B) |

### 🟠 Índices e integridade
_(n/a — banco ainda não criado)_

### 🟡 Menores / postergadas
| ID | Item | Dono | Origem | Status |
|---|---|---|---|---|
| P1 | Registro de domínio próprio (`listtobuy.com.br`/`.com`/`.app` — todos livres hoje) | chefe | Decisão D6 | ⏸️ postergado (Vercel grátis por enquanto); registrar quando houver tração |
| P2 | Consulta formal de anterioridade INPI (classes 9/35/42) + registro de marca "LISTTOBUY" | copywriter/chefe | Decisão D6 | ⏸️ postergado; requisito antes de esforço de branding |
| P3 | Teste de aceitação do nome com 5-10 usuários BR (pronúncia "ListToBuy", escrever, adivinhar função) | market-researcher | Rafael | ⏸️ postergado (opcional pré-lançamento) |

## 8. Sessões por Agente (task_id para continuidade)

> Reutilize o `task_id` ao acionar o agente — a sessão preserva o contexto já lido.

| Agente | task_id | Contexto já carregado |
|---|---|---|
| market-researcher | `ses_03775063dffer3fIxFRp880n3h` | Pesquisa completa: concorrentes, demanda, monetização (Freemium) |
| market-researcher | `ses_0375dd918ffe8lptk61Rbh0csL` | Validação nome Gastô ❌ (domínios, lojas, INPI, percepção) |
| market-researcher | `ses_0375b363effesapYPKcM0gwMD4` | Validação Listei!/Listô ❌ |
| market-researcher | `ses_037575834ffedMmLxyaBe9yQjr` | Vibe Gastô/Listei: Montei/Fechei/Juntei (filtro sem "feira") |
| market-researcher | `ses_0374b8ce2ffevQGm0PTGFfM0to` | Família "Aí": BotaAí/SacolaAí aprovados, ListaAí/OrçaAí ❌ |
| market-researcher | `ses_0373696d7ffeefAtkm27cdMyC1` | ListAI ❌ + Listei! caiu (JáListei) |
| market-researcher | `ses_0373237d5ffem1Yux8UUrtfP5W` | Rodada inglês/possessivos: **ListToBuy ✅ aprovado** (top 1) |
| backend-dev | `ses_0376bbf9affeO9rM6G4EHGgn1b` | Estrutura multi-projeto + globs de permissão corrigidos |
| copywriter | `ses_0377838e0ffejzHPIFO7DpNrbt` | AGENTS.md + GUIA-DA-FABRICA.md (multi-projeto) |

## 9. Fluxo de Trabalho (Convenções)

1. Toda mudança em **branch própria** a partir de `master` (ex: `fix/...`, `feat/...`)
2. **dev-manager** é o ÚNICO que aprova PR e faz merge
3. Auditoria pós-merge: qa-engineer + security-blue-team (ui-ux e perf quando aplicável)
4. Deploy: devops aplica migrations + build + deploy + smoke tests
5. Zero commits em master. Zero `.env` no repo.

## 10. Métricas do Projeto

| Métrica | Valor |
|---|---|---|
| Status | ✅ Descoberta + pesquisa + monetização + **naming (ListToBuy) concluídos** — Fase 1 em andamento (Price History + List Sharing) |
