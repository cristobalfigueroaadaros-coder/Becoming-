-- Add Action Engine fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_win_path text CHECK (first_win_path IN ('create_share', 'test_idea', 'offer_something')),
ADD COLUMN IF NOT EXISTS first_win_proof_text text,
ADD COLUMN IF NOT EXISTS first_win_proof_url text,
ADD COLUMN IF NOT EXISTS creation_gate_passed_at timestamptz,
ADD COLUMN IF NOT EXISTS reflection_loop_count integer DEFAULT 0;

-- Create first_win_proofs table for storing proof submissions
CREATE TABLE IF NOT EXISTS public.first_win_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_type text NOT NULL CHECK (path_type IN ('create_share', 'test_idea', 'offer_something')),
  proof_type text NOT NULL CHECK (proof_type IN ('link', 'screenshot', 'text', 'description')),
  proof_content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on first_win_proofs
ALTER TABLE public.first_win_proofs ENABLE ROW LEVEL SECURITY;

-- RLS policies for first_win_proofs
CREATE POLICY "Users can insert own proofs" ON public.first_win_proofs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own proofs" ON public.first_win_proofs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own proofs" ON public.first_win_proofs
  FOR UPDATE USING (auth.uid() = user_id);