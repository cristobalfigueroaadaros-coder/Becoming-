-- Create conversation_handoffs table for tracking mentor handoffs
CREATE TABLE public.conversation_handoffs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_mentor_type TEXT NOT NULL,
  target_mentor_type TEXT NOT NULL,
  source_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  handoff_summary TEXT,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_handoffs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert own handoffs" 
ON public.conversation_handoffs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own handoffs" 
ON public.conversation_handoffs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own handoffs" 
ON public.conversation_handoffs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own handoffs" 
ON public.conversation_handoffs 
FOR DELETE 
USING (auth.uid() = user_id);