-- Migration: Adicionar campos de lembrete e calendário
-- Rodar no Supabase SQL Editor

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS reminder_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_notified BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_items_reminder_date ON items(reminder_date);
