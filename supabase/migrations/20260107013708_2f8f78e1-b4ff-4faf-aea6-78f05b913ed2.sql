-- Add anchor_type column to insight_dots table
-- Values: 'becoming' (identity), 'creating' (action), 'both' (bridge)
ALTER TABLE public.insight_dots ADD COLUMN IF NOT EXISTS anchor_type text DEFAULT 'both';

-- Add anchor_type column to constellation_entries table
ALTER TABLE public.constellation_entries ADD COLUMN IF NOT EXISTS anchor_type text DEFAULT 'both';

-- Add a check constraint for valid anchor types on insight_dots
ALTER TABLE public.insight_dots ADD CONSTRAINT insight_dots_anchor_type_check 
  CHECK (anchor_type IN ('becoming', 'creating', 'both'));

-- Add a check constraint for valid anchor types on constellation_entries
ALTER TABLE public.constellation_entries ADD CONSTRAINT constellation_entries_anchor_type_check 
  CHECK (anchor_type IN ('becoming', 'creating', 'both'));