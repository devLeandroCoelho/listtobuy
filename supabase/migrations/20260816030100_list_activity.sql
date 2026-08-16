CREATE TABLE IF NOT EXISTS list_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_list_activity_list_id ON list_activity(list_id);
CREATE INDEX IF NOT EXISTS idx_list_activity_created_at ON list_activity(created_at);

ALTER TABLE list_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity for their lists" ON list_activity
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM lists WHERE id = list_id) OR
    auth.uid() IN (SELECT user_id FROM list_shares WHERE list_id = list_activity.list_id)
  );

CREATE POLICY "Users can insert activity for their lists" ON list_activity
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM lists WHERE id = list_id) OR
    auth.uid() IN (SELECT user_id FROM list_shares WHERE list_id = list_activity.list_id)
  );
