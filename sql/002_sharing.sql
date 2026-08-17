-- Migration: Compartilhamento de listas com permissões
-- Rodar no Supabase SQL Editor

-- Tabela de compartilhamentos
CREATE TABLE IF NOT EXISTS list_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE,
  permission TEXT DEFAULT 'viewer' NOT NULL CHECK (permission IN ('owner', 'editor', 'viewer')),
  shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_list_shares_list_id ON list_shares(list_id);
CREATE INDEX IF NOT EXISTS idx_list_shares_user_id ON list_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_list_shares_token ON list_shares(token);

-- RLS
ALTER TABLE list_shares ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view shares for their lists" ON list_shares
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = (SELECT user_id FROM lists WHERE id = list_id)
  );

CREATE POLICY "List owners can share their lists" ON list_shares
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM lists WHERE id = list_id)
  );

CREATE POLICY "List owners can update shares" ON list_shares
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM lists WHERE id = list_id)
  );

CREATE POLICY "List owners can delete shares" ON list_shares
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM lists WHERE id = list_id)
  );

-- Habilitar Realtime para list_shares
ALTER PUBLICATION supabase_realtime ADD TABLE list_shares;
