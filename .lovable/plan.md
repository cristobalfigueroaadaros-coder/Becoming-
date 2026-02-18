
# Fix Plan: Red Phase Win Card Trigger + Gold Phase Superpower Flow + Completion Signal Reliability

## Summary of Issues Found

After reading the codebase thoroughly, here are the 5 distinct problems:

---

### Problem 1 — Red Phase Win Card NOT Triggering After "Let's Go"

**Root cause:** The `completionSignals` array (lines 2725–2764 in `chat-mentor/index.ts`) does **not** contain any phrases specific to the Release Mentor's Red Phase closing message.

The Release Mentor ends with:
> "Say 'let's go' to proceed to the Gold Phase."

But the `completionSignals` list has entries like `'gold phase'`, `'next phase'`, `'you are ready'`, etc. — these are all tuned for **Gold Phase (Stoic)** language, not the Red Phase closing.

**The check logic works like this:**
1. User says "let's go" → matches `phaseConfirmationPhrases` ✅
2. System checks if the **previous assistant message** contains a `completionSignal` → ❌ the last Release Mentor message says things like "You've decided what you're done carrying. Time for gold. 🔥" — but the **actual closing phrase** from the Release Mentor persona is: *"Say 'let's go' to proceed to the Gold Phase."* — and `'proceed to the gold phase'` is not in the signals list.

So `hasCompletionSignal = false`, and the fallback fires only if `conversationDepth >= 3 AND isShortMessage`. "Let's go" is 2 words → qualifies as short. But the depth check might fail if the conversation went quickly.

**Fix:** Add Red Phase-specific completion signals to the list:
```
'proceed to the gold phase',
'you are ready for the next phase',
'ready for the next phase',
'decided what you are done carrying',
'done carrying',
'no longer carrying',
'time for gold',
'gold phase is next',
```

Also lower the depth threshold for `release_mentor` further — set it to **2** (currently 3, same as Stoic). Red Phase is by design short (3 direct questions).

---

### Problem 2 — Red Phase Question Mismatch Between Card and Chat

**Root cause:** The `TransmutationNodeEditModal.tsx` and `RedPhaseWinCard.tsx` show the label `"Pattern You're Done Repeating"` (matching the old question "What are you ready to stop carrying?"), but the actual mentor now asks **"What part of this pattern are you tired of repeating?"**

This is a labeling inconsistency, not a functional bug, but it confuses users.

**Fix:** Update the `release_burden` label in:
- `TransmutationNodeEditModal.tsx`: input placeholder + label
- `RedPhaseWinCard.tsx`: section title label

Also update `TransmutationPhaseModal.tsx` — its Red Phase context block still shows slightly different question phrasing.

---

### Problem 3 — Gold Phase: Superpowers Show Inside Chat Instead of as Notification

**Current behavior:** When the Gold Phase completes in the mentor chat (`Chat.tsx`), the system:
1. Returns `transmutationPhaseComplete` object with gold data
2. Navigates back to `PatternMap` via `navigate(returnPath, { state: { transmutationComplete: ... } })`
3. `PatternMap` detects the Gold completion, calls `extractSuperpowers()`, then shows `TransmutationCelebration` which **displays superpowers inside the celebration card** directly

**Desired behavior:** Gold phase closing message in chat should invite user to unlock superpowers. User says "yes" or "let's go" → triggers **Gold Phase Win Card** (which is actually `TransmutationCelebration`). After confirming, instead of showing superpowers in the card, navigate to Superpower Map with a toast notification saying "Your superpowers are waiting — discover them."

**Fix plan:**

1. **In `TransmutationCelebration.tsx`:** Remove the "Superpowers Unlocked" section (lines 144–170) that shows `sp.name/icon` badges inside the card. Replace the "Save Gold Insight" button with "Discover Your Superpowers →" which navigates to `/superpower-map`.

2. **Add a "new superpowers" notification badge** to the Superpower Map — when the user lands there after transmutation, show a pulsing notification or toast: "You've unlocked new superpowers from [Pattern Name]. Scroll down to discover them."

3. **In `PatternMap.tsx`:** After `extractSuperpowers()` completes on Gold return, still show `TransmutationCelebration` but without displaying the superpowers. Button navigates to `/superpower-map`.

4. **In `Chat.tsx`:** The Gold closing message from the Stoic Mentor already says "say 'let's go' to unlock your superpowers." This is correct. No change needed here — the navigate back to PatternMap still triggers the celebration card.

---

### Problem 4 — Council Insight Repetition / Predictability

**Current behavior:** The council context is injected into the system prompt every single time, causing the mentor to repeatedly reference the same council insight even when it's not relevant.

