

# Contextual Micro-Guide System

## Overview
Create a reusable `MicroGuide` component (info icon + popover/dialog) and place it in every feature header listed in the PDR. Also implement a one-time Save button tutorial with an animated arrow on the 3rd perspective message.

## Architecture

### 1. Reusable `MicroGuide` component (`src/components/MicroGuide.tsx`)
- Renders a small `Info` icon (lucide) in the top-right of a feature header
- On click, opens a minimal Dialog with: title, 3-4 line explanation, close button
- Tracks "first view" per guide key using localStorage (`microguide_viewed_{key}`)
- On first visit: icon has a subtle pulse animation (CSS `animate-pulse`)
- After first view: pulse stops, icon remains available

### 2. Placement across all features
Each feature gets a `<MicroGuide guideKey="..." title="..." description="..." />` added to its header area:

| Feature | File | Guide Key |
|---------|------|-----------|
| Momentum Dashboard | `MomentumDashboard.tsx` | `momentum` |
| Sprint Review tab | `SprintReviewTab.tsx` | `sprint_review` |
| Compound Growth tab | `CompoundGrowthTab.tsx` | `compound_growth` |
| Capability Map tab | `CapabilityMapTab.tsx` | `capability_map` |
| Project (Focus Mode) | `FocusMode.tsx` | `project` |
| Daily Ritual Modal | `DailyRitualModal.tsx` | `daily_ritual` |
| Project Setup (name) | `CreationLab.tsx` (setup section) | `project_name` |
| Daily Goals | Within integrator step cards | `daily_goals` |
| Journey Calendar | `IntegratorCalendar.tsx` | `journey_calendar` |
| Design Thinking Lab | `DesignThinkingLab.tsx` | `design_thinking` |
| Creative Space | `CreativeSpace.tsx` | `creative_space` |
| Purpose → Value Map | `PurposeToValueMap.tsx` / `ValueMapCanvas.tsx` | `value_map` |
| Living Constellation | `LivingConstellation.tsx` | `constellation` |
| Self Discovery Quest | `SelfDiscoveryQuest.tsx` | `self_discovery` |
| Daily Journal | `DailyJournal.tsx` | `daily_journal` |
| Pattern Profile | `BecomingPatternMap.tsx` | `pattern_profile` |
| Ideal Life Snapshot | `IdealLifeSnapshot.tsx` | `ideal_life` |
| Life Assessment | `BecomingHome.tsx` (assessment section) | `life_assessment` |
| Pattern Map | `PatternMap.tsx` (pattern tab) | `pattern_map` |
| Transmutation | `PatternMap.tsx` (transmutation tab) | `transmutation` |
| Lifetime | `PatternMap.tsx` (lifetime tab) | `lifetime` |
| Superpowers | `SuperpowerMap.tsx` | `superpowers` |

### 3. Save Button Tutorial (special case)
In `ChatBubble.tsx`:
- Track perspective message count using a ref/counter passed from `ConsoleThread.tsx`
- On the 3rd perspective message, render a small animated arrow (CSS animation pointing down-right) near the Save/Bookmark button
- When user clicks Save for the first time (tracked via localStorage `save_tutorial_shown`), show a Dialog:
  - Title: "Save Insight"
  - Text: "When a mentor shares something meaningful, you can save it. Saved insights help transform conversations into ideas and creative directions."
  - Button: "Continue"
- After clicking Continue, the existing `InsightActionSheet` opens as normal
- Arrow animation and tutorial only appear once, ever

### 4. Component Design
```tsx
// MicroGuide.tsx
interface MicroGuideProps {
  guideKey: string;
  title: string;
  description: string;
}
```
- Uses `Dialog` from `@/components/ui/dialog`
- localStorage check: `microguide_viewed_${guideKey}`
- Pulse class: `animate-pulse` on the Info icon wrapper, removed after first open
- Minimal styling: muted icon, small size (w-4 h-4), blends with headers

### Files to create
- `src/components/MicroGuide.tsx`

### Files to modify (add MicroGuide to headers)
All ~20 feature files listed above — each gets a single `<MicroGuide>` component added near its title/header, with the exact text from the PDR.

For the Save tutorial: `ChatBubble.tsx` + `ConsoleThread.tsx` (pass perspective count, handle first-save detection).

## Visual Design
- Info icon: `text-muted-foreground/50`, 16px, hover brightens
- Pulse: only on first visit, subtle opacity pulse
- Dialog: minimal, no background effects, small max-width, centered text
- Save arrow: small chevron-down-right icon with CSS translate animation pointing toward the Save button

