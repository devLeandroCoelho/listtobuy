-- Migration 005: Adiciona coluna category em items (issue #41)
--
-- Categorização de itens por seção do mercado. Hoje a categorização é 100%
-- client-side (src/lib/categories.ts adivinha pelo nome do item). Com esta
-- coluna, a tag/seção escolhida pelo usuário passa a ser persistida.
--
-- Coluna NULLABLE e SEM default de propósito:
-- - itens existentes não têm categoria (NULL = "não categorizado");
-- - evita reservar um valor sentinela como 'outros' no banco.
-- Os ids armazenados correspondem a CategoryConfig.id de src/lib/categories.ts
-- (ex.: 'hortifruti', 'laticinios', 'carnes'). Sem FK/ENUM: o conjunto de
-- categorias é fluido e controlado pelo app.

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS category TEXT;

-- RLS: nenhuma policy nova necessária.
-- A policy "Users can update own items" (migration 001) já cobre UPDATE de
-- qualquer coluna de items — inclusive category — com o mesmo check de
-- ownership (auth.uid() = user_id da lista). Criar policy duplicada falharia
-- (nome já existe) ou criaria ruído; manter o padrão existente.