**Root cause:** In `chat-mentor/index.ts` lines 2506–2534, the council context is added unconditionally to the system prompt when `privateMessage.council_meetings` exists (and there's no handoff).

**Fix:** Add a guard: only inject council context if `conversationDepth === 0` (the very first message in a session) AND the `message` is not a transmutation confirmation phrase. This prevents the council insight from bleeding into every subsequent message.

Additionally, update the council context instruction from "Continue this conversation naturally" to "If this council insight feels relevant to what the user just raised, you may briefly reference it. If not, let it go and respond to what they actually said."

---

### Problem 5 — "Let's Go" After Red Phase Triggers Gold Phase Marker, Not Red

**Potential issue:** When user says "let's go" after Release Mentor says "Say 'let's go' to proceed to the Gold Phase," the extraction prompt correctly maps `release_mentor → 'red'` (line 2779: `mentorType === 'release_mentor' ? 'red'`). This mapping is **correct** already.

However, the closing message returned by the system for Red phase is:
> `"The release is done. You've decided what you're no longer carrying. Time for gold. 🔥"`

This message is shown in the chat AND the `transmutationPhaseComplete` fires. But `Chat.tsx` only handles `phase === 'red'` by navigating back to PatternMap with the extracted data — which then triggers `setShowRedWinCard(true)`. This flow is **correct**.

The real bug is Problem 1 above: `hasCompletionSignal` returns false, so the whole block never fires.

---

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/chat-mentor/index.ts` | Add Red Phase completion signals; lower `release_mentor` depth threshold to 2; fix council context injection guard |
| `src/components/transmutation-map/TransmutationCelebration.tsx` | Remove inline superpower badges display; change "Save Gold Insight" button to "Discover Your Superpowers" navigating to `/superpower-map` |
| `src/components/transmutation-map/RedPhaseWinCard.tsx` | Update label from "Pattern You're Done Repeating" to match question wording |
| `src/pages/SuperpowerMap.tsx` | Add detection for "just unlocked" state (via location.state or toast) and show a welcome notification |
| `src/pages/PatternMap.tsx` | On Gold celebration confirm, navigate to `/superpower-map` instead of staying on page |

---

## Detailed Changes

### `supabase/functions/chat-mentor/index.ts`

**Change 1 — Add Red Phase completion signals** (after line 2764):
```typescript
// Red Phase (Release Mentor) specific signals
'proceed to the gold phase',
'ready for the next phase',
'decided what you are done carrying',
'done carrying',
'no longer carrying',
'time for gold',
'gold phase is next',
'you are ready for the next phase',
```

**Change 2 — Lower depth threshold for release_mentor** (line 2771):
```typescript
// BEFORE:
const goldPhaseMinDepth = (mentorType === 'stoic_mentor' || mentorType === 'release_mentor') ? 3 : 6;

// AFTER:
const goldPhaseMinDepth = mentorType === 'stoic_mentor' ? 3 : mentorType === 'release_mentor' ? 2 : 6;
```

**Change 3 — Council context injection guard** (around line 2508):
```typescript
// BEFORE:
if (!handoffContext && privateMessage?.council_meetings ...) {

// AFTER:
if (!handoffContext && conversationDepth === 0 && privateMessage?.council_meetings ...) {
```
And update the injection instruction to make the council context optional/situational rather than mandatory.

### `src/components/transmutation-map/TransmutationCelebration.tsx`

Remove the superpowers badges section (lines 144–170). Replace the two action buttons with a single prominent one:
```tsx
<Button onClick={() => navigate('/superpower-map')} ...>
  Discover Your Superpowers ⚡
</Button>
```
Keep the "View in Lifetime Map" as a secondary text link below it.

### `src/pages/SuperpowerMap.tsx`

Add a `useEffect` that checks `location.state?.fromTransmutation` and shows a toast:
```typescript
useEffect(() => {
  if (location.state?.fromTransmutation) {
    toast.success("New superpowers unlocked! Scroll to discover them.");
    window.history.replaceState({}, document.title);
  }
}, []);
```

### `src/pages/PatternMap.tsx`

In `handleCelebrationSaveGold` (line 336–340), pass the state flag:
```typescript
navigate('/superpower-map', { state: { fromTransmutation: true } });
```

### `src/components/transmutation-map/RedPhaseWinCard.tsx`

Update line 88: change label from `"Pattern You're Done Repeating"` to `"What You're Tired of Repeating"` to better match the exact question.

---

## What This Does NOT Touch
- White Phase logic (working)
- Storybreaker / Pattern card trigger (working)
- Gold Phase data extraction (working)
- Database schema (no changes needed)
- The navigation flow from Chat → PatternMap (working correctly)
- The `isTransmutationSession` detection (working)
