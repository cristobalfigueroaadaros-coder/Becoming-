
# Momentum Dashboard — Implementation Plan

## What We're Building

A new **Momentum Dashboard** accessible from the Home section that consolidates weekly sprint data into a structured progress view with three tabs: Sprint Review, Compound Growth, and Capability Map. It includes a weekly ritual flow and an AI-generated Evolution Narrative.

## Placement

The Momentum Dashboard lives on the **Home (Dashboard) page** as a prominent card that the user taps to open a full-page view (`/momentum`). During testing, it is always visible. In production, it will unlock every 7 days after sprint completion (gating logic added but disabled for now via a flag).

## Architecture

```text
Dashboard.tsx
  +-- MomentumDashboardCard (new card on Home — entry point)
        |
        v
/momentum (new route)
  +-- MomentumDashboard.tsx (full page)
        +-- Tab: Sprint Review
        +-- Tab: Compound Growth
        +-- Tab: Capability Map
        +-- Weekly Ritual Flow (modal/inline)
        +-- Evolution Narrative block
```

## Database Changes

### New table: `momentum_weekly_reports`

Stores one row per user per week, generated after weekly ritual completion.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | NOT NULL |
| week_start | date | NOT NULL |
| week_end | date | NOT NULL |
| tasks_completed | integer | DEFAULT 0 |
| tasks_total | integer | DEFAULT 0 |
| tasks_skipped | integer | DEFAULT 0 |
| avg_usefulness_rating | numeric | |
| insights_captured | integer | DEFAULT 0 |
| wins_captured | integer | DEFAULT 0 |
| top_wins | jsonb | Array of win texts |
| top_insights | jsonb | Array of insight texts |
| friction_points | jsonb | Array of improvement texts |
| phases_active | jsonb | Array of phase names touched |
| evolution_narrative | text | AI-generated weekly narrative |
| self_ratings | jsonb | User's quick self-rating from ritual |
| ritual_completed_at | timestamptz | When user completed the weekly ritual |
| streak_weeks | integer | DEFAULT 0 |
| created_at | timestamptz | DEFAULT now() |

RLS: Users can only read/insert/update their own rows.

### New table: `momentum_capabilities`

Tracks skills activated through action over time.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | NOT NULL |
| capability_name | text | NOT NULL |
| source_type | text | 'task', 'insight', 'phase', 'design_thinking' |
| activation_count | integer | DEFAULT 1 |
| first_activated_at | timestamptz | DEFAULT now() |
| last_activated_at | timestamptz | DEFAULT now() |
| created_at | timestamptz | DEFAULT now() |

RLS: Users can only read/insert/update their own rows.

## Data Aggregation Logic

The Momentum Dashboard reads from existing tables — no changes to existing data flows:

- **`integrator_daily_steps`**: completion rate, status counts for the last 7 days (filtered by `scheduled_date`)
- **`task_feedback`**: win_text, insight_text, improvement_text, usefulness_rating for the last 7 days
- **`insight_dots`**: count of insights with `source_type = 'integrator_step'` in the last 7 days
- **`integrator_phases`**: which phases were active/completed this week
- **`integrator_projects`** / **`evolution_nodes`**: project title, current phase, current day for context
- **`design_thinking_content`**: interaction count with design thinking stages this week
- **`creative_space_tiles`**: saved notes/insights count this week

A custom hook `useMomentumData` will aggregate all of this on the client side from existing tables — no new edge function needed for data collection.

## New Edge Function: `generate-momentum-narrative`

Called when the user completes the weekly ritual. Takes the week's aggregated data and generates:

1. An Evolution Narrative (2-3 sentences connecting weekly behavior to trajectory)
2. Suggested focus areas for the next sprint
3. Capability tags extracted from the week's tasks and insights

Uses the Lovable AI gateway (google/gemini-2.5-flash) — no external API key needed.

## Frontend Components

### 1. `src/components/dashboard/MomentumCard.tsx`
Entry point card on the Dashboard. Shows:
- Weekly completion percentage (circular progress ring reusing `DualProgressRing` pattern)
- "Weekly Ritual Ready" badge when 7 days have passed
- Tap to navigate to `/momentum`

### 2. `src/pages/MomentumDashboard.tsx`
Full page with three tabs using existing `Tabs` component:

**Tab 1 — Sprint Review:**
- Completion rate bar (X/Y tasks done)
- Average usefulness rating
- Top 3 wins (from `task_feedback.win_text`)
- Top 3 insights (from `task_feedback.insight_text`)
- Friction points (from `task_feedback.improvement_text`)
- Phase activity summary

**Tab 2 — Compound Growth:**
- Weekly streak counter
- Chart showing completion rate trend over weeks (using existing `recharts`)
- Total insights accumulated across all weeks
- Evolution Narrative history (scrollable cards)
- Direction stability indicator (same project vs. pivots)

**Tab 3 — Capability Map:**
- Visual grid/list of capabilities activated through action
- Each capability shows activation count and recency
- Categories: execution, strategy, creativity, reflection, leadership
- New capabilities this week get a "New" badge

### 3. `src/components/momentum/WeeklyRitualFlow.tsx`
Modal-based flow (similar to existing `TaskCompletionFlow`):

1. **Grounding step** (30s breathing/centering prompt — simple timer)
2. **Quick self-ratings** (3-4 sliders: Energy, Clarity, Confidence, Direction — 1-10 scale)
3. **Evolution Narrative** appears (AI-generated, based on week data)
4. **Confirm direction** or flag "I want to adjust"
5. System stores the report and increments streak

### 4. `src/hooks/useMomentumData.ts`
Custom hook that:
- Fetches last 7 days of task data from `integrator_daily_steps`
- Fetches last 7 days of feedback from `task_feedback`
- Fetches insight count from `insight_dots`
- Fetches previous weekly reports from `momentum_weekly_reports`
- Computes completion rate, averages, top items
- Returns structured data for the dashboard

## Routing

Add to `App.tsx`:
```
/momentum → MomentumDashboard (with AppLayout, session-gated)
```

## Design Principles Applied

- No shaming: low completion weeks show "Let's build on this" messaging, not red warnings
- Progress is always framed as forward motion
- The Evolution Narrative connects data to meaning without being dramatic
- Capability Map rewards action-based skill development, not just completion counts
- The weekly ritual is a retention mechanism — simple, satisfying, and rewarding

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/MomentumDashboard.tsx` | Full-page momentum view with 3 tabs |
| `src/components/momentum/SprintReviewTab.tsx` | Sprint Review tab content |
| `src/components/momentum/CompoundGrowthTab.tsx` | Compound Growth tab content |
| `src/components/momentum/CapabilityMapTab.tsx` | Capability Map tab content |
| `src/components/momentum/WeeklyRitualFlow.tsx` | Weekly ritual modal flow |
| `src/components/momentum/EvolutionNarrative.tsx` | AI narrative display block |
| `src/components/dashboard/MomentumCard.tsx` | Dashboard entry card |
| `src/hooks/useMomentumData.ts` | Data aggregation hook |
| `supabase/functions/generate-momentum-narrative/index.ts` | AI narrative generation |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/momentum` route |
| `src/pages/Dashboard.tsx` | Add `MomentumCard` between NarrativeSystemCard and TodaysFocusCard |

## What This Does NOT Touch

- Sprint creation or task generation logic
- Design Thinking Lab workflow
- Creative Space storage
- Council or mentor systems
- Transmutation flow
- Bottom navigation (Momentum is accessed from Home, not a new nav item)
- Existing `DailyRitualCard` or `DailyRitualModal` (the weekly ritual is separate)
