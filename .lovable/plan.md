

# Red Phase Improvements -- Fix Plan

## Root Cause

The `release_mentor` is **missing from the `PATTERN_MENTORS` array** on line 1653 of `chat-mentor/index.ts`:

```text
CURRENT:  const PATTERN_MENTORS = ['storybreaker_mentor', 'phoenix_mentor', 'stoic_mentor'];
MISSING:  'release_mentor'
```

This means when the Release Mentor handles the Red Phase, the system runs in **PROJECT mode**, which causes:
- Project name detection and commitment card triggers (the core bug)
- Value Map insight detection runs
- Handoff signals fire
- PROJECT MODE guardrails apply (business focus, convergence pressure)
- PATTERN MODE guardrails do NOT apply (no protection against project drift)

## Changes Required

### 1. Add `release_mentor` to PATTERN_MENTORS (Root fix)

**File: `supabase/functions/chat-mentor/index.ts`** (line 1653)

Add `release_mentor` to the array so it runs in PATTERN mode:
```
const PATTERN_MENTORS = ['storybreaker_mentor', 'phoenix_mentor', 'stoic_mentor', 'release_mentor'];
```

This single change fixes:
- Project detection never runs during Red Phase
- Value Map detection never runs during Red Phase
- Handoff signals never fire during Red Phase
- PATTERN MODE guardrails are applied
- Release Mentor stays focused on release questions only

### 2. Update Red Phase question #1 wording

**File: `src/components/transmutation-map/TransmutationNodeEditModal.tsx`** (line 103-104)

Change `release_burden` prompt from:
- "What are you ready to stop carrying?"
To:
- "What part of this pattern are you tired of repeating?"

This matches the PDR's refined progression: Behavior -> Belief -> Consequence.

**File: `supabase/functions/chat-mentor/index.ts`** (multiple locations)

Update the Red Phase question text in:
- TransmutationPhaseModal context (line ~97): Update question 1
- RELEASE MENTOR MISSION block (line ~2377): Update question 1
- Extraction prompt (line ~2785): Update field description

### 3. Update Release Mentor tone in transmutation mode

**File: `supabase/functions/chat-mentor/index.ts`**

Update the RELEASE MENTOR MISSION block (around line 2370-2388) to enforce:
- Human, simple, emotionally clear language
- Short sentences
- No abstract or poetic language
- Anchor back to the 3 Red questions if user drifts
- Add explicit examples of tone: "Ok. Let's drop what you are done carrying.", "Keep it simple. One honest answer is enough."

### 4. Update Release Mentor handoff opening (line ~1764)

**File: `supabase/functions/chat-mentor/index.ts`**

Update the Red Phase handoff opening message to use simpler tone and the refined first question:
- "You've gained clarity. Now let's decide what you're done carrying."
- "What part of this pattern are you tired of repeating?"

### 5. Update TransmutationPhaseModal Red Phase context

**File: `src/components/transmutation-map/TransmutationPhaseModal.tsx`** (lines 87-106)

Update Red Phase question 1 from "What weight are you ready to put down?" to match the refined question: "What part of this pattern are you tired of repeating?"

Also update the 3 questions list in the context prompt to match.

### 6. Update RedPhaseWinCard label

**File: `src/components/transmutation-map/RedPhaseWinCard.tsx`** (line ~89)

Update the first answer label from "What You're Letting Go Of" to "Pattern You're Done Repeating" to match the refined question.

## File Summary

| File | Changes |
|------|---------|
| `supabase/functions/chat-mentor/index.ts` | Add `release_mentor` to PATTERN_MENTORS; update Red question 1 in 3 locations; update Release Mentor tone; update handoff opening |
| `src/components/transmutation-map/TransmutationNodeEditModal.tsx` | Update `release_burden` prompt text |
| `src/components/transmutation-map/TransmutationPhaseModal.tsx` | Update Red Phase context question 1 |
| `src/components/transmutation-map/RedPhaseWinCard.tsx` | Update first answer label |

## What This Does NOT Touch

- White Phase logic (working)
- Gold Phase logic (working)
- Winner Card trigger mechanism (working)
- Auto-population into Transmutation Map (working)
- Database schema (no changes needed)
- PatternMap page logic (no changes needed)

