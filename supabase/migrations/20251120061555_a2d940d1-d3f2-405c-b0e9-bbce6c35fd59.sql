-- Add shadow_intensity preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN shadow_intensity text DEFAULT 'balanced' CHECK (shadow_intensity IN ('gentle', 'balanced', 'deep_work'));

COMMENT ON COLUMN public.profiles.shadow_intensity IS 'User preference for shadow encounter frequency: gentle (30%), balanced (60%), deep_work (90%)';