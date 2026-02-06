
## Goals (what will change)
1. On **/transmutation-council**, the **answer input** (the field where the user replies) will always show:
   - A clear **placeholder**
   - A visible **example block** (so users see examples even if placeholders don’t render well on mobile)
   - A primary action button labeled **“Ask the Transmutation Council”** (instead of “Begin”), and it will be visually obvious.
2. The mentor names **Storybreaker / Phoenix / Stoic** will be displayed **horizontally** (not stacked vertically), both:
   - In the top “mentor badges” row (already horizontal, but we’ll ensure it never collapses into a tall stack)
   - Inside the initiation card (currently rendered as a vertical grid list)

## Why it currently “doesn’t exist” for you
From the current `src/pages/TransmutationCouncil.tsx`:
- The examples text above the input is gated by `messages.length === 0 && !isLoadingState`.
  - If `isLoadingState` stays `true` for any reason (slow auth call, transient backend delay), the example line never appears.
- The button label changes to **Begin** only when `messages.length === 0`, and it is **disabled** until you type something (`disabled={!input.trim()}`), which can feel like “not activated”.
- The initiation card shows mentors in a **vertical `grid`**, which makes “Storybreaker / Phoenix / Stoic” appear stacked and wastes space.

## Implementation (code changes)

### A) Fix the input placeholder + examples + action button (TransmutationCouncil)
**File:** `src/pages/TransmutationCouncil.tsx`

1. **Make the example helper always render (remove `!isLoadingState` gating)**  
   - Show examples based on:
     - `messages.length === 0`
     - `hasCompletedTransmutation` (defaults false while loading; that’s fine—better to show something than nothing)

2. **Use a Textarea (not Input) for better placeholder + multi-line examples**
   - Swap `<Input />` to `<Textarea />` (already used elsewhere in the app and supports multi-line UX better)
   - Keep it 2–4 rows tall (`min-h`, `rows={3}`), non-resizable (`resize-none`), mobile-friendly.

3. **Add an always-visible “Examples” block (not just placeholder)**
   - Under the Textarea (or above it), show 2–3 clickable example chips:
     - Clicking a chip fills the textarea (`setInput(example)`).
   - This ensures examples are visible even if placeholder styling is subtle.

4. **Change the CTA button label when starting**
   - When `messages.length === 0`, button text becomes:
     - **“Ask the Transmutation Council”** (with `Sparkles` icon)
   - When conversation already started, keep the send icon.

5. **Make “button not activated” feel intentional**
   - Keep disabling when empty (to prevent empty submits), but add helper microcopy:
     - If empty: show a tiny hint like “Type a life event (or tap an example) to begin.”

**Outcome:** The user will always see the prompt/examples + the correct CTA label in the exact place they respond.

---

### B) Make Storybreaker / Phoenix / Stoic horizontal (no vertical stacking)
**File:** `src/pages/TransmutationCouncil.tsx`

There are two places to fix:

1. **Top mentor badges row** (already `flex gap-2 flex-wrap`)
   - Keep it horizontal but reduce the chance it becomes tall:
     - Add `overflow-x-auto` + `whitespace-nowrap` + `flex-nowrap` on small screens
     - This makes it a horizontal scroll row on mobile instead of wrapping into many lines.

2. **Initiation card mentor section** (currently a vertical `grid gap-3`)
   - Replace the vertical list with horizontal chips:
     - `div className="flex flex-wrap gap-2"` on desktop
     - `flex-nowrap overflow-x-auto` on mobile
   - Each chip shows: icon + name only (role text removed from this area to avoid height bloat)
   - If you still want roles, we can show them in a compact tooltip/secondary line *below* the chips (optional).

**Outcome:** “Storybreaker / Phoenix / Stoic” stays horizontal, uses minimal vertical space, and matches your intended layout.

---

## Files to change
- `src/pages/TransmutationCouncil.tsx`
  - Input area: switch Input → Textarea, always show examples, rename CTA button
  - Initiation card mentor display: grid → horizontal chips
  - Top mentor row: force horizontal scroll on small screens instead of wrapping

## Testing checklist (what I’ll verify in preview)
1. Navigate to `/transmutation-council` on desktop + mobile widths:
   - See examples immediately without needing any load to finish.
   - See Textarea placeholder and an examples area.
   - See button labeled “Ask the Transmutation Council”.
2. Ensure button submits correctly and conversation flow continues unchanged.
3. Confirm mentor names are horizontal in:
   - Top row
   - Initiation card
4. Confirm no overlap with the fixed bottom input (input remains visible while scrolling).

## Notes / non-goals (kept unchanged)
- No changes to your mentor banter logic, council-meeting logic, or handoff logic.
- No changes to pattern extraction logic.
- This is purely the missing/unclear UI affordances + layout issue you reported.
