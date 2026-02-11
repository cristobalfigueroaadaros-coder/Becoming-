

# Onboarding Branch Replacement + Mode Redirection Logic

## Overview

This change replaces the internal branching logic of the existing onboarding flow. The Step 2 page ("What brings you here right now?") stays visually unchanged. The changes affect:

1. **Step 2**: Reduce from 5 options to 3 (DISCOVER, GROW, BUILD), map `stuck_unclear` and `dont_know` into DISCOVER
2. **Step 3**: Replace the two follow-up questions with branch-specific questions designed for synthesis input (not introspection)

4. **Edge functions**: Inject `entry_state` context into the council and mentor prompts so the system knows which branch the user chose and enforces the correct handoff target
5. **Mentor handoff**: After the council interaction, enforce mandatory handoff to Creative Mentor (DISCOVER), Creative or Strategist (GROW), or Strategist (BUILD)

---

## Current Flow

```text
Step 2 (5 options) --> Step 3 (2 generic questions + Life Domains) --> Step 4 (Mentor selection) --> Quest --> Gravity flow --> Council
```

**Problems:**
- 5 options when only 3 meaningful branches exist
- Follow-up questions are generic emotional/reflective, not branch-aligned
- Life Domains slider adds friction without feeding into mentor convergence
- No `entry_state` is passed to the council/mentor system
- No branch-specific mentor handoff logic exists

---

## Implementation Plan

### 1. Simplify Step 2 to 3 Options

**File**: `src/pages/OnboardingStep2.tsx`

Remove `stuck_unclear` and `dont_know` options. Keep only:
- `discover_purpose` ("I want to discover my purpose")
- `grow_purpose` ("I have a sense of my purpose and want to grow it")
- `already_working` ("I have something I'm already working on")

Also store the selection to the database (profiles table) in addition to localStorage, so the backend can access it.

### 2. Add `entry_state` Column to Profiles

**Migration**: Add a nullable `entry_state` text column to the `profiles` table.

This stores the user's branch selection (DISCOVER / GROW / BUILD) so the council and mentor edge functions can read it.

### 3. Replace Step 3 Questions with Branch-Aligned Questions

**File**: `src/pages/OnboardingStep3.tsx`

Replace the adaptive questions map and remove the Life Domains phase entirely. The page becomes a simple two-question form:

| Branch | Question 1 (Direction) | Question 2 (Friction) |
|--------|----------------------|----------------------|
| DISCOVER | "What have you spent years learning or doing?" | "What kinds of problems or themes keep showing up in your life?" |
| GROW | "What is the current idea or direction you're exploring?" | "What feels unclear, underdeveloped, or blocked about it?" |
| BUILD | "What stage are you in? (idea, MVP, live, revenue)" | "What is currently blocking or missing?" |

After answering, save as insight dots with `entry_state`-tagged metadata and navigate directly to Step 4 (skip Life Domains).

### 4. Update Step 4 Mentor Suggestions

**File**: `src/pages/OnboardingStep4.tsx`

Update the `mentorSuggestions` map to remove `stuck_unclear` and `dont_know` entries. Align suggestions with the new branches.

### 5. Inject Entry State into Council Meeting

**File**: `supabase/functions/council-meeting/index.ts`

Before generating mentor perspectives, fetch the user's `entry_state` from profiles. Add branch-specific instructions to the council system prompt:

- **DISCOVER**: "Focus on connecting the user's biography, skills, and emotional signals into a surprising project direction. Synthesize, don't brainstorm."
- **GROW**: "Focus on refining and elevating the user's emerging direction. Sharpen scope and suggest stretch possibilities."
- **BUILD**: "Focus on identifying the user's current stage and defining the next milestone. Be concrete and time-bound."

### 6. Inject Entry State into Chat Mentor + Enforce Handoff Target

**File**: `supabase/functions/chat-mentor/index.ts`

After fetching user profile data, read `entry_state` and inject it into the PROJECT mode prompt:

- Add branch-aware convergence rules
- Add mandatory handoff target:
  - DISCOVER: Must handoff to `creative_visionary` after 4-6 exchanges
  - GROW: Must handoff to `creative_visionary` or `strategist_mentor` depending on idea nature
  - BUILD: Must handoff to `strategist_mentor`
- The Creative Mentor prompt gets additional instructions for DISCOVER users: "Connect biography + skills + emotional signals. Identify leverage intersection. Propose 1 strong direction or 2-3 coherent options. Each must reference specific user details."
- The Strategist Mentor prompt gets BUILD-specific instructions: "Detect stage. Define next milestone. Propose short time-bound project."
- After proposal, mentor MUST ask confirmation: "Does this resonate? Is this something meaningful enough for you to build?"

### 7. Pass Onboarding Answers as Context to First Council Interaction

**File**: `src/pages/GravityFirstProject.tsx` (or `src/pages/Council.tsx`)

When the user enters the council for the first time, the system should pass the onboarding answers (stored as insight dots) as context so mentors can reference specific user details in their synthesis.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/OnboardingStep2.tsx` | Remove 2 options, save entry_state to profiles |
| `src/pages/OnboardingStep3.tsx` | Replace questions per branch, remove Life Domains phase |
| `src/pages/OnboardingStep4.tsx` | Remove `stuck_unclear` and `dont_know` from mentor suggestions |
| `supabase/functions/council-meeting/index.ts` | Fetch entry_state, add branch-specific council instructions |
| `supabase/functions/chat-mentor/index.ts` | Fetch entry_state, add branch-specific convergence + handoff rules |
| Database migration | Add `entry_state` text column to profiles |

---

## What This Does NOT Change

- The visual design of any onboarding page
- The Gravity flow (Orientation, Transition, Council Intro)
- The mentor selection page (Step 4) layout
- Pattern Mode / Transmutation logic
- The existing mode enforcement (PROJECT vs PATTERN)

---

## Expected Outcomes

| Scenario | Before | After |
|----------|--------|-------|
| User selects "Discover" | Generic emotional questions, no mentor targeting | Skills/themes extraction, mandatory Creative Mentor handoff with synthesis |
| User selects "Grow" | Same generic questions as Discover | Idea + blocker extraction, Creative or Strategist handoff |
| User selects "Build" | Same generic questions | Stage + blocker extraction, mandatory Strategist handoff with milestone proposal |
| Life Domains slider | Shown for all users, delays flow | Removed from onboarding (can exist elsewhere) |
| Council interaction | No branch awareness | Branch-aware prompts with convergence + confirmation triggers |
| Mentor handoff | No targeting | Branch-determined handoff target with dot-connection synthesis |

