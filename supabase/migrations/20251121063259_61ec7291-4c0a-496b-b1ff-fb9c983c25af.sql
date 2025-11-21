-- Function to create insight dot for goal completions
CREATE OR REPLACE FUNCTION create_goal_achievement_dot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create dot when goal is marked as completed
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    INSERT INTO insight_dots (
      user_id,
      source_type,
      source_id,
      insight_text,
      core_theme,
      emotional_tone
    ) VALUES (
      NEW.user_id,
      'goal_achievement',
      NEW.id,
      'Goal achieved: ' || NEW.goal_text,
      'Achievement',
      'positive'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for daily goals
CREATE TRIGGER create_dot_on_daily_goal_completion
AFTER UPDATE ON daily_goals
FOR EACH ROW
EXECUTE FUNCTION create_goal_achievement_dot();

-- Trigger for weekly goals
CREATE TRIGGER create_dot_on_weekly_goal_completion
AFTER UPDATE ON weekly_goals
FOR EACH ROW
EXECUTE FUNCTION create_goal_achievement_dot();

-- Trigger for monthly goals
CREATE TRIGGER create_dot_on_monthly_goal_completion
AFTER UPDATE ON monthly_goals
FOR EACH ROW
EXECUTE FUNCTION create_goal_achievement_dot();

-- Trigger for yearly goals
CREATE TRIGGER create_dot_on_yearly_goal_completion
AFTER UPDATE ON yearly_goals
FOR EACH ROW
EXECUTE FUNCTION create_goal_achievement_dot();

-- Function to create insight dot for shadow integrations
CREATE OR REPLACE FUNCTION create_shadow_integration_dot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create dot when shadow encounter is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
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
      'shadow_integration',
      NEW.id,
      NEW.mentor_type,
      'Shadow integrated: ' || NEW.shadow_name || '. ' || COALESCE(NEW.integration_insight, NEW.task_description),
      'Shadow Work',
      'transformative'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for shadow encounters
CREATE TRIGGER create_dot_on_shadow_integration
AFTER UPDATE ON shadow_encounters
FOR EACH ROW
EXECUTE FUNCTION create_shadow_integration_dot();

-- Function to create insight dot for significant journal entries
CREATE OR REPLACE FUNCTION create_journal_breakthrough_dot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create dot for entries with strong emotional tone or shadow detection
  IF NEW.emotional_tone IN ('breakthrough', 'transformative', 'profound') 
     OR NEW.shadow_detected IS NOT NULL THEN
    INSERT INTO insight_dots (
      user_id,
      source_type,
      source_id,
      insight_text,
      core_theme,
      emotional_tone
    ) VALUES (
      NEW.user_id,
      'journal_breakthrough',
      NEW.id,
      SUBSTRING(NEW.entry_text, 1, 200) || '...',
      COALESCE(NEW.shadow_detected, 'Reflection'),
      NEW.emotional_tone
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for journal entries
CREATE TRIGGER create_dot_on_journal_breakthrough
AFTER INSERT ON actual_self_journal
FOR EACH ROW
EXECUTE FUNCTION create_journal_breakthrough_dot();

-- Function to create insight dot for life domain milestones
CREATE OR REPLACE FUNCTION create_domain_milestone_dot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create dot when domain score increases significantly (by 2+ points)
  IF NEW.current_score >= OLD.current_score + 2 THEN
    INSERT INTO insight_dots (
      user_id,
      source_type,
      source_id,
      insight_text,
      core_theme,
      skill_tags
    ) VALUES (
      NEW.user_id,
      'domain_milestone',
      NEW.id,
      'Milestone in ' || NEW.domain_name || ': Score improved from ' || OLD.current_score || ' to ' || NEW.current_score,
      'Growth',
      ARRAY[NEW.domain_name]
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for life domains
CREATE TRIGGER create_dot_on_domain_milestone
AFTER UPDATE ON life_domains
FOR EACH ROW
EXECUTE FUNCTION create_domain_milestone_dot();

-- Function to create insight dot for quest completions
CREATE OR REPLACE FUNCTION create_quest_completion_dot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quest_info RECORD;
  completed_steps_count INT;
  total_steps_count INT;
BEGIN
  -- Get quest details
  SELECT quest_name, description, steps 
  INTO quest_info
  FROM quests
  WHERE quest_id = NEW.quest_id;
  
  -- Count completed steps
  completed_steps_count := jsonb_array_length(NEW.completed_steps);
  total_steps_count := jsonb_array_length(quest_info.steps);
  
  -- Create dot when quest is fully completed
  IF completed_steps_count = total_steps_count AND 
     (OLD.completed_steps IS NULL OR jsonb_array_length(OLD.completed_steps) < total_steps_count) THEN
    INSERT INTO insight_dots (
      user_id,
      source_type,
      source_id,
      insight_text,
      core_theme,
      emotional_tone
    ) VALUES (
      NEW.user_id,
      'quest_completion',
      NEW.id,
      'Quest completed: ' || quest_info.quest_name || '. ' || quest_info.description,
      'Quest Achievement',
      'accomplished'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for quest progress
CREATE TRIGGER create_dot_on_quest_completion
AFTER UPDATE ON quest_progress
FOR EACH ROW
EXECUTE FUNCTION create_quest_completion_dot();