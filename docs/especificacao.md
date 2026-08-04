# Lista de Mercado Inteligente — Especificação do Produto

> Documento vivo. Atualizado em: 2026-08-03
> Fonte: entrevista de descoberta com o chefe (10 perguntas, aprovado em 03/08/2026).

## Resumo

Aplicativo comercial de **listas de compras de mercado** com controle de orçamento
mensal e histórico de preços por item. Mobile + Web sincronizados (dados em nuvem).

## Decisões do produto (entrevista)

| # | Pergunta | Decisão |
|---|---|---|
| 1 | Público | **(c)** Comercial, aberto para todos |
| 2 | Plataforma | **(c)** Mobile + Web sincronizados |
| 3 | Adição de itens | **(a)** Digitação do nome do item |
| 4 | Várias listas | **(a)** Sim, várias listas simultâneas |
| 5 | Compartilhamento | **(a)** Sim, em tempo real (família) |
| 6 | Registro de preço | **(a)** Digitação manual por item |
| 7 | Comparativo | **(a)** Mesmo item, mês a mês (histórico de preços) |
| 8 | Supermercados | **(a)** 1 supermercado (sem comparativo entre lojas) |
| 9 | Gasto mensal | **Custom**: orçamento mensal + 3 visões (abaixo) |
| 10 | Categorias | **(b)** Sem controle por categoria de gasto |

## Orçamento mensal (decisão custom — item 9)

O usuário define um **orçamento mensal** para as compras. A tela da lista do mês mostra:

- **💰 VALOR TOTAL DA LISTA** — soma dos preços de todos os itens da lista
- **✅ VALOR DO COMPRADO** — soma dos preços dos itens marcados como comprados
- **⏳ AINDA TEM PARA GASTAR** — orçamento do mês − valor do comprado

> Obs.: a lista pertence a um mês; cada mês tem seu próprio orçamento.

## Histórico de preços (item 7)

O app guarda o preço de cada item **por data** (na compra/digitação). Com o tempo,
mostra a evolução mês a mês do mesmo item (ex.: café R$ 18,90 em julho → R$ 21,50 em agosto).

## Funcionalidades previstas (visão)

1. Autenticação de usuário (email/senha; social depois)
2. Várias listas simultâneas, cada uma vinculada a um mês
3. Adicionar item por digitação (com sugestão de itens já usados)
4. Marcar item como comprado (check) e registrar preço manual
5. Compartilhamento em tempo real da lista (convite por link/email)
6. Orçamento mensal por lista + 3 visões de valor
7. Histórico de preços por item (mês a mês)
8. Dados sincronizados mobile + web (nuvem)

## Fora de escopo (por enquanto)

- Comparação entre supermercados diferentes
- Controle de gastos por categoria
- Leitura de código de barras
- Listas compartilhadas com permissões complexas (só colaborador básico)

## Modelo de negócio (decisão B1 — aprovada em 03/08/2026)

**Freemium** — validado por pesquisa de mercado (concorrentes cobram US$ 8,99–15,99/ano;
nenhum oferece o combo orçamento + histórico + família).

- **Grátis:** 1-2 listas, sincronização, itens, compartilhamento com 1 pessoa.
- **Premium — R$ 29,90/ano (ou R$ ~4,90/mês, trial 7 dias):** listas ilimitadas,
  histórico de preços mês a mês, orçamento mensal completo (3 visões),
  compartilhamento familiar ilimitado, sem anúncios.
- **Estratégia:** preço âncora anual; mensal 2-3x mais caro proporcionalmente
  (empurra para o anual). Anúncios NUNCA no plano pago (lição do Out of Milk).
- **Conversão:** orçamento + histórico + família são features de retenção/switch cost
  (dados históricos prendem o usuário). Trial 7 dias; monitorar conversão no BR
  (benchmark global ~29,5%, deve ser menor no Brasil).

## Critérios de aceite (produto)

- [ ] Criar lista mensal com orçamento definido
- [ ] Adicionar itens digitando o nome
- [ ] Registrar preço manual por item
- [ ] Marcar item como comprado
- [ ] Ver VALOR TOTAL DA LISTA, VALOR DO COMPRADO e AINDA TEM PARA GASTAR
- [ ] Compartilhar lista com outra pessoa e editar em tempo real
- [ ] Ver histórico mês a mês do preço de um item
- [ ] Acessar os mesmos dados pelo mobile e pelo web

## Stack prevista (padrão da fábrica)

```
Frontend:  Next.js 16 / React 19 / TypeScript strict / Tailwind v4 / shadcn-ui
Backend:   Supabase (PostgreSQL + Auth + Storage) + Drizzle ORM
Payments:  Stripe (assinatura — definir modelo)
Hosting:   Vercel
Idioma:    pt-BR
```
