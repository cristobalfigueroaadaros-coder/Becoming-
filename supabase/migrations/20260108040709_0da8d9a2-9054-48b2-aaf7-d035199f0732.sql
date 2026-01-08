-- Allow tiles without a project (unassigned/inbox items)
ALTER TABLE creative_space_tiles 
  ALTER COLUMN project_id DROP NOT NULL;

-- Drop the existing foreign key constraint first, then recreate it to allow NULL
ALTER TABLE creative_space_tiles
  DROP CONSTRAINT IF EXISTS creative_space_tiles_project_id_fkey;

ALTER TABLE creative_space_tiles
  ADD CONSTRAINT creative_space_tiles_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES integrator_projects(id) 
  ON DELETE CASCADE;

-- Index for fetching unassigned tiles by user efficiently
CREATE INDEX IF NOT EXISTS idx_creative_tiles_unassigned 
  ON creative_space_tiles(user_id) 
  WHERE project_id IS NULL;