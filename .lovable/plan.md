

# Plan: Creative Space Keywords, Dynamic Thread Name, Post-Project Engagement, and Natural Pacing

## Issues Identified

### 1. Creative Space not suggesting keywords as connectors
The keyword loading in `CreativeSpace.tsx` queries `user_keywords` and displays them, but there's no AI-driven suggestion for which keywords could connect existing tiles. The keywords just show up as a flat list with no intelligence about relevance to the current project context.

### 2. "New Conversation" sidebar label never updates to project name
In `Council.tsx` line 354, the sidebar hardcodes "New Conversation". The `ConsoleThread` tracks `projectName` in local state but never communicates it back to the parent `Council.tsx`.

### 3. No post-project engagement — thread goes dead after project creation
Once the project is created and the user navigates to Creation Lab, the thread has no mechanism to re-engage the user. There are no follow-up messages, notifications, or mentor prompts within the thread.

### 4. Perspective timing too rigid (fixed 3-5s)
Current delays use `3000 + Math.random() * 2000` (3-5s range). Need wider randomization (5-20s as requested).

---

## Changes

### A. `src/pages/Council.tsx` — Dynamic thread name
- Load the user's first project name from `integrator_projects` (or from profile `first_project_id`) on init
- Pass it as a prop or use it directly: replace hardcoded "New Conversation" with the project title when it exists, falling back to "New Conversation" if no project yet
- Also update the header bar label (line 496)

### B. `src/pages/ConsoleThread.tsx` — Pacing + Post-project engagement

**Pacing (wider random delays):**
- First round perspectives: `5000 + Math.random() * 15000` (5-20s)
- Banter: `4000 + Math.random() * 10000` (4-14s)
- Second round perspectives: `5000 + Math.random() * 12000` (5-17s)

**Post-project engagement system:**
- After `handleProjectCreated` or when thread resumes in `complete` phase, add a new phase `"post_project"` that allows continued conversation
- When user returns to the thread after project creation, Future Self sends a re-engagement message suggesting the user talk to a specific mentor about the project
- When user sends messages in `post_project` phase, route them through `council-meeting` with the project context, allowing multi-mentor responses
- The system detects when 2+ mentors have relevant perspectives and includes them all (already handled by the edge function — just need to keep calling it)

**In-thread notifications (WhatsApp-style CTAs):**
- Add a new message type `"notification"` to ChatMessage
- Create a `NotificationBubble` component (red accent, mentor icon, CTA text) rendered inline in the thread
- After project creation, schedule a delayed Future Self notification suggesting the user explore a specific angle with another mentor
- These are rendered as special styled bubbles in the thread (not browser notifications)

### C. `src/components/creative-space/CreativeSpace.tsx` — AI keyword suggestions
- After loading keywords and tiles, call a lightweight AI function to suggest which keywords are most relevant to the current project context
- Create a new edge function `suggest-keyword-connectors` that takes the project title, existing tile titles, and available keywords, then returns ranked keyword suggestions with connection rationale
- Display suggested keywords at the top of the keyword section with a "Suggested" badge and a brief reason why they're relevant

### D. New edge function: `supabase/functions/suggest-keyword-connectors/index.ts`
- Accepts: `projectTitle`, `existingTiles[]`, `availableKeywords[]`
- Uses Lovable AI (gemini-3-flash-preview) to rank keywords by relevance and suggest which tiles they could connect to
- Returns: `suggestions: [{ keyword, relevance, connectTo: tileId[], reason }]`

### E. `src/components/console-thread/ChatBubble.tsx` — Notification bubble style
- Add rendering for `messageType === "notification"` — a red/accent-bordered compact card with mentor icon, CTA text, and a subtle action prompt

---

## File Summary

| File | Change |
|------|--------|
| `src/pages/Council.tsx` | Load project name, replace "New Conversation" dynamically |
| `src/pages/ConsoleThread.tsx` | Wider random pacing (5-20s), post-project engagement phase, in-thread notification messages |
| `src/components/console-thread/ChatBubble.tsx` | Add notification bubble rendering |
| `src/components/creative-space/CreativeSpace.tsx` | Call AI keyword suggestion, display ranked suggestions |
| `supabase/functions/suggest-keyword-connectors/index.ts` | New edge function for AI keyword relevance ranking |

