-- Create trigger for goal achievements (function already exists)
CREATE TRIGGER trigger_goal_achievement_dot
AFTER UPDATE ON daily_goals
FOR EACH ROW
EXECUTE FUNCTION create_goal_achievement_dot();

-- Also trigger for weekly, monthly, yearly goals
CREATE TRIGGER trigger_weekly_goal_achievement_dot
AFTER UPDATE ON weekly_goals
FOR EACH ROW
EXECUTE FUNCTION create_goal_achievement_dot();

CREATE TRIGGER trigger_monthly_goal_achievement_dot
AFTER UPDATE ON monthly_goals
FOR EACH ROW
EXECUTE FUNCTION create_goal_achievement_dot();

CREATE TRIGGER trigger_yearly_goal_achievement_dot
AFTER UPDATE ON yearly_goals
FOR EACH ROW
EXECUTE FUNCTION create_goal_achievement_dot();

-- Create trigger for shadow integrations (function already exists)
CREATE TRIGGER trigger_shadow_integration_dot
AFTER UPDATE ON shadow_encounters
FOR EACH ROW
EXECUTE FUNCTION create_shadow_integration_dot();

-- Create trigger for journal breakthroughs (function already exists)
CREATE TRIGGER trigger_journal_breakthrough_dot
AFTER INSERT OR UPDATE ON actual_self_journal
FOR EACH ROW
EXECUTE FUNCTION create_journal_breakthrough_dot();

-- Create trigger for domain milestones (function already exists)
CREATE TRIGGER trigger_domain_milestone_dot
AFTER UPDATE ON life_domains
FOR EACH ROW
EXECUTE FUNCTION create_domain_milestone_dot();

-- Create trigger for quest completions (function already exists)
CREATE TRIGGER trigger_quest_completion_dot
AFTER UPDATE ON quest_progress
FOR EACH ROW
EXECUTE FUNCTION create_quest_completion_dot();

-- Create function for council meeting insights
CREATE OR REPLACE FUNCTION public.create_council_meeting_dot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create dot when council meeting gets a resolution
  IF NEW.resolution IS NOT NULL AND (OLD.resolution IS NULL OR OLD.resolution = '') THEN
    INSERT INTO insight_dots (
      user_id,
      source_type,
      source_id,
      insight_text,
      core_theme,
      emotional_tone
    ) VALUES (
      NEW.user_id,
      'council_meeting',
      NEW.id,
      'Council wisdom: ' || SUBSTRING(NEW.resolution, 1, 200) || CASE WHEN LENGTH(NEW.resolution) > 200 THEN '...' ELSE '' END,
      'Council Guidance',
      'reflective'
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for council meetings
CREATE TRIGGER trigger_council_meeting_dot
AFTER INSERT OR UPDATE ON council_meetings
FOR EACH ROW
EXECUTE FUNCTION create_council_meeting_dot();

-- Create function for mentor chat insights
CREATE OR REPLACE FUNCTION public.create_mentor_chat_dot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  recent_messages TEXT;
  chat_count INTEGER;
BEGIN
  -- Only process assistant messages (mentor responses)
  IF NEW.role = 'assistant' THEN
    -- Count total messages in this conversation
    SELECT COUNT(*) INTO chat_count
    FROM chats
    WHERE user_id = NEW.user_id 
      AND mentor_type = NEW.mentor_type;
    
    -- Create insight dot every 5 mentor responses (after meaningful conversation)
    IF chat_count % 5 = 0 THEN
      -- Get context from recent messages
      SELECT string_agg(content, ' | ' ORDER BY created_at DESC)
      INTO recent_messages
      FROM (
        SELECT content, created_at
        FROM chats
        WHERE user_id = NEW.user_id 
          AND mentor_type = NEW.mentor_type
        ORDER BY created_at DESC
        LIMIT 3
      ) recent;
      
      INSERT INTO insight_dots (
        user_id,
        source_type,
        source_id,
        source_mentor,
        insight_text,
        core_theme,
        emotional_tone
      ) VALUES (
        NEW.user_id,
        'mentor_chat',
        NEW.id,
        NEW.mentor_type::text,
        'Mentor conversation insight: ' || SUBSTRING(COALESCE(recent_messages, NEW.content), 1, 200) || '...',
        'Mentor Guidance',
        'inspired'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for mentor chats
CREATE TRIGGER trigger_mentor_chat_dot
AFTER INSERT ON chats
FOR EACH ROW
EXECUTE FUNCTION create_mentor_chat_dot();

-- Create function for ritual streaks (milestone dots)
CREATE OR REPLACE FUNCTION public.create_ritual_streak_dot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create dots for significant streak milestones (7, 21, 50, 100 days)
  IF NEW.streak_count IN (7, 21, 50, 100) AND 
     (OLD.streak_count IS NULL OR OLD.streak_count < NEW.streak_count) THEN
    INSERT INTO insight_dots (
      user_id,
      source_type,
      source_id,
      insight_text,
      core_theme,
      emotional_tone,
      skill_tags
    ) VALUES (
      NEW.user_id,
      'ritual',
      NEW.id,
      'Ritual streak milestone: ' || NEW.streak_count || ' days of consistent practice. ' || NEW.check_in_text,
      'Discipline & Commitment',
      'accomplished',
      ARRAY['discipline', 'consistency', 'growth']
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for ritual streaks
CREATE TRIGGER trigger_ritual_streak_dot
AFTER INSERT OR UPDATE ON daily_rituals
FOR EACH ROW
EXECUTE FUNCTION create_ritual_streak_dot();