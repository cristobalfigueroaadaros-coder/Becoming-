-- Fix: Make waitlist INSERT policy more restrictive
-- Require user's email to match their auth email
DROP POLICY IF EXISTS "Authenticated users can join waitlist" ON public.premium_waitlist;

CREATE POLICY "Users can add themselves to waitlist"
ON public.premium_waitlist
FOR INSERT
TO authenticated
WITH CHECK (email = auth.email());