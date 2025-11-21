-- Fix the search_path for the trigger function created in previous migration
CREATE OR REPLACE FUNCTION public.update_self_discovery_quests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;