-- Fix update_self_discovery_progress_updated_at to include SECURITY DEFINER and search_path
CREATE OR REPLACE FUNCTION public.update_self_discovery_progress_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;