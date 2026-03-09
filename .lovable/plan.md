

## Creator Profile & Direct Connection System

This is a multi-part feature that adds creator profiles, chat requests, and creator-to-creator messaging integrated into the existing Console (Chats) sidebar.

---

### Database Changes (3 new tables)

**1. `creator_chat_requests`** — stores connection/chat requests between creators
- `id`, `sender_id` (uuid, references profiles), `receiver_id` (uuid, references profiles), `message` (text, nullable), `status` (text: pending/accepted/declined), `created_at`, `updated_at`
- RLS: users can read requests where they are sender or receiver; insert where they are sender; update where they are receiver

**2. `creator_chats`** — stores accepted chat threads
- `id`, `user1_id`, `user2_id`, `created_at`
- RLS: users can read chats where they are user1 or user2

**3. `creator_chat_messages`** — individual messages in creator chats
- `id`, `chat_id` (references creator_chats), `sender_id`, `content` (text), `is_system` (boolean, default false), `created_at`
- RLS: users can read/insert messages for chats they belong to
- Enable realtime on this table

---

### New Pages & Components

**1. Creator Profile Page** — `src/pages/CreatorProfile.tsx`
- Route: `/creators/:creatorId` (for seed posts, use seed ID; for real posts, use user ID)
- Layout: name, location, type tag at top, then "What I'm creating" section with statement, goal, next step
- "Creator posts" section listing all posts by this creator
- Two buttons at top: **Connect** and **Start Chat**
- For seed creators (demo data), show the data from `SEED_POSTS`; for real users, fetch from `creator_posts` + `profiles`

**2. Start Chat Modal** — `src/components/creators/StartChatModal.tsx`
- Dialog with title "Start a conversation with {name}"
- Textarea (placeholder: "Write a short message to introduce yourself..."), 200 char limit
- Send Request / Cancel buttons
- On submit: insert into `creator_chat_requests`

**3. Chat Request Notification** — `src/components/creators/ChatRequestCard.tsx`
- Shows sender name, message preview, Accept/Decline buttons
- Accept: creates `creator_chats` entry + system message, updates request status
- Decline: updates request status

**4. Creator Chat View** — `src/components/creators/CreatorChatView.tsx`
- Simple message thread (similar to existing Chat page but lightweight)
- Shows messages chronologically, text input at bottom
- First message is auto-generated system message: "You connected through Creators."

---

### Integration Points

**Creator name becomes clickable** in:
- `SeedPostCard.tsx` — wrap name in a link to `/creators/seed-{id}`
- `CreatorPostCard.tsx` — wrap name in a link to `/creators/{user_id}`
- Comment "Connect" buttons also navigate to profile

**Console (Chats) sidebar** in `Council.tsx`:
- Add a "Creator Connections" section below the mentor list
- Query `creator_chats` for the current user
- Each entry shows: `{CreatorName} — Creator connection`
- Clicking opens `CreatorChatView` embedded in the right panel (new view type in the URL params, e.g., `view=creator-chat-{chatId}`)

**Notification badge**:
- Query pending `creator_chat_requests` where `receiver_id = currentUser`
- Show count badge on Console tab in bottom navigation
- Show requests at top of sidebar in a collapsible "Requests" area

---

### Route Addition

- Add `/creators/:creatorId` route in `App.tsx` pointing to `CreatorProfile.tsx`

---

### Seed Data Handling

Since the 10 demo creators are not real users, the profile page will detect `seed-*` IDs and render from the `SEED_POSTS` constant (exported from `CreatorsWall.tsx`). The Connect/Start Chat buttons will show a toast: "This is a demo creator — sign up to connect with real creators!" For real user posts, full functionality applies.

---

### Technical Notes

- Creator chat uses its own tables separate from mentor chats to keep concerns separated
- The `creator_chat_messages` table gets realtime enabled for live messaging
- All new tables have RLS policies scoped to authenticated users who are participants
- No changes to existing mentor/council chat infrastructure

