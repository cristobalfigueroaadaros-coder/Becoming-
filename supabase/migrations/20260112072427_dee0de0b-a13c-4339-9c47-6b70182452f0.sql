-- Change Creative Space foreign key constraints from CASCADE to SET NULL
-- This preserves tiles when projects are deleted (moved to inbox instead of deleted)

ALTER TABLE creative_space_tiles 
  DROP CONSTRAINT IF EXISTS creative_space_tiles_project_id_fkey;
ALTER TABLE creative_space_tiles 
  ADD CONSTRAINT creative_space_tiles_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES integrator_projects(id) 
  ON DELETE SET NULL;

ALTER TABLE creative_space_pages 
  DROP CONSTRAINT IF EXISTS creative_space_pages_project_id_fkey;
ALTER TABLE creative_space_pages 
  ADD CONSTRAINT creative_space_pages_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES integrator_projects(id) 
  ON DELETE SET NULL;

ALTER TABLE creative_space_connections 
  DROP CONSTRAINT IF EXISTS creative_space_connections_project_id_fkey;
ALTER TABLE creative_space_connections 
  ADD CONSTRAINT creative_space_connections_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES integrator_projects(id) 
  ON DELETE SET NULL;

ALTER TABLE creative_space_patterns 
  DROP CONSTRAINT IF EXISTS creative_space_patterns_project_id_fkey;
ALTER TABLE creative_space_patterns 
  ADD CONSTRAINT creative_space_patterns_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES integrator_projects(id) 
  ON DELETE SET NULL;