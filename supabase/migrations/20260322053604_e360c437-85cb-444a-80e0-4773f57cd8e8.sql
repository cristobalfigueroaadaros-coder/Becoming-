
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS onboarding_quest_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS identity_direction_statement text;

ALTER TABLE public.atlas_quests
  ADD COLUMN IF NOT EXISTS is_onboarding boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_sequence int;
