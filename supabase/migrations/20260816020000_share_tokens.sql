-- Migration: Adiciona suporte a tokens de compartilhamento público

-- Adiciona coluna token na tabela list_shares
ALTER TABLE list_shares 
  ADD COLUMN IF NOT EXISTS token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Índice para busca por token
CREATE INDEX IF NOT EXISTS idx_list_shares_token ON list_shares(token);

-- Atualiza RLS para permitir acesso via token
DROP POLICY IF EXISTS "Users can view shares for their lists" ON list_shares;
CREATE POLICY "Users can view shares for their lists" ON list_shares
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = (SELECT user_id FROM lists WHERE id = list_id) OR
    token IS NOT NULL
  );
