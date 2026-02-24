

# Onboarding Completion + Personal Mission Framing Page

## Placement in Flow

The new page inserts between the existing "Council Welcome" page (the "We hear you" page) and the "First Project" page.

```text
Council Intro (story)
    |
Council Welcome ("We hear you...")
    |
NEW: Onboarding Completion + Personal Mission  <-- this page
    |
First Project (idea input)
    |
Console session
```

## What Gets Built

### 1. New Page: `src/pages/OnboardingCompletion.tsx`

A transition page with four animated blocks:

**Block 1 -- Completion Celebration**
- Header: "Onboarding Complete."
- Subtle confetti burst (using existing `canvas-confetti` dependency)
- Subtext: "You've taken the first step."

**Block 2 -- Personalized Reflection Summary (AI-generated)**
- Calls a new edge function that reads the user's profile data (`entry_state`, `work_context`, `user_foundation_summary`, `action_patterns`) and generates 4-6 personalized lines
- References something they've been doing, something they're curious about, and something they want to improve
- Stage-adaptive tone (Discovery = exploratory, Growth = refining, Build = scaling)
- Shows a loading shimmer while AI generates, with a fast fallback if it takes too long

**Block 3 -- Mission Framing**
- Static text based on `entry_state`:
  - DISCOVER: "We'll identify a project direction worth committing to for the next 7 days -- something aligned with your curiosity and strengths."
  - GROW: "We'll refine your current direction and test a sharper version of it."
  - BUILD: "We'll optimize your current trajectory and define your next execution sprint."

**Block 4 -- CTA Button**
- "Start My Project Session" (intentional, not generic "Continue")
- Navigates to `/gravity/first-project`

### 2. New Edge Function: `supabase/functions/generate-onboarding-summary/index.ts`

- Reads user profile: `entry_state`, `work_context`, `user_foundation_summary`, `action_patterns`, `birth_name`
- Sends to Lovable AI (gemini-3-flash-preview) with a strict prompt:
  - Output exactly 4-6 short lines
  - Must reference their stage, something specific they shared, and their direction
  - Tone: intelligent, personal, grounded -- not fluffy
- Returns `{ summary: string, stage: string }`
- Fallback: If AI fails, return a stage-based static summary so the page never breaks

### 3. Route + Flow Updates

**`src/App.tsx`**: Add route `/gravity/onboarding-complete` pointing to the new page

**`src/pages/GravityCouncilWelcome.tsx`**: Change navigation from `/gravity/first-project` to `/gravity/onboarding-complete`

**`src/components/OnboardingRouter.tsx`**: Add a new checkpoint. After `council_introduction_completed` and before `first_project_created_at`, check for a new profile flag `onboarding_completion_seen` to route correctly.

**Database**: Add `onboarding_completion_seen` boolean column to `profiles` table (default false). The new page sets this to `true` on CTA click.

**`supabase/config.toml`**: Register the new edge function with `verify_jwt = false`.

## Technical Details

### Profile Data Available for Personalization

| Field | Source | Content |
|-------|--------|---------|
| `entry_state` | Step 2 | DISCOVER, GROW, or BUILD |
| `work_context` | Work Context page | Professional background text |
| `user_foundation_summary` | Council Intro | JSON with `who_they_are`, `struggles`, `aspirations`, `key_themes` |
| `action_patterns` | Self-Discovery Quest | Behavioral patterns (overthinking, momentum, etc.) |
| `birth_name` | Step 1 | User's name for personalization |

### Edge Function Prompt Strategy

The prompt instructs the AI to:
- Write in second person ("You're...")
- Keep each line under 15 words
- Reference at least one specific thing from `user_foundation_summary`
- End with a forward-looking line about what happens next
- Never use exclamation marks or hype language

### Fallback Logic

If the AI call fails or times out (3-second timeout):
- DISCOVER: "You're in exploration mode. There's creative energy here, but no clear direction yet. That's not a weakness -- it's raw potential. Now we're going to focus on finding something compelling enough to build toward."
- GROW: "You've already been building. You're not starting from zero -- you're refining. Now we'll focus on strengthening your positioning."
- BUILD: "You're already executing. This is not about searching -- it's about scaling. Now we'll focus on structured momentum."

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/OnboardingCompletion.tsx` | Create | New transition page with 4 blocks |
| `supabase/functions/generate-onboarding-summary/index.ts` | Create | AI personalization edge function |
| `src/App.tsx` | Edit | Add new route |
| `src/pages/GravityCouncilWelcome.tsx` | Edit | Redirect to new page |
| `src/components/OnboardingRouter.tsx` | Edit | Add routing checkpoint |
| Database migration | Execute | Add `onboarding_completion_seen` column |
