

# Fix: Council Assembly Ordering, Hide Legacy Pages, Add Council Notification Badge

## Issues

1. **Council assembly shown before intake questions**: The `ConsoleThread` loads mentors from `user_mentors` on init, but shows the council reveal card immediately after the 3 intake questions. The problem is the council was already assembled during `OnboardingStep4` (before the quest). The thread correctly shows it after Q3 — but old legacy pages (`GravityCouncilIntro`, `GravityCouncilWelcome`, `GravityFirstProject`, `OnboardingCompletion`, `ProjectCouncilIntroduction`) are still accessible and the `OnboardingRouter` still routes to them.

2. **Legacy pages not hidden**: The old pages ("Before we can guide you, we must know you...", "Onboarding Complete", "We hear you...") are still routable and the `OnboardingRouter` still sends users to them. These need to be bypassed since the console thread now handles all of that.

3. **No red notification badge on Council button**: When the user completes the quest and lands on the dashboard, there's no visual indicator on the Council nav item to guide them to start the console thread. The `IntakeNotification` card exists on the dashboard but the Council button in the bottom nav should also have a red badge.

## Changes

### 1. `src/components/OnboardingRouter.tsx`
- Simplify routing: after quest completed (`onboarding_quest_completed: true`) but no `first_project_created_at`, navigate to `/dashboard` — skip ALL legacy gravity pages
- Remove the fallthrough to `/gravity/transition`, `/gravity/council-intro`, `/gravity/onboarding-complete`, `/gravity/first-project` for users who completed the quest

### 2. `src/pages/Dashboard.tsx`
- Fix `checkFirstTimeUser`: when `onboarding_quest_completed` is true but no project exists, do NOT redirect to legacy gravity pages. Just show the dashboard with the intake notification.
- Remove the redirect logic in lines 118-149 that sends users to `/gravity/transition`, `/gravity/council-intro`, etc. when quest is completed.

### 3. `src/components/layout/BottomNavigation.tsx`
- Add a red notification badge on the "Council" nav item when user has completed quest but hasn't completed console intake (`console_intake_completed = false`)
- Query profile for `onboarding_quest_completed` and `console_intake_completed` to determine badge visibility

### 4. `src/components/console-thread/IntakeNotification.tsx`
- Change navigation target from `/console-thread` to `/council` (the Council button should be the entry point, and the thread opens from there)
- OR keep `/console-thread` but also add the badge on Council

## Files

| File | Change |
|------|--------|
| `src/components/OnboardingRouter.tsx` | Skip legacy pages when quest completed |
| `src/pages/Dashboard.tsx` | Don't redirect to legacy gravity pages when quest completed |
| `src/components/layout/BottomNavigation.tsx` | Add red badge on Council when intake pending |

