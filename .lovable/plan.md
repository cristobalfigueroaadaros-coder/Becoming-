

# Console Thread: Mentor Colors, Save Button, Perspectives Quality, Banter Visual, Follow-up Question

## Root Causes

### 1. Mentor colors NOT rendering
`ChatBubble.tsx` line 66 does `message.mentorColor.replace("bg-", "border-")` — e.g. `bg-orange-500` → `border-orange-500`. But Tailwind purges dynamic classes. The border color never applies. **Fix**: Use inline `style={{ borderLeftColor: ... }}` with a hex color map, or pass hex colors directly.

### 2. No Save button on perspectives/banter
`ChatBubble` doesn't render `InsightActionButton`. Need to add it for mentor messages (not user, not cards).

### 3. Perspectives are questions, not statements
The `council-meeting` edge function prompt says "1-2 sentences" but doesn't explicitly forbid questions. Some mentors (Challenger, Problem Mentor) have question-heavy personalities. **Fix**: Add `NEVER ask questions. Provide statements, reflections, or guidance only.` to the perspective prompt.

### 4. Perspectives not connected to intake answers
`runCouncilMeeting()` (line 338) sends `question: intakeAnswers[2]` (only the 3rd answer about what they're building) and `conversationHistory: []` (empty!). The edge function never sees Q1 (background) or Q2 (story). **Fix**: Send all 3 intake answers as context + pass full messages as conversationHistory.

### 5. No visual difference between perspectives and banter
Both use the same `ChatBubble` layout. Banter should look like a WhatsApp group chat — smaller bubbles, zig-zag layout (alternating left alignment), no avatar repetition. **Fix**: Add a `messageType` field to `ChatMessage` and render banter bubbles differently.

### 6. Follow-up question disconnected
The `clarityQuestion` from the edge function doesn't receive the full conversation context. Same root cause as #4 — empty `conversationHistory`.

## Changes

### `src/components/console-thread/ChatBubble.tsx`
- Add `messageType?: 'perspective' | 'banter' | 'standard'` to `ChatMessage`
- Use inline `style` for border-left color (hex) instead of dynamic Tailwind classes
- Add `InsightActionButton` below mentor text bubbles (not cards, not user)
- Render banter messages differently: smaller text, no avatar, zig-zag alternating alignment, compact spacing
- Import `InsightActionButton`

### `src/pages/ConsoleThread.tsx`
- `runCouncilMeeting()`: Send full intake context as the question (all 3 answers combined) + send messages as conversationHistory
- Add `messageType` to perspective messages and banter messages
- Add mentor hex color map and pass hex colors to ChatBubble for inline styling
- `addSystemMessage`: accept optional `messageType` parameter

### `supabase/functions/council-meeting/index.ts`
- Add to ALL mentor perspective prompts: `"You MUST provide statements, reflections, or guidance. NEVER ask questions. No question marks."`
- Update the follow-up question prompt to include the user's full intake context (background, story, idea) so it connects to the conversation

## Files

| File | Change |
|------|--------|
| `src/components/console-thread/ChatBubble.tsx` | Inline hex colors, Save button, banter zig-zag layout |
| `src/pages/ConsoleThread.tsx` | Pass full intake context to council-meeting, add messageType to messages, hex color map |
| `supabase/functions/council-meeting/index.ts` | No-questions rule in perspective prompts, intake context in follow-up question |

