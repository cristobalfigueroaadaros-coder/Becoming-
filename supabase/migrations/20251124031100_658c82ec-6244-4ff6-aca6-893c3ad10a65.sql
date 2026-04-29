-- Add user_notes column to dot_connections table
ALTER TABLE public.dot_connections 
ADD COLUMN user_notes text;

-- Add index for better query performance
CREATE INDEX idx_dot_connections_user_notes ON public.dot_connections(user_id) WHERE user_notes IS NOT NULL;