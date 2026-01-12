-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view user badges" ON public.user_badges;

-- Create a new policy that restricts SELECT to the badge owner only
CREATE POLICY "Users can view their own badges"
ON public.user_badges
FOR SELECT
USING (auth.uid() = user_id);