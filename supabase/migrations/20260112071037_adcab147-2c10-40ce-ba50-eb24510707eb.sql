-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can view display names" ON public.user_display_names;

-- Create a new policy that only allows authenticated users to view display names
-- This is appropriate for a social app where logged-in users need to see other users' names
CREATE POLICY "Authenticated users can view display names" 
ON public.user_display_names 
FOR SELECT 
TO authenticated
USING (true);