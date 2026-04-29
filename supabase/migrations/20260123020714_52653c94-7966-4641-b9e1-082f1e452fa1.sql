-- Add voice_context column to conversation_handoffs for Voice of System integration
ALTER TABLE public.conversation_handoffs 
ADD COLUMN IF NOT EXISTS voice_context JSONB DEFAULT NULL;

-- Add initiated_by column to track who initiated the handoff
ALTER TABLE public.conversation_handoffs 
ADD COLUMN IF NOT EXISTS initiated_by TEXT DEFAULT 'user';

-- Add voice_initiated column to saved_insights to track Voice-led discoveries
ALTER TABLE public.saved_insights 
ADD COLUMN IF NOT EXISTS initiated_by TEXT DEFAULT 'user';

-- Create index for faster queries on voice-initiated handoffs
CREATE INDEX IF NOT EXISTS idx_conversation_handoffs_initiated_by 
ON public.conversation_handoffs(initiated_by);

-- Add comment for documentation
COMMENT ON COLUMN public.conversation_handoffs.voice_context IS 'Context from Voice of the System when initiating handoff';
COMMENT ON COLUMN public.conversation_handoffs.initiated_by IS 'Who initiated the handoff: user, voice_system, or mentor_suggestion';