
# Rename General Council to Project Council + Stage-Based Auto Assembly

## Overview

This update makes three structural changes:

1. **Rename** "Council" to "Project Council" in the sidebar and UI
2. **Update Step 2** option text with new descriptions
3. **Replace Step 4** (manual mentor selection) with automatic mentor assembly based on entry_state, then skip directly to the quest step
4. **Update CouncilMeeting** to use entry_state-based mentor composition instead of user_mentors table

---

## Changes

### 1. Update Step 2 Option Text

**File**: `src/pages/OnboardingStep2.tsx`

Replace the three option titles and add subtitle descriptions:

| Option | Current Title | New Title | New Subtitle |
|--------|--------------|-----------|-------------|
| DISCOVER | "I want to discover my purpose" | "Discover" with "I want to discover my meaning or direction. I'm exploring and need help connecting the dots." | Two-line description under the title |
| GROW | "I have a sense of my purpose and want to grow it" | "Grow" with "I have a sense of my direction and want to develop it. I need clarity, refinement, or expansion." | Two-line description |
| BUILD | "I have something I'm already working on" | "Build" with "I already have a project or business. I want to move it forward and reach the next stage." | Two-line description |

Add `CardDescription` to each card to show the subtitle text.

### 2. Replace Step 4 with Auto-Assembly

**File**: `src/pages/OnboardingStep4.tsx`

Remove the entire mentor selection UI. Replace with auto-assembly logic:

- Read `entry_state` from localStorage (set in Step 2)
- Determine the 7 mentors based on entry_state:

| DISCOVER | GROW | BUILD |
|----------|------|-------|
| strategist_mentor | strategist_mentor | strategist_mentor |
| creative_visionary | creative_visionary | creative_visionary |
| inner_clarity_mentor | business_mentor | business_mentor |
| problem_mentor | perspective_mentor | discipline_mentor |
| perspective_mentor | challenger_mentor | marketing_mentor |
| alignment_mentor | design_thinking_mentor | problem_mentor |
| design_thinking_mentor | alignment_mentor | design_thinking_mentor |

- Auto-insert these 7 mentors into `user_mentors` table
- Show a brief loading/assembly animation instead of the selection grid
- Navigate to `/onboarding/quest` after insertion

### 3. Rename Council to Project Council in Sidebar

**File**: `src/pages/Council.tsx`

In the SidebarContent component (around line 326):
- Change `"Council"` label to `"Project Council"`
- Change subtitle from `"Your mentors together"` to `"Your project mentors"`
- Change the header (line 308) from `"Council"` to `"Council"` (keep as section header since it contains all council types)

### 4. Update CouncilMeeting to Use Entry-State Mentors

**File**: `src/pages/CouncilMeeting.tsx`

Currently (line 314), the council-meeting call passes mentors from the `user_mentors` table. This stays the same since Step 4 now auto-inserts the correct 7 mentors. No change needed here -- the auto-assembly in Step 4 ensures the right mentors are in `user_mentors`.

### 5. Enforce Transmutation Boundary

The auto-assembly compositions above already exclude Transmutation mentors (storybreaker, phoenix, stoic, release_mentor). No code change needed -- they simply aren't in any of the 3 compositions.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/OnboardingStep2.tsx` | Update option titles + add subtitle descriptions |
| `src/pages/OnboardingStep4.tsx` | Replace mentor selection with auto-assembly + loading screen |
| `src/pages/Council.tsx` | Rename "Council" to "Project Council" in sidebar |

## What Does NOT Change

- Onboarding flow structure (Step 1 -> 2 -> 3 -> 4 -> Quest)
- Council interaction rhythm (perspectives, banter, clarifying question)
- Individual mentor chats
- Builders Team, Inner Self Council, Transmutation Council
- Navigation layout
- Edge functions (council-meeting, chat-mentor)
- Database schema (user_mentors table still used, just auto-populated)

---

## Technical Notes

- The `user_mentors` table continues to be the source of truth for which mentors are available to the user. Step 4 just changes from manual selection to automatic insertion.
- The council-meeting edge function already reads from `user_mentors` and enforces mandatory mentors (creative_visionary, strategist_mentor). The 7-mentor auto-assembly includes both, so this works seamlessly.
- The lock/unlock system in the Council sidebar still reads from `user_mentors`, so only the 7 auto-assembled mentors will be unlocked initially.
