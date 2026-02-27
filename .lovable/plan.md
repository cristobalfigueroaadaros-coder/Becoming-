

# Fix: Banter Visual Identity + Project Accept Navigation

## Issues

### 1. Banter bubbles missing mentor color distinction
Banter bubbles use `bg-muted/70` (gray) for all mentors. They should use a light tint of each mentor's hex color as background so each mentor is visually distinct from the others and from perspective messages.

### 2. Project accept flow broken
`handleFirstWinAccept` calls `integrator-setup` directly with hardcoded `timeframeDays: 30`. The edge function crashes because the AI sometimes returns malformed JSON (truncated keys). The user expects: accept project → navigate to Creation Lab timeframe selector → user picks days → then project is created.

The Creation Lab already has a project setup screen (`showProjectSetup` state) that renders when navigated to with `{ projectName, projectDescription }` in the router state.

## Changes

### `src/components/console-thread/ChatBubble.tsx`
- Change banter bubble background from `bg-muted/70` to a dynamic style using the mentor's hex color at ~12% opacity: `style={{ backgroundColor: hexColor ? hexColor + '1F' : undefined }}` (the `1F` suffix = ~12% alpha in hex)
- This makes each banter bubble subtly colored per mentor while keeping it distinct from perspective bubbles (which use `bg-muted` with a left border)

### `src/pages/ConsoleThread.tsx`
- **Replace `handleFirstWinAccept`**: Instead of calling `integrator-setup` + creating the project inline, navigate to `/creation-lab` with state `{ projectName: name, projectDescription: description }`. This sends the user to the existing timeframe selector in CreationLab.
- Update `profiles` with `first_project_created_at` and `console_intake_completed` before navigating
- Remove the `integrator-setup` invocation from this file entirely (Creation Lab handles it)

### `src/pages/CreationLab.tsx`
- No changes needed — it already reads `navState.projectName` and shows the timeframe selector + calls `integrator-setup`

## Expected Result
- Banter bubbles: each mentor's bubble has a unique tinted background matching their color
- Project accept: user clicks "Yes, let's build this" → navigates to Creation Lab → picks timeframe → project created → Focus Mode loads

