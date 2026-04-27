-- ============================================================
-- TRAINING DATA + PERSISTENCE LAYER
-- Three problems solved:
--   1. Rejected dot options are now stored alongside the chosen one
--   2. Breakthrough moments are persisted (not just detected and lost)
--   3. AI analysis outputs are saved so the system builds memory over time
-- ============================================================


-- 1. REJECTED DOT OPTIONS
-- Store all 3 generated insight options per quest, not just the one chosen.
-- chosen_option_index tells us which one the user picked (0, 1, or 2).
-- The two unchosen options are valuable training signal.
ALTER TABLE atlas_quests
  ADD COLUMN IF NOT EXISTS generated_options JSONB,
  ADD COLUMN IF NOT EXISTS chosen_option_index INTEGER;

COMMENT ON COLUMN atlas_quests.generated_options IS
  'All insight options generated for this quest as [{title, description}]. chosen_option_index points to the selected one.';
COMMENT ON COLUMN atlas_quests.chosen_option_index IS
  'Index (0-2) of the option the user chose from generated_options.';


-- 2. BREAKTHROUGH PERSISTENCE
-- detect-breakthrough detects moments but never saves them.
-- This table gives users a history of their crystallized ideas over time.
CREATE TABLE IF NOT EXISTS atlas_breakthroughs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- The breakthrough itself
  concept_name        TEXT        NOT NULL,
  target_audience     TEXT,
  approach            TEXT,
  first_step          TEXT,

  -- Detection metadata (useful for training)
  readiness_score     INTEGER,
  conversation_depth  INTEGER,
  source_mentor_type  TEXT,

  -- Lifecycle
  is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
  archived_at         TIMESTAMPTZ,
  archive_reason      TEXT
);

ALTER TABLE atlas_breakthroughs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own breakthroughs"
  ON atlas_breakthroughs FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_atlas_breakthroughs_user_id
  ON atlas_breakthroughs (user_id, created_at DESC);


-- 3. PERSISTED AI ANALYSIS SNAPSHOTS
-- analyze-dot-connections and analyze-dot-connections generate patterns,
-- emerging genius, and creation ideas — but none of it is saved.
-- This table captures each analysis run so the system can:
--   a) Show users how their patterns evolved over time
--   b) Use prior analyses as context in future runs
--   c) Build a training dataset of what the AI found at each stage
CREATE TABLE IF NOT EXISTS atlas_analysis_snapshots (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- What triggered this analysis
  trigger_type        TEXT        NOT NULL DEFAULT 'manual',
  -- 'manual' | 'quest_complete' | 'dot_count_milestone' | 'weekly_momentum'

  -- Counts at time of analysis (context for training)
  dot_count           INTEGER,
  cluster_count       INTEGER,

  -- The AI outputs — stored as structured JSON
  patterns            JSONB,
  -- [{pattern_title, pattern_description, dot_ids[], strength}]

  emerging_genius     JSONB,
  -- [{title, description, dot_connections[], energetic_note}]

  creation_ideas      JSONB,
  -- [{title, description, dot_connections[], first_step, impact}]

  cross_connections   JSONB,
  -- [{dot_id_a, dot_id_b, connection_type, insight, strength}]

  -- Top-level synthesis
  purpose_signal      TEXT,
  -- One sentence distillation of what the system sees

  -- User response (feedback loop for training)
  user_resonance      TEXT,
  -- 'high' | 'medium' | 'low' | null — did this land?
  user_notes          TEXT
  -- Free-form note the user can add
);

ALTER TABLE atlas_analysis_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own analysis snapshots"
  ON atlas_analysis_snapshots FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_atlas_analysis_snapshots_user_id
  ON atlas_analysis_snapshots (user_id, created_at DESC);


-- 4. JOURNEY EVENT LOG
-- A lightweight, append-only log of key events in the user's journey.
-- Powers the timeline UI, archetype detection, and sequence-based training.
-- Every important action writes one row here — quests, dots, breakthroughs,
-- council sessions, project creation — in chronological order.
CREATE TABLE IF NOT EXISTS atlas_journey_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  event_type    TEXT        NOT NULL,
  -- 'quest_complete' | 'dot_placed' | 'mini_dot_placed' | 'breakthrough'
  -- | 'council_session' | 'project_created' | 'cluster_activated'
  -- | 'gold_moment' | 'analysis_run' | 'momentum_check'

  entity_id     UUID,
  -- The ID of the thing that happened (dot id, quest id, breakthrough id, etc.)

  cluster_slug  TEXT,
  -- Which cluster this event belongs to (null if cross-cluster)

  metadata      JSONB
  -- Lightweight extra context: dot title, quest key, mentor type, etc.
  -- Kept small — this is an index, not a store
);

ALTER TABLE atlas_journey_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own journey events"
  ON atlas_journey_events FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_atlas_journey_events_user_id
  ON atlas_journey_events (user_id, created_at ASC);
-- ASC because timeline reads are chronological

CREATE INDEX IF NOT EXISTS idx_atlas_journey_events_type
  ON atlas_journey_events (user_id, event_type, created_at DESC);
