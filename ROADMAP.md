# ListToBuy — Roadmap

> Atualizado em: 2026-08-11

## 📋 Fase 0 — Fundação
- [x] Pesquisa de mercado e validação do conceito (market-researcher)
- [x] Definir modelo de monetização — ✅ **Freemium** (grátis 1-2 listas + Premium R$ 29,90/ano)
- [x] **Definir nome do produto — ✅ ListToBuy** (6 rodadas de validação; decisão D6)
- [x] Criar repositório GitHub + setup inicial (PRs #1–#4 merged — repo, schema, Supabase client, layout)
- [x] Configurar ambiente e deploy — ✅ **produção ativa na Vercel** (`https://listtobuy-9lt1yznz7-leandro-s-projects-07ac6837.vercel.app`)
- [x] Configurar CI/CD (PR #5 — GitHub Actions; CI verde)
- [x] Landing page / site institucional (PR #6 — Hero, Features, Pricing, Auth)
- [x] Supabase em produção: projeto `ynxbtrhaebvoblvtczna` ativo; migrations 001 (initial) + 002 (sharing) aplicadas; RLS habilitado em todas as tabelas
- [ ] ~~Registrar domínio próprio + INPI~~ → ⏸️ postergado (D6): quando houver tração
- [ ] Teste de aceitação do nome com 5-10 usuários BR (opcional pré-lançamento)

## 🚀 Fase 1 — MVP ✅ ~95% completo (faltam sugestão de itens, validações/UX e Stripe)
- [x] Auth (cadastro/login) + perfil — PR #6
- [x] CRUD de listas mensais (cada lista vinculada a um mês + orçamento) — PR #7
- [x] Adicionar item por digitação — PR #7
- [ ] **Sugestão de itens já usados** (autocomplete com histórico do usuário) — ❌ não implementado (pendente)
- [x] Marcar item como comprado + registrar preço manual — PR #8
- [x] 3 visões de valor: VALOR TOTAL DA LISTA / VALOR DO COMPRADO / AINDA TEM PARA GASTAR — PR #8
- [x] Histórico de preços mês a mês por item — PR #11
- [x] Compartilhamento da lista (colaborador) — PR #12 (tabela list_shares + API CRUD + componente ShareList)
- [x] Fixes de qualidade pós-features — PRs #9, #10 e #13 (types/ESLint/CI env)
- [ ] Validações/UX finais + smoke tests de UX em produção (qa-engineer / ui-ux-designer) — pendente
- [ ] Integração Stripe (Premium R$ 29,90/ano): checkout, webhooks, gestão de assinatura — pendente

> Nota: colaboração "em tempo real" (Supabase Realtime) ainda não validada — confirmar na auditoria de UX.

## 📈 Fase 2 — Expansão
> ⚠️ Itens marcados contrariam decisões de produto (D1/D2) — revisar antes de priorizar.
- [ ] Leitura de código de barras (preço automático)
- [ ] Comparação entre supermercados — ⚠️ contraria D2
- [ ] Controle de gastos por categoria — ⚠️ contraria D1
- [ ] Notificações de preço (item subiu/desceu)
- [ ] App mobile nativo (hoje: PWA/responsivo)

## 💡 Ideias Futuras
- [ ] Receitas sugeridas com base na lista
- [ ] Exportação/relatórios do mês
- [ ] Multi-idioma

## 📋 Como atualizar
1. Adicionar item na seção correspondente
2. Ao implementar, mover para ✅ com `[x]`
3. Este arquivo é a fonte para planejamento do desenvolvimento
