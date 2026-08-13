-- Migration 006: Adiciona coluna archived_at em lists (issue #64)
--
-- Arquivamento de listas: permite ocultar listas antigas sem excluí-las.
-- NULL = ativa; timestamp preenchida = arquivada.

ALTER TABLE lists
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- RLS: nenhuma policy nova necessária.
-- A policy existente de UPDATE em lists já cobre alteração de archived_at.
