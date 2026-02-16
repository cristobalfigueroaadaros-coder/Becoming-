

# Red Phase -- Release Integration

## Overview

Insert a new "Red Phase" between White and Gold in the transmutation sequence. The Red Phase uses the existing Release Mentor and follows the exact same card/modal/winner-card patterns already established for White and Gold.

New sequence: **Black --> White --> Red --> Gold**

---

## What Changes

### 1. Data Layer

**TransmutationData interface** (in `src/hooks/useInnerPatterns.tsx` and `src/components/transmutation-map/TransmutationMapCanvas.tsx`):

Add 3 new Red Phase fields + metadata:
- `release_burden` (string) -- "What are you ready to stop carrying?"
- `release_belief` (string) -- "What belief are you ready to let go of?"
- `release_cost` (string) -- "If you keep living this pattern, what will it cost you?"
- `red_completed_at` (string)

Update `phase_completed` type from `'black' | 'white' | 'gold'` to `'black' | 'white' | 'red' | 'gold'`

**No database migration needed** -- `transmutation_data` is a JSONB column, so new fields are stored automatically.

### 2. Phase Completion Logic

**`src/lib/goldenSummaryGenerator.ts`**:

Add `isRedPhaseComplete()`:
```
Red is complete when 2+ of 3 fields are filled
(release_burden, release_belief, release_cost)
OR phase_completed includes 'red'
```

Update `isWhitePhaseComplete` -- no change needed (still gates Red).

Update Gold gating logic everywhere: Gold now requires Red complete (not just White).

Update `generateGoldenSummary` to include release data in the summary arc.

### 3. Transmutation Map Canvas

**`src/components/transmutation-map/TransmutationMapCanvas.tsx`**:

- Change from 3-column to 4-column layout: Black (col 0), White (col 1), Red (col 2), Gold (col 3)
- Add 3 Red Phase nodes:
  - `release_burden` -- "Stop Carrying" (required)
  - `release_belief` -- "Let Go" (required)
  - `release_cost` -- "The Cost" (required)
- Add "RED PHASE" label in red color (`#ef4444`)
- Add red gradient definition for Red nodes
- Update Gold locking: Gold locked until Red is complete (not White)
- Add connection line from White to Red to Gold
- Adjust SVG width to ~440 to fit 4 columns

Update `onNodeClick` prop type to include `'red'` phase.

### 4. Transmutation Node

**`src/components/transmutation-map/TransmutationNode.tsx`**:

Add `'red'` case to `getPhaseColors()`:
- Fill: red-tinted (`#fca5a5` empty, `#dc2626` filled)
- Stroke: `#ef4444`
- Text: dark red

### 5. Node Edit Modal

**`src/components/transmutation-map/TransmutationNodeEditModal.tsx`**:

- Add Red Phase node prompts for `release_burden`, `release_belief`, `release_cost`
- Add Red Phase style (red badge, red border)
- Red Phase mentor CTA: "Talk to Release Mentor"
- Add `'red'` to phase type

### 6. Red Phase Winner Card (New Component)

**`src/components/transmutation-map/RedPhaseWinCard.tsx`** (new file):

Follows exact same structure as `WhitePhaseWinCard.tsx`:
- Red-themed gradient (from-red-50 to white)
- Title: "Release Complete"
- Shows pattern name, 3 release answers
- Message: "The Gold Phase is now unlocked."
- Buttons: "Not now" / "Confirm Release"
- z-[60], max-h-[85vh], sticky footer

### 7. PatternMap Page Logic

**`src/pages/PatternMap.tsx`**:

- Import `RedPhaseWinCard`
- Add `showRedWinCard` state
- Update `transmutationNodeLabels` to include Red Phase nodes
- Update `handleTransmutationNodeClick`: Red nodes locked until White complete; Gold nodes locked until Red complete
- Update `handleTransmutationNodeSave`: detect Red phase completion, trigger Red Win Card
- Update Gold completion handler: Gold now requires Red to be complete first
- Update `handleWhiteWinConfirm`: message says "Red Phase unlocked" instead of "Gold Phase unlocked"
- Add Red Win Card confirm handler that unlocks Gold
- Update mentor navigation: Red Phase uses `release_mentor`
- Handle return from Release Mentor chat with Red phase data extraction

### 8. Chat.tsx -- Return Navigation for Red Phase

**`src/pages/Chat.tsx`**:

- Handle `transmutationPhaseComplete` for `phase === 'red'` (same pattern as white/gold)
- Route back to PatternMap with red completion state

### 9. Release Mentor -- Transmutation Mode

**`supabase/functions/chat-mentor/index.ts`**:

Add transmutation-specific behavior to `release_mentor` prompt when `transmutationPhase === 'red'`:

```
RED PHASE TRANSMUTATION MODE:
Opening: "You've gained clarity. Now it's time to decide what you're done carrying."
Three questions to extract:
1. What are you ready to stop carrying?
2. What belief are you ready to let go of?
3. If you keep living this pattern, what will it cost you?

After all 3 are answered, acknowledge: "You're ready for the next phase."
Include [RED_PHASE_READY] marker + JSON extraction:
{"release_burden": "...", "release_belief": "...", "release_cost": "..."}
```

Add Red phase detection/completion logic alongside existing White/Gold detection (completion signals, confirmation phrases).

### 10. TransmutationPhaseModal

**`src/components/transmutation-map/TransmutationPhaseModal.tsx`**:

- Add `'red'` to phase type
- Add Red Phase context/prompt for Release Mentor
- Add `[RED_PHASE_READY]` marker detection
- Use `release_mentor` for Red phase
- Red-themed styling (bg-red-100, border-red-200)

### 11. Index Exports

**`src/components/transmutation-map/index.ts`**:

Add `RedPhaseWinCard` export.

### 12. WhitePhaseWinCard Message Update

**`src/components/transmutation-map/WhitePhaseWinCard.tsx`**:

Change message from "The Gold Phase is now unlocked." to "The Red Phase is now unlocked."

---

## File Summary

| File | Action |
|------|--------|
| `src/hooks/useInnerPatterns.tsx` | Add red fields to TransmutationData type, add 'red' to phase_completed |
| `src/lib/goldenSummaryGenerator.ts` | Add `isRedPhaseComplete()`, update Gold gating, update summary |
| `src/components/transmutation-map/TransmutationMapCanvas.tsx` | 4-column layout, Red nodes, Red phase label, update Gold lock to require Red |
| `src/components/transmutation-map/TransmutationNode.tsx` | Add red color scheme |
| `src/components/transmutation-map/TransmutationNodeEditModal.tsx` | Red prompts, red style, Release Mentor CTA |
| `src/components/transmutation-map/RedPhaseWinCard.tsx` | **New file** -- Red Winner Card |
| `src/components/transmutation-map/WhitePhaseWinCard.tsx` | Update message to mention Red Phase |
| `src/components/transmutation-map/TransmutationPhaseModal.tsx` | Add red phase support |
| `src/components/transmutation-map/index.ts` | Export RedPhaseWinCard |
| `src/pages/PatternMap.tsx` | Red phase state, locking logic, win card triggers, mentor navigation |
| `src/pages/Chat.tsx` | Handle red phase return navigation |
| `supabase/functions/chat-mentor/index.ts` | Release Mentor transmutation mode, red phase detection |

