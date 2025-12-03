-- Drop the existing constraint
ALTER TABLE energetic_snapshots DROP CONSTRAINT energetic_snapshots_snapshot_type_check;

-- Add new constraint with all valid types
ALTER TABLE energetic_snapshots ADD CONSTRAINT energetic_snapshots_snapshot_type_check 
CHECK (snapshot_type = ANY (ARRAY[
  'daily_check_in'::text, 
  'task_completion'::text, 
  'challenge_response'::text, 
  'council_session'::text, 
  'creation_moment'::text, 
  'breakthrough_moment'::text, 
  'integration_point'::text,
  'flow_state'::text,
  'breakthrough'::text,
  'expansion'::text,
  'resonance'::text,
  'intuition_hit'::text
]));