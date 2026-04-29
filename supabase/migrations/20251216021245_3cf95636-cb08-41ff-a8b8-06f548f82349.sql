-- Create value_map_blocks table to store the 13 blocks
CREATE TABLE public.value_map_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  block_key TEXT NOT NULL,
  content TEXT,
  is_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  unlock_source TEXT,
  unlock_source_id UUID,
  ai_suggestions JSONB DEFAULT '[]'::jsonb,
  user_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, block_key)
);

-- Create value_map_suggestions table for tracking suggestions
CREATE TABLE public.value_map_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  block_key TEXT NOT NULL,
  suggestion_text TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  source_context JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.value_map_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_map_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for value_map_blocks
CREATE POLICY "Users can view own blocks" ON public.value_map_blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own blocks" ON public.value_map_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own blocks" ON public.value_map_blocks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own blocks" ON public.value_map_blocks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for value_map_suggestions
CREATE POLICY "Users can view own suggestions" ON public.value_map_suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suggestions" ON public.value_map_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suggestions" ON public.value_map_suggestions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own suggestions" ON public.value_map_suggestions FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_value_map_blocks_updated_at
  BEFORE UPDATE ON public.value_map_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();