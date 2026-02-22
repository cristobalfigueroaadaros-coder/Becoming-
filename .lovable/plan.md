

# PDR 2 — Sprint Review Tab: Full Implementation Plan

## What Exists Today

The Sprint Review Tab is currently a **static stats display** showing task completion, usefulness rating, wins, insights, and friction points. The Weekly Ritual Flow is a simple modal with a grounding timer, 4 sliders, and an AI narrative. There is no Momentum Score, no System Insight, no structured reflection questions, no Project Console integration, and no winner card trigger.

## What Gets Built

The Sprint Review Tab becomes a full **weekly performance engine** with:

1. A computed Momentum Score as the primary visual metric
2. An AI-generated System Insight summary (auto-loaded, not requiring ritual)
3. A redesigned Weekly Ritual Flow with structured questions before the console
4. Project Console integration within the ritual for sprint direction refinement
5. Sprint direction logic (continue/narrow/simplify/adjust/pivot)
6. Next 7-day sprint task generation after direction is confirmed
7. A winner card celebration upon ritual completion

---

## Architecture

```text
SprintReviewTab (pre-ritual view)
  +-- Momentum Score (computed metric)
  +-- Weekly Performance Summary (stats)
  +-- System Insight Summary (AI auto-generated)
  +-- "Continue to Weekly Ritual" button
        |
        v
WeeklyRitualFlow (modal, redesigned steps)
  Step 1: Grounding (30s timer — unchanged)
  Step 2: Structured Questions (new)
    - Task Usefulness (multiple choice)
    - Main Friction Type (multiple choice)
    - Biggest Win (multiple choice)
    - Direction Confidence (slider 1-10)
  Step 3: Evolution Narrative (AI-generated — existing)
  Step 4: Console Interaction (new — calls council-meeting with sprint context)
    - 3-5 exchanges max
    - Sprint direction decided (continue/narrow/simplify/adjust/pivot)
  Step 5: Sprint Confirmation + Winner Card (new)
    - Direction confirmed
    - New 7-day sprint generated
    - Winner card celebration triggered
```

---

## Detailed Changes

### 1. Momentum Score Computation

Added to `useMomentumData.ts` as a derived value in the `WeeklyData` interface.

Formula:
- Completion weight: 40% (tasksCompleted / tasksTotal)
- Consistency weight: 25% (active days / 7)
- Reflection weight: 20% (feedback entries with insights / total tasks)
- Engagement weight: 15% (design thinking + creative space interactions > 0)

Returns a 0-100 score. Displayed as a large circular indicator in the Sprint Review Tab.

**New field in WeeklyData:**
- `momentumScore: number`
- `activeDays: number`
- `reflectionRate: number`

The hook already fetches all needed data; computation is added client-side.

### 2. System Insight Summary (Auto-Generated)

A new edge function `generate-sprint-insight` that takes the same weekly data and produces a 1-2 sentence neutral, intelligent observation. Called automatically when the Sprint Review Tab loads (not part of the ritual).

Examples the AI should produce:
- "You were consistent but hesitant mid-week."
- "Execution was strong, but task usefulness dropped."
- "Your clarity increased across the week."

This replaces the current static "empty state" text. The SprintReviewTab component will call this function on mount and display the result in a highlighted card above the stats.

### 3. SprintReviewTab Redesign

The tab gets restructured to show:

**Section A — Momentum Score** (new)
- Large circular progress indicator (0-100)
- Color-coded: green (70+), amber (40-69), neutral (<40)

**Section B — Performance Summary** (enhanced from existing)
- Tasks completed / total with progress bar (existing)
- Active days count (new)
- Reflection rate (new)
- Average usefulness (existing)
- Completion % (existing)

**Section C — System Insight** (new)
- AI-generated 1-2 sentence observation
- Neutral styling, no icons suggesting good/bad

**Section D — Wins, Insights, Friction** (existing, unchanged)

**Section E — CTA Button** (new)
- "Continue to Weekly Ritual" button at the bottom
- Opens the WeeklyRitualFlow modal

### 4. WeeklyRitualFlow Expansion

The current 4-step flow (`grounding -> ratings -> narrative -> confirm`) becomes a 6-step flow:

**Step 1 — Grounding** (unchanged, 30s timer with skip)

**Step 2 — Structured Questions** (new, replaces the sliders step)
- **Task Usefulness**: radio group with 5 options (Extremely useful / Useful / Neutral / Not very useful / Misaligned)
- **Main Friction Type**: radio group with 7 options (Lack of clarity / Overwhelm / Low motivation / External distractions / Task too complex / Doubt about direction / Nothing significant)
- **Biggest Win**: radio group with 7 options (Completed key milestone / Gained clarity / Tested something new / Improved structure / Built consistency / Learned something important / Other)
- **Direction Confidence**: slider 1-10 (kept from current)

