<div align="center">

# ListToBuy

> **Add items to the list — the app handles the budget.**

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

![Status](https://img.shields.io/badge/Status-MVP_Planning-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-TBD-blue?style=for-the-badge)

</div>

---

Grocery shopping list app with **monthly budget tracking**, **price history**, and **real-time family sharing**.

## Features

- **Monthly budgets** — each list is tied to a month with its own budget limit
- **3 value views** — track Total List Value, Amount Spent, and Remaining Budget at a glance
- **Price history** — the app stores each item's price over time, showing month-to-month evolution
- **Real-time sharing** — invite family members to edit the same list simultaneously
- **Freemium model** — free tier with 1–2 lists; Premium at R$ 29.90/year for unlimited lists, history, full budget views, family sharing, and no ads

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 · React 19 · TypeScript strict · Tailwind v4 · shadcn-ui |
| Backend | Supabase (PostgreSQL + Auth + Storage) · Drizzle ORM |
| Payments | Stripe |
| Deploy | Vercel |

## Project Status

| Phase | Status |
|-------|--------|
| Phase 0 — Foundation | ✅ Complete (market research, monetization, naming) |
| Phase 1 — MVP | 🚧 In Planning |

See [ROADMAP.md](ROADMAP.md) for full planning details.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/devLeandroCoelho/listtobuy.git
cd listtobuy

# Install dependencies
npm install

# Start development server
npm run dev
```

> ⚠️ Code will be added in Phase 1 (MVP). This section will be updated once the initial codebase is available.

## Folder Structure

```
listtobuy/
├── README.md              # This file
├── ROADMAP.md             # Phases and planned deliveries
├── project-state.md       # Internal project memory
└── docs/
    └── specification.md   # Product definition
```

## Contributing

Public repository under construction. Contributions will be welcome once the MVP is published — follow the issues and [ROADMAP.md](ROADMAP.md).

## License

To be defined.

---

<div align="center">

## 🇧🇷 Português

# ListToBuy — Lista de Compras com Orçamento

> **Anota a lista, o app controla o orçamento.**

App de lista de compras de supermercado com **orçamento mensal**, **histórico de preços** e **compartilhamento familiar em tempo real**.

### Funcionalidades

- **Orçamentos mensais** — cada lista é vinculada a um mês com seu próprio limite
- **3 visões de valor** — Valor Total da Lista, Valor Comprado e Ainda Tem Para Gastar
- **Histórico de preços** — guarda o preço de cada item por data e mostra a evolução mês a mês
- **Compartilhamento em tempo real** — convide a família para editar a mesma lista juntos
- **Modelo Freemium** — grátis com 1-2 listas · Premium por R$ 29,90/ano

### Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16 · React 19 · TypeScript strict · Tailwind v4 · shadcn-ui |
| Backend | Supabase (PostgreSQL + Auth + Storage) · Drizzle ORM |
| Pagamentos | Stripe |
| Deploy | Vercel |

### Status do Projeto

| Fase | Status |
|------|--------|
| Fase 0 — Fundação | ✅ Concluída |
| Fase 1 — MVP | 🚧 Em Planejamento |

### Como rodar

```bash
git clone https://github.com/devLeandroCoelho/listtobuy.git
cd listtobuy
npm install
npm run dev
```

> O código será adicionado na Fase 1 (MVP).

Consulte o [ROADMAP.md](ROADMAP.md) para o planejamento completo.

**Licença:** A definir

</div>
