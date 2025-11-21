-- Create constellation_entries table
CREATE TABLE IF NOT EXISTS public.constellation_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('book', 'idea', 'insight', 'milestone')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  key_takeaway TEXT,
  related_domains TEXT[],
  tags TEXT[],
  emotional_tone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create constellation_connections table (AI-generated insights)
CREATE TABLE IF NOT EXISTS public.constellation_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_ids UUID[] NOT NULL,
  connection_insight TEXT NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('theme', 'strength', 'purpose', 'trend', 'opportunity')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.constellation_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constellation_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for constellation_entries
CREATE POLICY "Users can view own constellation entries"
  ON public.constellation_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own constellation entries"
  ON public.constellation_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own constellation entries"
  ON public.constellation_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own constellation entries"
  ON public.constellation_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for constellation_connections
CREATE POLICY "Users can view own constellation connections"
  ON public.constellation_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own constellation connections"
  ON public.constellation_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own constellation connections"
  ON public.constellation_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX idx_constellation_entries_user_id ON public.constellation_entries(user_id);
CREATE INDEX idx_constellation_entries_entry_type ON public.constellation_entries(entry_type);
CREATE INDEX idx_constellation_entries_created_at ON public.constellation_entries(created_at DESC);
CREATE INDEX idx_constellation_connections_user_id ON public.constellation_connections(user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_constellation_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER update_constellation_entries_updated_at
  BEFORE UPDATE ON public.constellation_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_constellation_entries_updated_at();