

## Fix Starter Quest → Capabilities Flow

Three issues to fix:

### 1. MomentumDashboard: Open Capabilities tab from location state

Currently `MomentumDashboard` ignores `location.state.tab`. Need to read it and set the default tab to `"capabilities"` when navigated from the Starter Quest.

**File: `src/pages/MomentumDashboard.tsx`**
- Import `useLocation`
- Read `location.state?.tab` and use it as the `Tabs` `defaultValue` (fallback to `"sprint"`)
- Force `capabilityMapUnlocked` to true when navigated with `tab: "capabilities"` (the user just created capabilities)

### 2. CapabilityMapTab: Show "Continue Your Journey" button after 15 seconds

**File: `src/components/momentum/CapabilityMapTab.tsx`**
- Accept optional `onContinueJourney` prop
- When prop is provided, show a "Continue Your Journey" button after a 15-second `setTimeout`
- Button navigates to `/council?view=intake` (the console thread)

**File: `src/pages/MomentumDashboard.tsx`**
- Pass `onContinueJourney` to `CapabilityMapTab` only when arrived from starter quest (`location.state?.fromStarterQuest`)
- The callback navigates to `/council?view=intake`

### 3. ConsoleThread: Resume flow when user returns to thread

**File: `src/pages/ConsoleThread.tsx`**
- In the initialization logic, when phase is `"starter_return"` (user returning from capabilities map), automatically call `transitionToIntake()` after a brief delay
- This sends the "Now that I understand your strengths..." message and continues the normal intake flow

### 4. StarterQuestWinCard: Navigate with proper state

**File: `src/components/console-thread/StarterQuestWinCard.tsx`**
- Update the "See Your Capabilities" button to navigate with `{ state: { tab: "capabilities", fromStarterQuest: true } }`

### Files
- `src/pages/MomentumDashboard.tsx` — read location state for tab selection, pass continuation prop
- `src/components/momentum/CapabilityMapTab.tsx` — add delayed "Continue Your Journey" button
- `src/components/console-thread/StarterQuestWinCard.tsx` — update navigation state
- `src/pages/ConsoleThread.tsx` — auto-resume on return from capabilities

