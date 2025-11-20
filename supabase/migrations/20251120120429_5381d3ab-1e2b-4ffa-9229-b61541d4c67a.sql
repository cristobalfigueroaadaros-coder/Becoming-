-- Create life_domains table to track user assessments across key life areas
CREATE TABLE public.life_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain_name TEXT NOT NULL,
  current_score INTEGER NOT NULL CHECK (current_score >= 1 AND current_score <= 10),
  future_score INTEGER NOT NULL CHECK (future_score >= 1 AND future_score <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, domain_name)
);

-- Enable Row Level Security
ALTER TABLE public.life_domains ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own life domains" 
ON public.life_domains 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own life domains" 
ON public.life_domains 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own life domains" 
ON public.life_domains 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own life domains" 
ON public.life_domains 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_life_domains_updated_at
BEFORE UPDATE ON public.life_domains
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();