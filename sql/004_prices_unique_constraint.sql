-- SQL de referência: migration 004 (prices UNIQUE + UPDATE policy)
-- Espelho da supabase/migrations/20260812000400_prices_unique_constraint.sql

ALTER TABLE prices
  ADD CONSTRAINT prices_item_id_month_unique UNIQUE (item_id, month);

CREATE POLICY "Users can update own prices" ON prices
  FOR UPDATE USING (
    auth.uid() = (
      SELECT l.user_id
      FROM lists l
      JOIN items i ON l.id = i.list_id
      WHERE i.id = item_id
    )
  );
