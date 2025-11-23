-- Create current_challenge table
CREATE TABLE public.current_challenge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_title TEXT NOT NULL,
  challenge_description TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  shadow_tag TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.current_challenge ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own current challenge"
ON public.current_challenge FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own current challenge"
ON public.current_challenge FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own current challenge"
ON public.current_challenge FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own current challenge"
ON public.current_challenge FOR DELETE
USING (auth.uid() = user_id);

-- Create daily_challenge table
CREATE TABLE public.daily_challenge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  challenge_title TEXT NOT NULL,
  challenge_description TEXT NOT NULL,
  source_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  reflection_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_challenge ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own daily challenges"
ON public.daily_challenge FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily challenges"
ON public.daily_challenge FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily challenges"
ON public.daily_challenge FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for current_challenge to create mapping dot
CREATE OR REPLACE FUNCTION public.create_challenge_dot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO insight_dots (
    user_id,
    source_type,
    source_id,
    insight_text,
    core_theme,
    skill_tags
  ) VALUES (
    NEW.user_id,
    'current_challenge',
    NEW.id,
    NEW.challenge_title || ': ' || NEW.challenge_description,
    'Challenge',
    ARRAY[NEW.challenge_type]
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_current_challenge_created
AFTER INSERT ON public.current_challenge
FOR EACH ROW
EXECUTE FUNCTION public.create_challenge_dot();

-- Trigger for completed daily challenges to create mapping dot
CREATE OR REPLACE FUNCTION public.create_daily_challenge_completion_dot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO insight_dots (
      user_id,
      source_type,
      source_id,
      insight_text,
      core_theme,
      emotional_tone
    ) VALUES (
      NEW.user_id,
      'daily_challenge_completion',
      NEW.id,
      'Daily Challenge Completed: ' || NEW.challenge_title || '. ' || COALESCE(NEW.reflection_text, ''),
      'Challenge Action',
      'accomplished'
    );
  ELSIF NEW.status = 'skipped' AND (OLD.status IS NULL OR OLD.status != 'skipped') THEN
    INSERT INTO insight_dots (
      user_id,
      source_type,
      source_id,
      insight_text,
      core_theme,
      emotional_tone
    ) VALUES (
      NEW.user_id,
      'daily_challenge_skipped',
      NEW.id,
      'Skipped Challenge: ' || NEW.challenge_title,
      'Challenge Action',
      'reflective'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_daily_challenge_status_changed
AFTER UPDATE ON public.daily_challenge
FOR EACH ROW
EXECUTE FUNCTION public.create_daily_challenge_completion_dot();

-- Trigger to update updated_at
CREATE TRIGGER update_current_challenge_updated_at
BEFORE UPDATE ON public.current_challenge
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();