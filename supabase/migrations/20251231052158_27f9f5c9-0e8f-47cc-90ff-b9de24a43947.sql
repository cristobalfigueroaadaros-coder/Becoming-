-- Create becoming_discoveries table for tracking self-discovery through conversations
-- This is separate from the existing quest_progress which tracks step-based quests
CREATE TABLE becoming_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  discovery_type TEXT NOT NULL, -- 'ikigai', 'core_values', 'strengths', 'my_why', 'patterns'
  element_key TEXT NOT NULL, -- 'love', 'good_at', 'needs', 'paid_for', 'values_list', 'why_statement'
  element_value TEXT NOT NULL, -- The actual extracted content
  source TEXT DEFAULT 'manual', -- 'manual', 'future_self_conversation'
  source_message_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, discovery_type, element_key)
);

-- Daily journal for private reflection
CREATE TABLE daily_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_date DATE DEFAULT CURRENT_DATE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  detected_emotions JSONB,
  detected_patterns JSONB,
  detected_themes JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

-- Ideal life snapshot for visual north star
CREATE TABLE ideal_life_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  relationships TEXT,
  family TEXT,
  work TEXT,
  lifestyle TEXT,
  contribution TEXT,
  environment TEXT,
  generated_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE becoming_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideal_life_snapshots ENABLE ROW LEVEL SECURITY;

-- Becoming discoveries policies
CREATE POLICY "Users can view own discoveries"
  ON becoming_discoveries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own discoveries"
  ON becoming_discoveries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discoveries"
  ON becoming_discoveries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own discoveries"
  ON becoming_discoveries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Daily journal policies
CREATE POLICY "Users can view own journal entries"
  ON daily_journal FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON daily_journal FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON daily_journal FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON daily_journal FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ideal life snapshot policies
CREATE POLICY "Users can view own life snapshot"
  ON ideal_life_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own life snapshot"
  ON ideal_life_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own life snapshot"
  ON ideal_life_snapshots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update timestamp triggers
CREATE TRIGGER update_becoming_discoveries_updated_at
  BEFORE UPDATE ON becoming_discoveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_journal_updated_at
  BEFORE UPDATE ON daily_journal
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ideal_life_snapshots_updated_at
  BEFORE UPDATE ON ideal_life_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();