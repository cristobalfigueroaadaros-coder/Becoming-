
-- Create superpowers table
CREATE TABLE public.superpowers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pattern_id UUID NOT NULL REFERENCES public.inner_patterns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '⚡',
  color TEXT NOT NULL DEFAULT 'amber',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.superpowers ENABLE ROW LEVEL SECURITY;

-- Users can read their own superpowers
CREATE POLICY "Users can view their own superpowers"
ON public.superpowers FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own superpowers
CREATE POLICY "Users can create their own superpowers"
ON public.superpowers FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own superpowers
CREATE POLICY "Users can delete their own superpowers"
ON public.superpowers FOR DELETE
USING (auth.uid() = user_id);
