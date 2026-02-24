

# Fix: Onboarding Completion Flow — Routing and Personalization

## Issues Found

### Issue 1: CTA skips the project idea input step
The "Start My Project Session" button navigates directly to `/council` without any project idea. The Council needs the user's idea (via `prefilledQuestion` + `isFirstProjectFlow: true`) to generate its first response. Without this state, the Council just sits there waiting for input — and the user doesn't know what to do.

**Fix**: Change the CTA destination from `/council` back to `/gravity/first-project`. This is the page that asks "Tell us: Is there an idea, a project...?" and THEN sends the user to the Council with the correct state.

### Issue 2: No personalized summary showing
The edge function works but falls back to generic text because at this point in the flow, the test user's `user_foundation_summary` may not be fully populated yet (the `process-user-foundation` function may still be processing). The function also has no logging to diagnose what profile data it received.

**Fix**: Add console logging to the edge function so we can diagnose what data is available. Also add a small retry/wait if the foundation summary is empty (it may still be processing from the Council Intro step).

## Changes

### 1. `src/pages/OnboardingCompletion.tsx`
- Change CTA navigation from `/council` to `/gravity/first-project`
- This restores the correct flow: Completion Page -> First Project Input -> Council with idea

### 2. `supabase/functions/generate-onboarding-summary/index.ts`
- Add `console.log` statements to log: user ID, whether profile was found, which fields have data, and which fallback (if any) was used
- If `user_foundation_summary` is null/empty, wait 2 seconds and retry the profile fetch once (to handle race condition with `process-user-foundation` still running)

## Corrected Flow

```text
Council Intro (user tells their story)
    |
    v
Council Welcome ("We hear you")
    |
    v
Onboarding Completion (confetti + AI summary + mission framing)
    |  CTA: "Start My Project Session"
    v
First Project Input (user types/speaks their idea)
    |  CTA: "Start Building"
    v
Council (with prefilledQuestion + isFirstProjectFlow state)
```

## Files

| File | Change |
|------|--------|
| `src/pages/OnboardingCompletion.tsx` | Change navigation from `/council` to `/gravity/first-project` |
| `supabase/functions/generate-onboarding-summary/index.ts` | Add logging + retry logic for empty foundation summary |

