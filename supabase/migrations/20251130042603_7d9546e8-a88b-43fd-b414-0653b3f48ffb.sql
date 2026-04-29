-- Create mentor_private_messages table
CREATE TABLE public.mentor_private_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mentor_type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  council_meeting_id UUID REFERENCES public.council_meetings(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentor_private_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view own private messages" 
ON public.mentor_private_messages
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own messages (mark as read)
CREATE POLICY "Users can update own private messages" 
ON public.mentor_private_messages
FOR UPDATE 
USING (auth.uid() = user_id);

-- Edge functions can insert messages
CREATE POLICY "Service role can insert private messages" 
ON public.mentor_private_messages
FOR INSERT 
WITH CHECK (true);