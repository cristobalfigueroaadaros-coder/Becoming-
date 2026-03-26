

# PDR 19 — Atlas Entry Onboarding

## Summary

Three changes: (1) Reorder bottom navigation to Home → Atlas → Chat → Projects → Creators, (2) add a red notification dot on Atlas icon for first-time users, (3) create a cinematic 5-screen onboarding overlay that appears once on first Atlas open, introducing the four app areas plus a mission moment, then connecting directly to the first quest.

## 1. Navigation Reorder

**Edit: `src/components/layout/BottomNavigation.tsx`**

Change the `navItems` array order from:
- Home, Atlas, Creators, Chats, Projects

To:
- Home, Atlas, Chats, Projects, Creators

Just swap the array entries — Chats moves to position 3, Projects to position 4, Creators to position 5.

## 2. Red Notification Dot on Atlas Icon

**Edit: `src/components/layout/BottomNavigation.tsx`**

- In the existing `checkCouncilBadge` effect, also check if the user has completed the Atlas onboarding overlay (check a profile flag `atlas_onboarding_completed`).
- If `atlas_onboarding_completed` is falsy, show a red dot badge on the Atlas nav item (same style as council badge).

**Database migration**: Add flag to profiles:
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS atlas_onboarding_completed boolean DEFAULT false;
```

## 3. Atlas Onboarding Overlay Component

**Create: `src/components/atlas/AtlasOnboardingOverlay.tsx`**

A full-screen overlay component with 5 screens (4 app areas + 1 mission moment):

- Props: `onComplete: () => void`
- State: `currentStep` (0-4)
- Layout: dimmed backdrop over Atlas map, centered card with 4 horizontal sections
- Each step highlights one section (full brightness), dims others (low opacity)
- Progress indicator: "Step X of 4" for screens 1-4, no indicator on mission screen

**Screen content** (icons reuse the same Lucide icons from BottomNavigation):

| Step | Icon | Title | Highlighted |
|------|------|-------|-------------|
| 0 | Compass | Atlas | Atlas section |
| 1 | Users | Chat | Chat section |
| 2 | FlaskConical | Projects | Projects section |
| 3 | Globe | Creators | Creators section |
| 4 | (none) | Mission | All sections dimmed, centered text only |

Text content exactly as specified in the PDR for each screen.

**Animations** (Framer Motion):
- Section transitions: 400ms fade for highlight/dim
- Screen 4→Mission: all sections fade simultaneously, slightly slower (~600ms)
- Mission→Atlas: overlay fades out, quest button pulses

**Button behavior**:
- Steps 0-3: "Next" button advances `currentStep`
- Step 4 (mission): "Start Your First Quest" button calls `onComplete`

**No skip, no back, no scroll.**

## 4. Integration in AtlasPage

**Edit: `src/pages/AtlasPage.tsx`**

- On mount, check `profiles.atlas_onboarding_completed` for the current user
- If `false`, render `<AtlasOnboardingOverlay>` on top of the existing map (map stays visible but dimmed behind)
- `onComplete` handler:
  1. Update `profiles.atlas_onboarding_completed = true`
  2. Hide overlay
  3. Navigate to `/atlas/quest` (first quest)
- The existing pulsing Start Quest button already handles the post-overlay experience

## Files to Create/Edit

| File | Action |
|------|--------|
| Migration (atlas_onboarding_completed column) | Create |
| `src/components/atlas/AtlasOnboardingOverlay.tsx` | Create — 5-screen cinematic overlay |
| `src/pages/AtlasPage.tsx` | Edit — check flag, render overlay, handle completion |
| `src/components/layout/BottomNavigation.tsx` | Edit — reorder nav items, add Atlas red dot badge |

