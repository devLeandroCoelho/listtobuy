import { pgTable, uuid, text, timestamp, numeric } from 'drizzle-orm/pg-core';

// ============================================
// Tabelas do ListToBuy — Drizzle ORM Schema
// ============================================

/** Referência para auth.users do Supabase (não gerenciada pelo Drizzle) */
const authUsers = pgTable('auth.users', {
  id: uuid('id').primaryKey(),
});

/** Tabela de usuários — espelha dados do Supabase Auth */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** Tabela de listas de compras — cada lista vinculada a um mês + orçamento */
export const lists = pgTable('lists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  month: text('month').notNull(), // Formato: "2026-08"
  budget: numeric('budget', { precision: 10, scale: 2 }).notNull().default('0'),
  archivedAt: timestamp('archived_at'), // NULL = ativa; preenchida = arquivada
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** Tabela de itens da lista — cada item pertence a uma lista */
export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  listId: uuid('list_id')
    .notNull()
    .references(() => lists.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  unit: text('unit').notNull().default('un'),
  completed: numeric('completed').notNull().default('0'), // 0 = pendente, 1 = comprado
  category: text('category'), // Categoria/seção do item (NULL = não categorizado); ex.: 'hortifruti'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** Tabela de preços registrados — histórico mês a mês por item */
export const prices = pgTable('prices', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id')
    .notNull()
    .references(() => items.id, { onDelete: 'cascade' }),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  month: text('month').notNull(), // Formato: "2026-08"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** Tabela de bug reports — usuários podem reportar bugs diretamente no app */
export const bugReports = pgTable('bug_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  email: text('email'),
  category: text('category').notNull().default('bug'),
  status: text('status').notNull().default('open'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
