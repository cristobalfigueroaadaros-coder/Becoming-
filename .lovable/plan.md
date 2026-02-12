

# Fix Mentor Compositions + Unlock All Mentors for Chat

## Two Issues to Fix

### 1. Wrong Mentor Compositions

The stage-based mentor selections in `OnboardingStep4.tsx` (and displayed in `ProjectCouncilIntroduction.tsx`) need correction:

| Stage | Current (Wrong) | Correct |
|-------|-----------------|---------|
| **DISCOVER** | inner_clarity, problem, perspective, alignment, **design_thinking** | inner_clarity, problem, perspective, alignment, **challenger** |
| **GROW** | business, perspective, challenger, design_thinking, **alignment** | business, **marketing**, perspective, challenger, design_thinking |
| **BUILD** | No change needed (same 7 mentors) | Same |

Summary: DISCOVER swaps `design_thinking` for `challenger`. GROW swaps `alignment` for `marketing`.

### 2. All Mentors Must Be Chattable

Currently in `Council.tsx`, mentors not in `user_mentors` are locked (grayed out, unclickable, show "Locked" text and a lock icon). The fix: make every mentor clickable and chattable. The `user_mentors` list should only determine which mentors appear in the **Project Council group chat**, not which mentors the user can talk to individually.

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/OnboardingStep4.tsx` | Fix DISCOVER and GROW arrays |
| `src/pages/Council.tsx` | Remove lock enforcement -- all mentors are always clickable |

## Detailed Changes

### OnboardingStep4.tsx

**DISCOVER** (line 9-17): Replace `design_thinking_mentor` with `challenger_mentor`

**GROW** (line 18-26): Replace `alignment_mentor` with `marketing_mentor`

### Council.tsx

In the mentor list rendering (lines 395-460):

- Remove the `isUnlocked` check that blocks clicking locked mentors
- Remove the lock icon, "Locked" text, and opacity reduction
- All mentors render as fully interactive with their normal icon and color
- The `userMentors` state is still loaded (used for Project Council group composition) but no longer gates individual chat access

