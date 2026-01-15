-- Fix overly permissive RLS policies

-- 1. mentor_private_messages: Service role insert should be restricted
-- This table is for system-generated messages, so we keep it service-role only
-- but make the policy more explicit
DROP POLICY IF EXISTS "Service role can insert private messages" ON public.mentor_private_messages;

-- Service role bypass RLS anyway, so this policy was redundant
-- Users should only be able to read their own messages, not insert
-- The existing SELECT policy likely handles user access

-- 2. premium_waitlist: Restrict insert to authenticated users only
-- This prevents spam/abuse from anonymous users
DROP POLICY IF EXISTS "Anyone can insert into waitlist" ON public.premium_waitlist;

CREATE POLICY "Authenticated users can join waitlist"
ON public.premium_waitlist
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Note: Keeping WITH CHECK (true) for authenticated users is acceptable
-- since we want any logged-in user to be able to submit their info