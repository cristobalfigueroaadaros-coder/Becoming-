

# Compound Growth Tab — Full Rebuild

## Current State
The tab shows a streak counter, a single completion-rate line chart, total tasks count, and a list of evolution narratives. No computed metrics, no trajectory analysis, no AI synthesis.

## What Changes

### 1. Database Migration
Add columns to `momentum_weekly_reports` for storing compound metrics that get computed during the weekly ritual:
- `reflection_rate INTEGER` — percentage of tasks with insight feedback
- `active_days INTEGER` — days with completed tasks (0-7)
- `focus_category TEXT` — primary focus area for the sprint

Update `WeeklyRitualFlow` to persist these new fields when saving a report.

### 2. Expand `WeeklyReport` interface (`useMomentumData.ts`)
Add the new fields to the TypeScript interface. Also export capabilities alongside reports so the tab can use them.

### 3. Rebuild `CompoundGrowthTab.tsx` with four sections

**Section 1 — Execution Trend**
- Multi-line chart (Recharts) showing Momentum Score, Completion Rate, and Reflection Rate across sprints
- Toggle between metrics via small pill buttons
- Trajectory indicator derived from last 3-5 sprints: "Ascending", "Stable", or "Unstable"

**Section 2 — Focus Stability & Direction**
- Computed from `sprint_direction` field across reports
- Displays: longest continuity streak (consecutive non-pivot sprints), pivot count, stability index (0-100)
- Simple stat cards, no chart

**Section 3 — Learning Density Index**
- Computed from: reflection rate trend, insight count trend, recurring friction types, recurring win types
- Outputs a level (Low / Moderate / High) and top recurring themes
- Detects blind spots: e.g. "You report wins in positioning but friction always mentions distribution"

**Section 4 — Compound Skill Activation**
- Pulls from `capabilities` (already loaded)
- Groups into: Most Activated (top 3 by count), Newly Emerging (activated in last 2 weeks), Underused (activated early but not recently)
- Simple badge layout

### 4. "Your Execution Evolution" narrative block
- New edge function `generate-compound-narrative` that takes all sprint reports + capabilities and produces a neutral, evidence-based 3-4 sentence synthesis
- Called once when the tab loads and there are 3+ reports
- Displayed at the top of the tab in a calm card (no sparkles, no animation)

### 5. Consistency Index & Growth Velocity (computed client-side)
- **Consistency Index**: Standard deviation of momentum scores across sprints, mapped to 0-100 (low variance = high consistency)
- **Growth Velocity**: Linear regression slope of momentum scores across last 5 sprints — positive = accelerating, zero = stable, negative = declining
- Both displayed as small stat badges at the top

### Visual Design
- Calm, strategic, minimal — no animations, no celebratory elements
- Muted color palette, thin borders
- Cards with small headers, compact content
- Less visual weight than Sprint Review

## Files to Create/Modify

| File | Action |
|------|--------|
| DB migration | Add `reflection_rate`, `active_days`, `focus_category` columns |
| `src/hooks/useMomentumData.ts` | Expand `WeeklyReport` interface with new fields |
| `src/components/momentum/CompoundGrowthTab.tsx` | Full rebuild with 4 sections + metrics |
| `src/components/momentum/WeeklyRitualFlow.tsx` | Persist new fields when saving report |
| `supabase/functions/generate-compound-narrative/index.ts` | New AI function for evolution synthesis |

## Technical Details

**Trajectory Indicator** (last 3-5 reports):
```text
scores = reports.map(r => r.momentum_score)
slope = linearRegression(scores)
if slope > 2: "Ascending"
if slope < -2: "Unstable"  
else: "Stable"
```

**Consistency Index**:
```text
variance = stdDev(momentumScores)
index = Math.max(0, 100 - variance * 5)
```

**Stability Index** (from sprint_direction):
```text
pivotCount = reports.filter(r => r.sprint_direction includes "pivot").length
stabilityIndex = Math.round((1 - pivotCount / total) * 100)
```

**Learning Density**:
```text
avgReflection = mean(reports.map(r => r.reflection_rate))
if avgReflection >= 60: "High"
if avgReflection >= 30: "Moderate"
else: "Low"
```

