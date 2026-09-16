ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS atlas_journey_stage text NOT NULL DEFAULT 'atlas_intro';

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_atlas_journey_stage_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_atlas_journey_stage_check
CHECK (atlas_journey_stage IN ('atlas_intro', 'quest_one', 'quest_two', 'lifetime_event', 'founder_journey', 'continue_quests', 'complete'));

UPDATE public.profiles
SET atlas_journey_stage = CASE
  WHEN onboarding_quest_completed IS TRUE THEN 'complete'
  WHEN atlas_onboarding_completed IS TRUE THEN 'quest_one'
  ELSE 'atlas_intro'
END
WHERE atlas_journey_stage = 'atlas_intro';