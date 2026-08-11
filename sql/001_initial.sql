-- Migration: Criar tabelas do ListToBuy
-- Rodar no Supabase SQL Editor

-- Tabela de listas de compras
CREATE TABLE IF NOT EXISTS lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  month TEXT NOT NULL,
  budget NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de itens da lista
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'un',
  completed NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de preços registrados
CREATE TABLE IF NOT EXISTS prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  value NUMERIC(10, 2) NOT NULL,
  month TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_month ON lists(month);
CREATE INDEX IF NOT EXISTS idx_items_list_id ON items(list_id);
CREATE INDEX IF NOT EXISTS idx_prices_item_id ON prices(item_id);
CREATE INDEX IF NOT EXISTS idx_prices_month ON prices(month);

-- RLS
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own lists" ON lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lists" ON lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lists" ON lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lists" ON lists
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own items" ON items
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM lists WHERE id = list_id));

CREATE POLICY "Users can insert own items" ON items
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM lists WHERE id = list_id));

CREATE POLICY "Users can update own items" ON items
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM lists WHERE id = list_id));

CREATE POLICY "Users can delete own items" ON items
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM lists WHERE id = list_id));

CREATE POLICY "Users can view own prices" ON prices
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM lists l JOIN items i ON l.id = i.list_id WHERE i.id = item_id));

CREATE POLICY "Users can insert own prices" ON prices
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM lists l JOIN items i ON l.id = i.list_id WHERE i.id = item_id));

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
