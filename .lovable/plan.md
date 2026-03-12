

## Two Fixes: Disable Future Self Whisper Pop-up + Fix Keywords in Creative Space

### Issue 1: Future Self Whisper Notification Appearing on Dashboard

The pink "Private Whisper" notification appears every time the user visits the Dashboard because `useMentorWhisper` loads the latest unread whisper and the Dashboard automatically shows it. When the user dismisses it, it marks as read, but the next generated whisper will pop up again.

**Fix**: Remove the whisper notification from the Dashboard entirely. The user has asked for this popup to not appear. The Future Self guidance channel should remain through the chat, not a floating popup on the home screen.

**File: `src/pages/Dashboard.tsx`**
- Remove the `MentorWhisperNotification` import
- Remove `showWhisperNotification` state
- Remove the `useEffect` that triggers `showWhisperNotification`
- Remove the whisper notification JSX block (lines 295-308)
- Keep `useMentorWhisper` hook if other parts use it, or remove if only used for the popup

### Issue 2: Keywords Not Showing in Creative Space

The network request to `user_keywords` returns an empty array `[]`. The user genuinely has zero keywords in the database. Keywords are only inserted in two places:
1. `Chat.tsx` — extracted from mentor chat AI responses (bold keywords)
2. `KeywordHighlighter.tsx` — manual text selection by user

The council meeting flow (`ConsoleThread.tsx`) extracts `extractedTags` but **never writes them to `user_keywords`**. So users who go through the council flow and don't do separate mentor chats will never have keywords.

**Fix**: After the council meeting completes in `ConsoleThread.tsx`, extract the `extractedTags` and bold keywords from mentor perspectives, then insert them into `user_keywords`. This bridges the gap between council meetings and the Creative Space keyword library.

**File: `src/pages/ConsoleThread.tsx`**
- In the council meeting response handler (where `councilData` is received), extract:
  - `extractedTags` from the response
  - Bold keywords from mentor perspectives using `extractKeywordsFromText` 
- Insert unique keywords into `user_keywords` table with source `"council"`
- This is a non-blocking background operation (no UI changes needed)

### Files to Edit
- `src/pages/Dashboard.tsx` — Remove whisper notification popup
- `src/pages/ConsoleThread.tsx` — Add keyword extraction from council meeting responses into `user_keywords`

