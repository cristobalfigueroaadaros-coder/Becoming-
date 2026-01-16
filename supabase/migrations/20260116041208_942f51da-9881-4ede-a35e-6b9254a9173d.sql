-- Add 5 new mentor types to the mentor_type enum
ALTER TYPE public.mentor_type ADD VALUE IF NOT EXISTS 'perspective_mentor';
ALTER TYPE public.mentor_type ADD VALUE IF NOT EXISTS 'challenger_mentor';
ALTER TYPE public.mentor_type ADD VALUE IF NOT EXISTS 'design_thinking_mentor';
ALTER TYPE public.mentor_type ADD VALUE IF NOT EXISTS 'ux_mentor';
ALTER TYPE public.mentor_type ADD VALUE IF NOT EXISTS 'gamification_mentor';