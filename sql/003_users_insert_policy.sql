-- Migration: Policy INSERT para a tabela users
-- Corrige o cadastro: o app insere o perfil em `users` durante o signup,
-- mas não havia policy de INSERT (RLS bloqueava) — bug crítico de registro.

-- Garante idempotência (segura rodar múltiplas vezes)
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Usuário pode criar apenas o seu próprio perfil
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
