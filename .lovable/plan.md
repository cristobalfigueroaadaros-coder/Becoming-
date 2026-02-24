# Fix Onboarding Completion Page: Personalization + CTA Routing

## Problem 1: No Personal Information Displayed

The AI-generated summary never loads. Two root causes:

1. **Auth method broken**: The edge function uses `supabase.auth.getClaims(token)` which does not exist in the Supabase JS SDK. This causes a runtime error, falling through to the fallback.
2. **Timeout too short**: The 3-second timeout fires before the AI gateway responds, aborting the request (confirmed in logs: `AbortError: The signal has been aborted`).  
  
The order is wrong, the new page goes after the page "we hard you.."  pelase fix this 

Result: Users always see the generic fallback text with no personal details.

## Problem 2: CTA Routes to Wrong Destination

"Start My Project Session" currently navigates to `/gravity/first-project`. Per the PDR, it should connect the user to the **Project Council** for their first session.

## Changes

### 1. Fix Edge Function Auth (`supabase/functions/generate-onboarding-summary/index.ts`)

Replace the broken `getClaims` approach with the standard `getUser()` pattern:

```text
BEFORE (broken):
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  const userId = claimsData.claims.sub;

AFTER (working):
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  const userId = user.id;
```

### 2. Increase Timeout (`supabase/functions/generate-onboarding-summary/index.ts`)

Change the AI call timeout from 3 seconds to 10 seconds. The Gemini flash model typically responds in 4-7 seconds, so 3 seconds is too aggressive.

### 3. Fix CTA Destination (`src/pages/OnboardingCompletion.tsx`)

Change the navigation target from `/gravity/first-project` to `/council` so the user lands directly in the Project Council to begin their first session.

## Files


| File                                                      | Change                                                            |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| `supabase/functions/generate-onboarding-summary/index.ts` | Fix auth method, increase timeout to 10s                          |
| `src/pages/OnboardingCompletion.tsx`                      | Change CTA navigation from `/gravity/first-project` to `/council` |
