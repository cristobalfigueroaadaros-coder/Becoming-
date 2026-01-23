-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view theme preferences" ON public.user_theme_preferences;

-- Create a restrictive policy: users can only view their own theme preferences
CREATE POLICY "Users can view own theme preferences"
ON public.user_theme_preferences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);