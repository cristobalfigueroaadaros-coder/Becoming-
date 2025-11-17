-- Create profiles table for Future Self data
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  future_age integer,
  future_location text,
  future_lifestyle text,
  main_mission text,
  emotional_tone text,
  main_strengths text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create mentor enum type
CREATE TYPE public.mentor_type AS ENUM (
  'mamba_mentor',
  'creative_visionary',
  'quantum_inventor',
  'ancient_sage',
  'compassionate_elder',
  'future_self'
);

-- Create user_mentors table to store which mentors each user chose
CREATE TABLE IF NOT EXISTS public.user_mentors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_type mentor_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, mentor_type)
);

ALTER TABLE public.user_mentors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mentors"
  ON public.user_mentors
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mentors"
  ON public.user_mentors
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create chats table for individual mentor conversations
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_type mentor_type NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chats"
  ON public.chats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats"
  ON public.chats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for chats
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;

-- Create council_meetings table for council sessions
CREATE TABLE IF NOT EXISTS public.council_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  answers jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.council_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings"
  ON public.council_meetings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meetings"
  ON public.council_meetings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create daily_whispers table
CREATE TABLE IF NOT EXISTS public.daily_whispers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_type mentor_type NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.daily_whispers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own whispers"
  ON public.daily_whispers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own whispers"
  ON public.daily_whispers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create premium_waitlist table
CREATE TABLE IF NOT EXISTS public.premium_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  desired_feature text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.premium_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert into waitlist"
  ON public.premium_waitlist
  FOR INSERT
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for profiles
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to check daily meeting limit (free tier: 1 per day)
CREATE OR REPLACE FUNCTION public.can_create_council_meeting(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meeting_count integer;
BEGIN
  SELECT COUNT(*)
  INTO meeting_count
  FROM public.council_meetings
  WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';
  
  RETURN meeting_count < 1;
END;
$$;