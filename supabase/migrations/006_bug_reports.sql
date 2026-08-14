-- Migration 006: Tabela de bug reports

CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  email TEXT,
  category TEXT NOT NULL DEFAULT 'bug',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at DESC);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bug reports" ON bug_reports FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own bug reports" ON bug_reports FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own bug reports" ON bug_reports FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can delete own bug reports" ON bug_reports FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);