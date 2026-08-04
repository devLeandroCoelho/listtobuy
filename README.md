# ListToBuy

> **Anota a lista, o app controla o orçamento.**

---

## O que é

**Controle o orçamento do mês sem abrir mão de nada da lista.**

O ListToBuy é um app de lista de compras de supermercado com orçamento mensal.
Você monta a lista do mês, registra o preço de cada item conforme compra e vê na
hora o total da lista, o que já foi comprado e quanto ainda dá para gastar.
Tudo sincronizado entre celular e computador — e a família pode editar a mesma
lista em tempo real.

## Recursos principais

- **Listas mensais com orçamento** — cada lista é vinculada a um mês e tem o seu próprio orçamento.
- **3 visões de valor** — acompanhe de uma olhada o **VALOR TOTAL DA LISTA**, o **VALOR DO COMPRADO** e o **AINDA TEM PARA GASTAR** (orçamento do mês − valor já comprado).
- **Histórico de preços** — o app guarda o preço de cada item por data e mostra a evolução mês a mês (ex.: café R$ 18,90 em julho → R$ 21,50 em agosto).
- **Compartilhamento em tempo real** — convide a família e edite a mesma lista juntos, no mesmo momento.
- **Freemium** — grátis com 1-2 listas. **Premium por R$ 29,90/ano** com listas ilimitadas, histórico de preços, orçamento completo (3 visões), compartilhamento familiar ilimitado e sem anúncios.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 / React 19 / TypeScript strict / Tailwind v4 / shadcn-ui |
| Backend | Supabase (PostgreSQL + Auth + Storage) + Drizzle ORM |
| Pagamentos | Stripe |
| Deploy | Vercel |

## Status do projeto

**Status:** ✅ Fundação concluída · 🚧 MVP em planejamento

- **Fase 0 (fundação) — concluída:** pesquisa de mercado, modelo de monetização (Freemium) e naming (ListToBuy).
- **Fase 1 (MVP) — em planejamento:** autenticação, listas mensais com orçamento, 3 visões de valor, histórico de preços e compartilhamento em tempo real.

Confira o [ROADMAP.md](ROADMAP.md) para o planejamento completo.

## Como rodar localmente

**Em breve.** O código será adicionado na Fase 1 (MVP). Assim que o código inicial estiver no repositório, esta seção será atualizada com os passos reais.

```bash
npm install
npm run dev
```

## Estrutura de pastas

```
listtobuy/
├── README.md            # este arquivo
├── ROADMAP.md           # fases e entregas planejadas
├── project-state.md     # memória do projeto (acompanhamento interno)
└── docs/
    └── especificacao.md # definição do produto
```

## Licença

A definir — a licença deste repositório será publicada em breve.

## Contribuindo

Repositório público e em construção. Contribuições serão bem-vindas assim que o
MVP estiver publicado — acompanhe as issues e o [ROADMAP.md](ROADMAP.md).

**Repositório:** [github.com/devLeandroCoelho/listtobuy](https://github.com/devLeandroCoelho/listtobuy)
