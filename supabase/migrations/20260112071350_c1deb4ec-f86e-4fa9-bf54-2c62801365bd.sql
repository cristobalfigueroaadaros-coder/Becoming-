-- Add explicit SELECT policy that prevents public reading
-- Only authenticated admin users should be able to read waitlist entries
-- For now, we'll create a policy that blocks all SELECT access
-- (If admin access is needed later, a proper admin role system can be implemented)

-- This policy ensures no one can SELECT from the waitlist table
-- The table is write-only for public users (they can sign up but not see other signups)
CREATE POLICY "No public read access to waitlist" 
ON public.premium_waitlist 
FOR SELECT 
TO authenticated
USING (false);