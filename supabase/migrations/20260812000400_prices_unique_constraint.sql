-- Migration 004: Adiciona UNIQUE(item_id, month) na tabela prices
-- 
-- Root cause do bug #33/#34: a rota POST /api/prices usa upsert com
-- onConflict: 'item_id,month', mas a constraint não existia na migration 001.
-- Sem ela, o Supabase retornava erro 500 ao tentar salvar qualquer preço.
--
-- Também adiciona policy UPDATE para que o upsert (que internamente faz UPDATE)
-- funcione corretamente com RLS habilitado.

-- 1. Adiciona a constraint UNIQUE necessária para o upsert funcionar
ALTER TABLE prices
  ADD CONSTRAINT prices_item_id_month_unique UNIQUE (item_id, month);

-- 2. Adiciona policy de UPDATE (necessária para o upsert via RLS)
CREATE POLICY "Users can update own prices" ON prices
  FOR UPDATE USING (
    auth.uid() = (
      SELECT l.user_id
      FROM lists l
      JOIN items i ON l.id = i.list_id
      WHERE i.id = item_id
    )
  );
