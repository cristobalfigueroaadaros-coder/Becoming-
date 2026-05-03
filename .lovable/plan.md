I understand. The flow keeps breaking because it is currently controlled by several separate flags and local/session storage keys instead of one strict, backend-backed journey state. There are also two different meanings being mixed into `onboarding_quest_completed`: the old 5-question onboarding quest and the Atlas quest journey. That makes the router think the user is further ahead than they actually are.

I will fix this as one end-to-end flow, not as another isolated button change.

```text
Required flow

Onboarding complete
  -> Home
  -> user presses Atlas button OR auto-redirect after 5 seconds
  -> Cris's Map
  -> after 2 seconds Cris founder letter/card appears
  -> user accepts/continues
  -> user's Atlas map
  -> after 2 seconds Atlas onboarding walkthrough appears
  -> walkthrough explains Atlas -> Chats -> Projects -> Creators step by step
  -> final Continue starts first Atlas quest
  -> phase-specific Atlas quests
     DISCOVER = 4 quests
     GROW = 3 quests
     BUILD = 2 quests
  -> Council / Chats intake loads correct mentors for that phase
  -> project suggestion card appears
  -> user accepts project
  -> project structure opens directly
```

## What I found

1. `OnboardingRouter` currently sends users directly to `/atlas/quest` when `onboarding_quest_completed` is false. That bypasses the required Home -> Cris Map -> founder card -> Atlas onboarding sequence.

2. `OnboardingQuest.tsx` sets `onboarding_quest_completed = true` after the old 5-question action-pattern quiz. But `useAtlasQuests.tsx` also uses that same flag to decide whether Atlas onboarding is finished. This is the main reason the Atlas onboarding/quest path is inconsistent.

3. `AtlasPage.tsx` partly depends on `localStorage` and `sessionStorage` to force Cris's Map and the Atlas walkthrough. That can fail across reloads, returning users, and fresh test users because storage flags and profile flags can disagree.

4. The project card is ephemeral in `ConsoleThread`: cards are not restored from saved messages. If the project gets created successfully but the user reloads/navigates before clicking the card, the accept/open project card disappears even though the project exists.

5. The project card copy says `Accept the project` even when the project has already been created. That is confusing. In that state the CTA should open the project structure directly.

6. `Council.tsx` tries to read `first_project_id` but does not select it in its profile query, so the thread label/project context can fail to hydrate correctly.

## Implementation plan

### 1. Fix the onboarding router so it follows the required entry flow
Update `src/components/OnboardingRouter.tsx` so after the initial onboarding/profile phase, users go to `/dashboard`, not directly to `/atlas/quest`.

The router should only route to pre-home onboarding screens when those are incomplete:
- gravity orientation
- profile / phase onboarding
- then dashboard/home

The Atlas discovery sequence will be started from Home through the Atlas CTA/auto-redirect, not from the root router.

### 2. Make Home reliably send new users to Cris's Map first
Update `src/pages/Dashboard.tsx` and `src/components/dashboard/AtlasProgressCard.tsx` so the Home path is explicit:

- Show a clear CTA to enter Atlas.
- For users who have not completed the founder/Atlas intro, clicking the card navigates to `/atlas?intro=founder`.
- The existing 5-second auto-redirect should also navigate to `/atlas?intro=founder`.
- Do not depend only on localStorage to decide whether Cris's Map appears.

### 3. Separate the old onboarding quiz from Atlas onboarding completion
Stop using `profiles.onboarding_quest_completed` as the flag for the Atlas quest journey.

Use the existing `profiles.atlas_onboarding_completed` for the visual Atlas walkthrough only, and compute Council readiness from actual completed Atlas quests:

- DISCOVER: 4 completed Atlas quests
- GROW: 3 completed Atlas quests
- BUILD: 2 completed Atlas quests

This will prevent the old 5-question onboarding quiz from accidentally skipping Atlas onboarding.

### 4. Fix Cris's Map and founder card sequencing
Update `src/pages/AtlasPage.tsx` and `src/components/atlas/founders/FoundersMap.tsx` so the sequence is deterministic:

