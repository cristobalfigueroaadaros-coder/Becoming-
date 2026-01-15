-- Fix: Restrict user_display_names SELECT policy to own data only
DROP POLICY IF EXISTS "Users can view display names" ON public.user_display_names;

CREATE POLICY "Users can view their own display name"
ON public.user_display_names
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);