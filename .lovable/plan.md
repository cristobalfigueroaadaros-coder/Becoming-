

# Remove OnboardingStep3 (Branch Questions)

Removing the two follow-up questions screen to make onboarding faster. The data collected there is never used by any downstream system.

## Changes

### 1. `src/pages/OnboardingStep2.tsx`
- Change navigation from `/onboarding/step3` to `/onboarding/step4` (both the success and error paths on lines 67 and 70)

### 2. `src/App.tsx`
- Remove the import of `OnboardingStep3` (line 18)
- Remove the `/onboarding/step3` route definition (lines 230-233)

### 3. Delete `src/pages/OnboardingStep3.tsx`
- No longer needed

## What stays the same
- OnboardingStep2 still saves the user's branch choice (DISCOVER/GROW/BUILD) to localStorage and the database
- OnboardingStep4 still reads that branch choice to assemble the correct mentor council
- The OnboardingQuest still collects the meaningful data that feeds into prompts

## Impact
- One fewer screen in onboarding
- Zero downstream breakage (the removed data was never consumed)

