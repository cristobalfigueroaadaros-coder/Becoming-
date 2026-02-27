

# Fix: Embed Console Thread INTO the Council Page

## Problem
The `ConsoleThread` was built as a **standalone page** at `/console-thread`. It is NOT integrated into the Council page. When users tap the Council button, they see the old `CouncilMeetingPage` — not the continuous thread. The thread needs to be a conversation entry inside the Council sidebar, just like "Project Council" or any mentor chat.

## Changes

### 1. Database: Create `console_thread_messages` table
Persist all thread messages so users can return to the conversation.
```sql
CREATE TABLE console_thread_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL, -- 'user', 'mentor', 'system'
  content text NOT NULL DEFAULT '',
  mentor_type text,
  mentor_name text,
  mentor_icon text,
  mentor_color text,
  card_type text, -- 'council_reveal', 'project_creation', null
  card_data jsonb,
  phase text, -- which phase this message was part of
  created_at timestamptz DEFAULT now()
);
ALTER TABLE console_thread_messages ENABLE ROW LEVEL SECURITY;
-- RLS: users can only access their own messages
CREATE POLICY "Users can manage own thread messages" ON console_thread_messages FOR ALL USING (auth.uid() = user_id);
```

Also add `console_thread_phase` text column to `profiles` to persist the current phase state.

### 2. `src/pages/ConsoleThread.tsx` — Add `embedded` prop
- Add `embedded?: boolean` prop (like `CouncilMeetingPage` and `ChatPage` already have)
- When `embedded=true`: remove the header, remove `h-screen`, adapt to fill parent container
- On init: load existing messages from `console_thread_messages` + restore phase from `profiles.console_thread_phase`
- On every message add: save to `console_thread_messages`
- On phase change: save to `profiles.console_thread_phase`
- Remove redirect to dashboard when intake completed — the thread should always be accessible for scrollback

### 3. `src/pages/Council.tsx` — Add "New Conversation" entry in sidebar
- Add a new sidebar entry **above** "Project Council" labeled "New Conversation" (or the project name once created)
- When `console_intake_completed` is false, auto-select this entry and show a notification badge
- When selected (`view=intake`), render `<ConsoleThread embedded />` in the content area instead of `CouncilMeetingPage`
- Query `profiles` for `console_intake_completed` and `console_thread_phase` to determine badge/label

### 4. Routing cleanup
- `/console-thread` route in `App.tsx`: redirect to `/council?view=intake`
- `IntakeNotification.tsx`: navigate to `/council?view=intake` instead of `/console-thread`
- `BottomNavigation.tsx`: badge logic stays the same, but tapping Council auto-opens the intake thread

### 5. Council Reveal ordering (already correct in ConsoleThread logic)
The `ConsoleThread` already shows council reveal AFTER the 3 intake questions. No change needed — just needs to actually render.

## Files

| File | Change |
|------|--------|
| Migration SQL | Create `console_thread_messages` table + add `console_thread_phase` to profiles |
| `src/pages/ConsoleThread.tsx` | Add `embedded` prop, persist messages to DB, restore on load |
| `src/pages/Council.tsx` | Add "New Conversation" sidebar entry, render ConsoleThread when selected |
| `src/components/console-thread/IntakeNotification.tsx` | Navigate to `/council?view=intake` |
| `src/App.tsx` | Redirect `/console-thread` → `/council?view=intake` |

