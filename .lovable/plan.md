

## Plan: Atlas Onboarding Overlay — Delayed Start + Bottom Nav Sync

### What changes

**1. Add 10-second delay before overlay appears**
- In `AtlasPage.tsx`, when `atlas_onboarding_completed` is false, instead of immediately showing the overlay, start a 10-second timer so the user can explore the Atlas map first.

**2. Sync overlay steps with bottom navigation icons**
- The overlay steps map to bottom nav items: Step 0 = Atlas, Step 1 = Chats, Step 2 = Projects, Step 3 = Creators.
- Share the current onboarding step with `BottomNavigation` so it can illuminate the matching icon (still locked/non-clickable, but visually highlighted with the primary color glow instead of the dim locked style).
- Use a lightweight shared state mechanism — a custom event or a React context. A simple approach: the `AtlasOnboardingOverlay` component dispatches a custom DOM event (`atlas-onboarding-step`) with the current step index, and `BottomNavigation` listens for it.

### Files to modify

| File | Change |
|------|--------|
| `src/pages/AtlasPage.tsx` | Add 10s `setTimeout` before setting `showOnboarding(true)` |
| `src/components/atlas/AtlasOnboardingOverlay.tsx` | Dispatch a custom event on each step change with the current step index; dispatch a "done" event on complete |
| `src/components/layout/BottomNavigation.tsx` | Listen for the custom event; when active, illuminate the corresponding nav icon (show it with primary color/glow) even if locked — but keep it non-clickable |

### How the bottom nav highlight works

- Map overlay steps to nav `unlockKey`: `[0: "atlas", 1: "chat", 2: "projects", 3: "creators"]`
- When a step is active, that nav icon renders with the primary color styling (like an active tab) instead of the dimmed locked style — but clicking still shows the lock toast
- Step 4 (mission screen) dispatches a clear/reset event so no nav icon is highlighted

### Technical approach

- `AtlasOnboardingOverlay`: In a `useEffect` watching `currentStep`, dispatch `window.dispatchEvent(new CustomEvent('atlas-onboarding-step', { detail: { step: currentStep } }))`. On unmount/complete, dispatch with `step: -1`.
- `BottomNavigation`: Add state `onboardingHighlight` (string | null). Listen for the custom event and map step index to the unlock key. When a nav item's `unlockKey` matches `onboardingHighlight`, render it with primary color (not dimmed) but keep the lock icon and keep it non-clickable.