- `/atlas?intro=founder` always opens Cris's Map.
- After 2 seconds, show the founder letter/card.
- The founder letter CTA accepts/continues and moves to `My Map`.
- Only after switching to `My Map`, wait 2 seconds, then show `AtlasOnboardingOverlay`.

Profile/backend state should be the source of truth, with localStorage only as a non-critical cache.

### 5. Fix the Atlas onboarding overlay final action
Keep `AtlasOnboardingOverlay.tsx` as the 4-step walkthrough:

- Atlas
- Chats
- Projects
- Creators

The first three `Continue` clicks should advance the explanation. Only the final CTA should navigate to `/atlas/quest`.

I will also make the final CTA text unambiguous: `Start first quest`.

### 6. Fix phase-specific Atlas quest -> Council routing
Update `src/components/atlas/AtlasQuestFlow.tsx` / `src/hooks/useAtlasQuests.tsx` so after the user reaches their phase threshold:

- Show Council unlock.
- CTA goes to `/council?view=intake`.
- Keep exploring remains optional.
- The threshold is based on actual completed Atlas quests, not the old onboarding flag.

### 7. Harden Council mentor loading for DISCOVER, GROW, BUILD
In `src/pages/ConsoleThread.tsx`, keep the safety net but make the defaults consistent with onboarding phase mentors:

- DISCOVER: Strategist, Creative Visionary, Inner Clarity, Problem, Perspective, Alignment, Challenger
- GROW: Strategist, Creative Visionary, Business, Marketing, Perspective, Challenger, Design Thinking
- BUILD: Strategist, Creative Visionary, Business, Discipline, Marketing, Problem, Design Thinking

If `user_mentors` is missing, persist the correct set before calling the council function, so GROW cannot load an empty or wrong council again.

### 8. Make the project accept card persistent and route directly to project structure
Update `src/pages/ConsoleThread.tsx` and `src/components/console-thread/ProjectCreationCard.tsx`:

- When a project is created, persist profile fields before rendering the card.
- If the project already exists, the card CTA should be `Open project structure`, not `Accept the project`.
- Clicking it should always navigate to `/project/:id`.
- On return/reload, if the thread is `post_project` and `first_project_id` exists, rebuild the project card from `integrator_projects` so the user is never stranded without the CTA.

### 9. Fix Council project context hydration
Update `src/pages/Council.tsx` profile select to include `first_project_id`, so the accepted project is correctly recognized and labeled in the Chats sidebar.

### 10. Add guardrails to prevent this from regressing again
I will add a small shared helper for phase thresholds and mentor defaults so the same values are not duplicated differently across Home, Atlas, Chats, and project creation.

This prevents the recurring issue where one page thinks GROW needs 3 quests, another page thinks onboarding is complete because of the old quiz, and another page loses the project card after reload.

## Files I expect to change

- `src/components/OnboardingRouter.tsx`
- `src/pages/Dashboard.tsx`
- `src/components/dashboard/AtlasProgressCard.tsx`
- `src/pages/AtlasPage.tsx`
- `src/components/atlas/founders/FoundersMap.tsx`
- `src/components/atlas/AtlasOnboardingOverlay.tsx` if needed for CTA clarity
- `src/hooks/useAtlasQuests.tsx`
- `src/components/atlas/AtlasQuestFlow.tsx`
- `src/pages/Council.tsx`
- `src/pages/ConsoleThread.tsx`
- `src/components/console-thread/ProjectCreationCard.tsx`
- likely one new shared helper file, e.g. `src/lib/journeyFlow.ts`

## Verification checklist after implementation

I will verify these paths in code:

```text
DISCOVER
Home -> Cris Map -> founder card -> My Atlas -> Atlas walkthrough -> 4 quests -> Council intake -> project suggestion -> accept -> /project/:id

GROW
Home -> Cris Map -> founder card -> My Atlas -> Atlas walkthrough -> 3 quests -> Council intake with GROW mentors -> project suggestion -> accept -> /project/:id

BUILD
Home -> Cris Map -> founder card -> My Atlas -> Atlas walkthrough -> 2 quests -> Council intake with BUILD mentors -> project suggestion -> accept -> /project/:id

Reload safety
After project is created but before user clicks card, reload Chats -> project card still appears -> opens project structure
```

This is the fix I will implement once approved.