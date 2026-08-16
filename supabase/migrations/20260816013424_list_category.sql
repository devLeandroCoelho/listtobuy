-- Migration 007: Adiciona coluna category em lists (issue #115)
--
-- Permite associar uma categoria visual a cada lista de compras.
-- NULLABLE: listas existentes não terão categoria até o usuário definir.
-- Os ids armazenados correspondem a CategoryConfig.id de src/lib/categories.ts
-- (ex.: 'hortifruti', 'laticinios', 'carnes'). Sem FK/ENUM.

ALTER TABLE lists
  ADD COLUMN IF NOT EXISTS category TEXT;
