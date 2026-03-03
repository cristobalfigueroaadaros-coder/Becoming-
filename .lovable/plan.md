

# Capability Map — Full Rebuild Plan

## Current State
- `momentum_capabilities` table: flat structure with `capability_name`, `source_type`, `activation_count`, timestamps
- UI (`CapabilityMapTab.tsx`): simple badge list grouped by category, always visible as a tab
- No levels, no acquisition channels, no progressive reveal, no identity visualization

## What Changes

### 1. Database Migration
Extend `momentum_capabilities` with new columns:
- `level` INTEGER DEFAULT 1 (1-5: Recognized → Dominant)
- `acquisition_channel` TEXT ('onboarding_inferred', 'self_declared', 'behavioral_detected', 'compound_unlock')
- `description` TEXT (short grounded explanation)
- `category` TEXT ('execution', 'reflection', 'strategy', 'creativity', 'identity')

Add a new flag on `profiles`:
- `capability_map_unlocked` BOOLEAN DEFAULT false

### 2. Initial Capability Seeding (Edge Function)
Create `seed-initial-capabilities` edge function:
- Triggered after first project creation (called from `ConsoleThread.tsx` after `handleFirstWinAccept`)
- Reads onboarding answers (intake Q1-Q3 stored in console thread) + profile work_context
- Uses AI (gemini-2.5-flash) to extract 3 inferred capabilities using the Mixed Precision Model:
  - 1 Anchor (obvious strength)
  - 1 Sharpened (reframed)
  - 1 Insight (pattern-based inference)
- Inserts them as `acquisition_channel: 'onboarding_inferred'`, level 1
- Sets `capability_map_unlocked: true` on profile
- Returns capabilities + a suggested list of 8-10 self-declared options for user selection

### 3. Capability Map Tab — Visibility Gating
In `MomentumDashboard.tsx`:
- Only show the "Capabilities" tab trigger if `capability_map_unlocked` is true on the profile
- When first unlocked, show a subtle badge/dot on the tab

### 4. Full UI Rebuild (`CapabilityMapTab.tsx`)
Replace badge list with identity-centered layout:

**Center**: User avatar (from profile)

**Orbiting nodes**: Each capability as a node showing:
- Name
- Level indicator (1-5 dots or ring fill)
- Category color coding
- Glow intensity based on activation_count

**Sections below the visual**:
- **Inferred** (system-assigned, non-removable)
- **Self-Declared** (user-selected, expandable weekly)
- **Behavioral** (detected from sprints)
- **Compound** (rare advanced unlocks)

**Self-Declaration Flow**:
- On first visit after unlock, show a selection modal with 8-10 options
- User picks 2-3
- Each subsequent week, 1-2 new slots unlock (based on sprint count)

### 5. Level Progression Logic
Client-side computation in `useMomentumData.ts`:
- Level 1 (Recognized): activation_count >= 1
- Level 2 (Activated): activation_count >= 3, across 2+ sprints
- Level 3 (Strengthening): activation_count >= 8, across 3+ sprints
- Level 4 (Established): activation_count >= 15, across 5+ sprints
- Level 5 (Dominant): activation_count >= 25, across 8+ sprints

Levels never decay. Computed and synced when viewing the tab.

### 6. Behavioral Detection
Extend the existing `complete-task` edge function (or weekly ritual flow) to detect behavioral patterns and insert new capabilities:
- After each sprint completion, check patterns like:
  - High completion rate for 3+ sprints → "Execution Consistency"
  - Multiple refinements without pivot → "Strategic Refinement"
  - High reflection rate → "Reflection Discipline"
- Insert with `acquisition_channel: 'behavioral_detected'`

### 7. Compound Unlocks
In `WeeklyRitualFlow.tsx` or via the `generate-compound-narrative` function:
- After 4+ consecutive sprints with stable direction, high reflection, low pivots → unlock compound capabilities like "Execution Architecture", "Strategic Depth"
- Insert with `acquisition_channel: 'compound_unlock'`

### 8. Notification Flow
After seeding initial capabilities:
- Add a notification dot on the Dashboard's Momentum card
- When user opens Momentum, show badge on the Capabilities tab
- First click reveals capabilities with a calm intro card

## Files to Create/Modify

| File | Action |
|------|--------|
| DB migration | Add `level`, `acquisition_channel`, `description`, `category` to `momentum_capabilities`; add `capability_map_unlocked` to `profiles` |
| `supabase/functions/seed-initial-capabilities/index.ts` | New: AI extraction of initial capabilities from onboarding data |
| `src/components/momentum/CapabilityMapTab.tsx` | Full rebuild: avatar-centered orbital layout with sections |
| `src/pages/MomentumDashboard.tsx` | Conditional tab visibility, unlock badge |
| `src/hooks/useMomentumData.ts` | Level computation, fetch `capability_map_unlocked` |
| `src/pages/ConsoleThread.tsx` | Call `seed-initial-capabilities` after first project accepted |
| `src/components/momentum/WeeklyRitualFlow.tsx` | Behavioral + compound capability detection on ritual save |

## Visual Design
- Professional, minimal, prestige-based
- No coins, no XP bars, no leaderboard
- Orbital nodes with subtle glow
- Calm color palette per category
- Level shown as concentric rings or small dot indicators

## Technical Details

**Level thresholds** (computed client-side):
```text
Level 1: count >= 1
Level 2: count >= 3, sprints >= 2
Level 3: count >= 8, sprints >= 3
Level 4: count >= 15, sprints >= 5
Level 5: count >= 25, sprints >= 8
```

**Behavioral detection triggers** (checked during weekly ritual):
```text
completion_rate > 80% for 3+ sprints → "Execution Consistency"
0 pivots for 4+ sprints → "Focus Stability"
reflection_rate > 60% for 3+ sprints → "Reflection Discipline"
design_thinking interactions in 3+ sprints → "Problem Framing"
```

**Compound unlock conditions**:
```text
4+ sprints + stability_index > 70 + reflection > 50% → "Execution Architecture"
6+ sprints + no pivots + high momentum trend → "Strategic Depth"
```

