

# Project Console Surface Refactor — Continuous Thread Architecture (MVP)

## Current Flow (What Exists)

After the 5 multiple-choice questions, users navigate through 7 separate pages before reaching the Council:

```text
OnboardingQuest (5 MCQ)
  → OnboardingWorkContext (work experience - separate page)
  → ProjectCouncilIntroduction (show council - separate page)
  → GravityTransition (motivational screen - separate page)
  → GravityCouncilIntro (tell story - separate page)
  → GravityCouncilWelcome (welcome screen - separate page)
  → OnboardingCompletion (AI summary - separate page)
  → GravityFirstProject (project idea input - separate page)
  → Council (finally enters council-meeting)
```

Each step is a full page transition. This breaks immersion and creates friction.

## New Flow (What We're Building)

```text
OnboardingQuest (5 MCQ)
  → Dashboard (app unlocks, notification appears)
  → User taps notification → ConsoleThread opens
  → ALL remaining steps happen inside ONE continuous chat thread
```

## Architecture

### New Files

**1. `src/pages/ConsoleThread.tsx`** (~500 lines)
The main continuous thread page. Manages phases internally:
- Phase state machine: `intake_q1` → `intake_q2` → `intake_q3` → `processing` → `council_reveal` → `council_accepted` → `perspectives` → `banter` → `user_reply` → `handoff_offer` → `mentor_1to1` → `project_detected` → `complete`
- Renders all messages as a scrolling chat thread
- Header starts as "New Conversation", renames to project name after creation
- "+" icon in header for "Talk to Another Mentor" post-creation
- Calls existing edge functions: `process-user-foundation`, `council-meeting`, `chat-mentor`
- Auto-scroll, typing indicators, staggered message appearance

**2. `src/components/console-thread/ChatBubble.tsx`**
Single message bubble component:
- Left-aligned for system/mentor messages (with mentor color, icon, name)
- Right-aligned for user messages
- Supports text, cards (mentor reveal, project creation), and interactive elements (Accept button)
- Typing animation (three dots) before message appears

**3. `src/components/console-thread/TypingIndicator.tsx`**
Three-dot typing animation with mentor identity (color + name)

**4. `src/components/console-thread/MentorRevealCard.tsx`**
Inline card showing assembled council mentors (reuses existing mentor card data from `ProjectCouncilIntroduction`). Includes "Accept" button.

**5. `src/components/console-thread/ProjectCreationCard.tsx`**
Inline project creation card that appears when project coherence is detected. Reuses existing project creation logic from `Chat.tsx`.

**6. `src/components/console-thread/IntakeNotification.tsx`**
WhatsApp-style notification card for the Dashboard: "Console — Phase 2 Intake". Tapping navigates to `/console-thread`.

### Modified Files

**7. `src/pages/OnboardingQuest.tsx`**
- After 5th question completion: navigate to `/dashboard` instead of `/onboarding/work-context`
- Mark `onboarding_quest_completed: true` on profile (new field)
- Remove navigation to work-context

**8. `src/components/OnboardingRouter.tsx`**
- After quest completion, route to `/dashboard` (not through the 7-page chain)
- Add check: if `onboarding_quest_completed` but no `first_project_created_at`, route to dashboard (notification will appear there)

**9. `src/App.tsx`**
- Add route: `/console-thread` → `ConsoleThread` component
- Keep old routes for backward compatibility (returning users mid-flow)

**10. `src/pages/Dashboard.tsx`**
- Import and render `IntakeNotification` when user has completed quest but hasn't started console intake
- Notification dismisses after tap and navigates to `/console-thread`

### Database Migration

Add column to profiles:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS console_intake_completed boolean DEFAULT false;
```

This tracks whether the user has completed the console thread intake phase.

## Phase-by-Phase Thread Logic

### Phase 2 — Intake (3 questions, inline)
The thread opens with Future Self asking:
1. "What is your work experience or background?" (replaces `OnboardingWorkContext`)
2. "Tell us about your story. Who are you becoming?" (replaces `GravityCouncilIntro`)
3. "What are you building or thinking about building?" (replaces `GravityFirstProject`)

User answers appear as right-aligned bubbles. After Q3, call `process-user-foundation` with combined answers.

### Phase 3 — Council Reveal (inline)
System message: "Based on your answers, this will be your Council."
Render `MentorRevealCard` with the assembled mentors (already in `user_mentors` table from Step4).
User presses "Accept" → confetti moment → early win.

### Phase 4-5 — Perspectives + Banter (inline)
Call `council-meeting` edge function with Q3 answer as the initial question.
Render perspectives as individual mentor bubbles (left-aligned, with color/icon/name).
Render banter as alternating left-aligned bubbles with typing delays.
Final banter message narrows to a question: "So let me ask you..."

### Phase 6 — User Reply (inline)
User types reply in the input at bottom of thread. Right-aligned bubble.
Response triggers another round of perspectives if needed.

### Phase 7 — Mentor Handoff (inline)
When council determines handoff: system message "I think you're ready to work 1-to-1 with [Mentor]."
Text prompt: "If you're ready, type 'let's go'."
Any affirmative triggers handoff. Call `chat-mentor` with handoff context.
Mode rule: Discover → Creative Mentor, Grow/Build → Strategist Mentor.

### Phase 8 — Project Creation (inline)
When project coherence detected: render `ProjectCreationCard` inline.
User accepts → project created in Creation Lab (existing logic).
Chat header renames from "New Conversation" → Project Name.

## Visual Requirements
- Typing indicator (three dots) with short dynamic delay
- Light notification sound (default ON, stored in localStorage)
- Smooth auto-scroll to latest message (using `scrollIntoView`)
- Left vs right alignment with consistent mentor color + icon
- Each mentor has unique color from existing `mentorConfig` in `Council.tsx`

## What Is NOT Changing
- No edge function changes
- No council-meeting logic changes
- No mentor selection logic changes
- No banter engine changes
- No handoff logic changes
- No project creation backend logic changes
- No Transmutation Console changes
- All existing pages kept for backward compatibility

## Implementation Order

| Step | Task | Estimate |
|------|------|----------|
| 1 | Database migration (add `console_intake_completed`) | Small |
| 2 | Create `ChatBubble`, `TypingIndicator` components | Medium |
| 3 | Create `MentorRevealCard`, `ProjectCreationCard` | Medium |
| 4 | Create `ConsoleThread` page with phase state machine | Large |
| 5 | Create `IntakeNotification` + wire into Dashboard | Small |
| 6 | Update `OnboardingQuest` to navigate to dashboard | Small |
| 7 | Update `OnboardingRouter` routing logic | Small |
| 8 | Add route in `App.tsx` | Small |

