-- Create function to notify when a Value Map block is unlocked
CREATE OR REPLACE FUNCTION notify_value_map_unlock()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on NEW unlocks (is_unlocked changed from false to true, or new row with is_unlocked = true)
  IF NEW.is_unlocked = true AND (OLD IS NULL OR OLD.is_unlocked = false) THEN
    -- Insert Future Self whisper notification
    INSERT INTO daily_whispers (user_id, mentor_type, message, whisper_type, trigger_reason)
    VALUES (
      NEW.user_id,
      'future_self',
      format('Great news! Your "%s" block just got filled. Your Purpose to Value map is coming together. Keep talking with the mentors - each conversation brings more clarity.', NEW.block_key),
      'value_map_unlock',
      format('Value Map block unlocked: %s', NEW.block_key)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on value_map_blocks
DROP TRIGGER IF EXISTS on_value_map_block_unlock ON value_map_blocks;
CREATE TRIGGER on_value_map_block_unlock
AFTER INSERT OR UPDATE OF is_unlocked ON value_map_blocks
FOR EACH ROW
WHEN (NEW.is_unlocked = true)
EXECUTE FUNCTION notify_value_map_unlock();