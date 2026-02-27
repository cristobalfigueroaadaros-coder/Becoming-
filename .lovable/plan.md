

# Console Thread UX Improvements + Project Creation Fix

## Issues to Fix

### 1. Mentor bubble colors not showing
`ChatBubble.tsx` uses `mentorColor` as a Tailwind class on the icon circle, but mentor messages use `bg-blue-500` etc. — this only colors the icon, not the bubble itself. Need to add a colored left border or tinted background to distinguish mentors.

### 2. Perspectives appear too fast
The typing delay is `600 + Math.random() * 600` (0.6-1.2s). Increase to `1500 + Math.random() * 1000` (1.5-2.5s) for perspectives and similar for banter.

### 3. Future Self intake questions too robotic
Replace the 3 static questions with warmer, human copy that uses the user's `display_name`:
- Q1: "Hey {name}! Before I assemble your Council, I'd like to ask you a few questions to understand where you are. First — what's your work experience or background?"
- Q2: "That's great to know. Now tell me a bit about your story — who are you becoming?"
- Q3: "Love it. So what have you been working on, or thinking about building?"

Fetch `display_name` from profiles on init.

### 4. Markdown artifacts (`**text**`) showing raw
`ChatBubble.tsx` renders content with `whitespace-pre-wrap` but doesn't parse markdown. Strip `**` and `*` from content before rendering (simple regex clean), or render bold inline.

### 5. System asks user for project name
The system shouldn't ask. When `projectCoherence.isCoherent` is detected, use the `FirstWinNamingCard` (existing component) instead of `ProjectCreationCard`. This card proposes a name that the user can edit and accept — feels like a surprise/celebration.

### 6. Project creation fails — "No project ID returned"
`ProjectCreationCard` reads `data?.projectId` but the `integrator-setup` edge function returns `{ project: { id: ... } }`. Fix: read `data?.project?.id || data?.projectId`.

### 7. Council reveal should feel more celebratory
Use confetti + a "first win" style reveal instead of the plain card. Add a celebration message from Future Self before the card.

## Files to Change

### `src/pages/ConsoleThread.tsx`
- Fetch `display_name` from profiles on init
- Replace static `INTAKE_QUESTIONS` with dynamic copy using the name
- Increase typing delays for perspectives (1500-2500ms) and banter (800-1200ms)
- Replace `ProjectCreationCard` usage with `FirstWinNamingCard` from existing component
- Wire `FirstWinNamingCard.onAccept` to call integrator-setup and handle project creation
- Add a celebratory Future Self message before council reveal card

### `src/components/console-thread/ChatBubble.tsx`
- Strip markdown `**` and `*` from content before rendering
- Add mentor-colored left border on mentor bubbles for visual distinction

### `src/components/console-thread/ProjectCreationCard.tsx`
- Fix: read `data?.project?.id || data?.projectId` instead of just `data?.projectId`

### `src/components/console-thread/MentorRevealCard.tsx`
- Add confetti on render (first-win feeling)

## Implementation Order
1. Fix ProjectCreationCard projectId bug
2. Update ChatBubble for markdown stripping + mentor colors
3. Update ConsoleThread: warm intake copy, slower typing, FirstWinNamingCard integration
4. Update MentorRevealCard celebration feel

