-- Add transmutation_data column to inner_patterns table
ALTER TABLE public.inner_patterns 
ADD COLUMN IF NOT EXISTS transmutation_data JSONB DEFAULT '{}';