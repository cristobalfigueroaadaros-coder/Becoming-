-- Add Transmutation Council mentor types to the enum
ALTER TYPE public.mentor_type ADD VALUE IF NOT EXISTS 'storybreaker_mentor';
ALTER TYPE public.mentor_type ADD VALUE IF NOT EXISTS 'phoenix_mentor';
ALTER TYPE public.mentor_type ADD VALUE IF NOT EXISTS 'stoic_mentor';