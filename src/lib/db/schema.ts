import { pgTable, uuid, text, timestamp, numeric, check } from 'drizzle-orm/pg-core';

// Tabela de listas de compras
export const lists = pgTable('lists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  month: text('month').notNull(), // "2026-08"
  budget: numeric('budget', { precision: 10, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabela de itens da lista
export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  listId: uuid('list_id').notNull().references(() => lists.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  unit: text('unit').notNull().default('un'),
  completed: numeric('completed').notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabela de preços registrados
export const prices = pgTable('prices', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  month: text('month').notNull(), // "2026-08"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabela de usuários (espelha Supabase Auth)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Referência para auth.users do Supabase
const authUsers = pgTable('auth.users', {
  id: uuid('id').primaryKey(),
});