All stored as structured data in `self_ratings` jsonb column.

**Step 3 — Evolution Narrative** (existing, calls `generate-momentum-narrative`)

**Step 4 — Console Interaction** (new)
- Embedded mini-console within the modal (scrollable chat area)
- Calls `council-meeting` edge function with `councilType: 'project'` and sprint review context
- Passes: momentum score, completion rate, friction type, confidence slider, usefulness rating, structured question answers
- Limited to 3-5 exchanges
- Console determines sprint direction: Continue and deepen / Narrow scope / Adjust intensity / Simplify structure / Test adjacent variation / Pivot (only if strongly justified)
- The direction appears as a selectable card once the console proposes it

**Step 5 — Sprint Confirmation** (enhanced from current "confirm")
- Shows the proposed sprint direction
- User confirms or adjusts
- On confirm: saves the weekly report (existing logic) + triggers next sprint generation

**Step 6 — Winner Card** (new)
- Confetti animation
- "Weekly Review Complete" celebration card
- Shows streak count
- Shows next sprint focus theme
- Dismiss navigates back to Momentum Dashboard

### 5. Sprint Direction Logic in Console

The `council-meeting` edge function already handles project council sessions. The sprint review will invoke it with additional context in the body:

```typescript
{
  question: "Sprint Review Check-in",
  councilType: "project",
  sprintReviewContext: {
    momentumScore,
    completionRate,
    frictionType,
    directionConfidence,
    usefulnessRating,
    biggestWin,
    topWins,
    frictionPoints,
    weekNumber: streak + 1
  }
}
```

The council-meeting function will detect `sprintReviewContext` in the body and inject sprint-specific instructions into the system prompt, telling mentors to:
- Acknowledge performance based on data
- Reflect friction intelligently
- Determine sprint strategy (continue/narrow/simplify/adjust/pivot)
- Only suggest pivot if confidence is extremely low AND usefulness is declining

### 6. Next Sprint Task Generation

After direction is confirmed, the system calls `integrator-setup` (existing edge function) with the chosen direction to generate the next 7-day sprint tasks. This reuses the existing sprint generation infrastructure.

### 7. Winner Card Component

A new `SprintWinnerCard.tsx` component using framer-motion animations and confetti (already installed). Shows:
- Celebration animation
- Streak count
- Next sprint focus
- Dismiss button

---

## Database Changes

**No new tables needed.** The existing `momentum_weekly_reports` table already has:
- `self_ratings` (jsonb) — will now store structured question answers + direction confidence
- `evolution_narrative` (text) — unchanged

**New columns on `momentum_weekly_reports`:**
- `momentum_score` (integer, nullable) — computed score for the week
- `sprint_direction` (text, nullable) — chosen direction (continue/narrow/simplify/adjust/pivot)
- `system_insight` (text, nullable) — auto-generated insight text
- `friction_type` (text, nullable) — main friction answer
- `biggest_win_type` (text, nullable) — biggest win answer
- `usefulness_answer` (text, nullable) — usefulness answer

---

## New Edge Function: `generate-sprint-insight`

Lightweight AI call (Gemini 2.5 Flash) that takes weekly stats and returns 1-2 sentences of neutral pattern observation. Similar to `generate-momentum-narrative` but shorter, auto-triggered, and focused on diagnostic observation rather than trajectory narrative.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/momentum/SprintWinnerCard.tsx` | Winner card celebration after ritual |
| `src/components/momentum/StructuredQuestions.tsx` | Step 2 structured question inputs |
| `src/components/momentum/SprintConsole.tsx` | Step 4 mini-console chat within ritual |
| `supabase/functions/generate-sprint-insight/index.ts` | Auto-generated system insight |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/momentum/SprintReviewTab.tsx` | Add Momentum Score, System Insight, active days, reflection rate, CTA button |
| `src/components/momentum/WeeklyRitualFlow.tsx` | Expand to 6 steps: add structured questions, console, winner card |
| `src/hooks/useMomentumData.ts` | Add momentumScore, activeDays, reflectionRate computation; add systemInsight fetch |
| `supabase/functions/council-meeting/index.ts` | Detect `sprintReviewContext` and inject sprint direction instructions |
| `supabase/functions/generate-momentum-narrative/index.ts` | Pass structured question data into narrative prompt |
| Database migration | Add 5 new nullable columns to `momentum_weekly_reports` |
| `supabase/config.toml` | Add `generate-sprint-insight` function entry |

## What This Does NOT Touch

- Existing sprint creation/task generation infrastructure (reused)
- Council system architecture (reused, context-extended)
- Compound Growth tab
- Capability Map tab
- Bottom navigation
- Mentor routing or handoff logic
- Transmutation flow
- Design Thinking Lab
