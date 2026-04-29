## 🧭 Analysis: Where Journey Is Today vs Where It Needs To Go

### Current state

- `**JourneyPanel.tsx**` is a hardcoded 4-stage map (Atlas → Council → Projects → Creators) with **rule-based answers** (`getQuickAnswer`, `getNextAction`).
- It only knows *which onboarding stage* the user is in. It does **not** know:
  - Which Atlas clusters are weak/strong
  - Which mentor would unblock the user *right now*
  - Which design thinking phase the project is stuck in
  - Which block/activity is overdue
  - What inner pattern is interfering
- It's separate from `voice-of-system` edge function (which already does deep contextual analysis but only outputs **mentor handoffs**).
- The "ask" input does keyword matching — not real intelligence.

### What you want — confirmed understanding

Journey becomes the **always-available, intelligent compass** that:

1. Knows the user's *complete* state (Atlas dots, mentors talked to, project phase, blocks, patterns, days since action)
2. Uses **Cris's Map as the reference model** — sees what clusters/dimensions a "complete" journey looks like and identifies gaps in the user's
3. Recommends the *single most useful next move* across **any** surface:
  - "Do the **Childhood Signals** quest — you have strong Skills but no roots"
  - "Talk to **The Heart Mentor** — you've been looping on the same problem for 4 days"
  - "Move your project from Define → Ideate — you've been stuck on Define for 6 days"
  - "Complete activity *Validate Pricing* in Block 2 — it's blocking your next milestone"
  - "Do a **Transmutation** on the pattern you wrote about yesterday"
4. Offers proactive suggestions on open (not just on ask) — like "Voice of System" but persistent.

---

## 🏗️ Implementation Plan

### Phase 1 — Backend Intelligence: extend `voice-of-system` into `journey-compass`

Create a new edge function `**supabase/functions/journey-compass/index.ts**` (do not break existing `voice-of-system`; the modal still uses it).

**Inputs:** `userInput` (optional — if omitted, returns proactive suggestion), `mode: 'ask' | 'proactive'`.

**Context aggregation (parallel queries):**

- Profile + entry_state + console_intake_completed
- Atlas clusters (with dot counts per slug) + recent quest completions
- Active project + current_phase + days_since_last_action
- Design thinking phases for that project (which phase has fewest notes / is stale)
- Project blocks + activities (overdue / pending / blocking)
- Recent mentors talked to (last 14 days, count per mentor_type) — to detect *under-used* mentors
- Inner patterns (active, untransmuted)
- Recent Future Self / Voice handoffs (avoid repeating recommendations)

**Cris's Map reference embedded in the prompt** as the "destination shape":

> A complete journey has presence across: Life Events, Passions, Skills, Aha Moments, Natural Talents, Childhood Signals, Experiments, People I Admire, Who I Serve, External Reflections, Personal Frustrations, How I Create Impact, Visions for a Better World, Values, Ideal Life. Gold connections form between Frustrations↔Visions, Aha Moments↔Who I Serve, Experiments↔Life Events, Childhood Signals↔Natural Talents.

The AI compares the user's current cluster distribution to Cris's reference and identifies the **most leverage-producing gap**.

**Structured output (tool calling, not JSON-in-text):**

```ts
{
  primarySuggestion: {
    surface: 'atlas_quest' | 'mentor' | 'design_thinking' | 'project_block' | 'transmutation' | 'becoming' | 'creators',
    targetId: string,           // cluster slug, mentor_type, phase name, block_id, etc.
    title: string,              // "Explore your Childhood Signals"
    why: string,                // 1-2 sentences referencing their actual data
    leverageInsight: string,    // "This will give your mentors a missing dimension"
    ctaLabel: string,
    handoffContext: string      // for the surface to use
  },
  alternativeSuggestions: [     // 2 more options (different surfaces) so user has agency
    { surface, targetId, title, why, ctaLabel } x 2
  ],
  stateSummary: string          // "You've built strong Skills (8) and Passions (5), but no Childhood Signals or Frustrations yet. Your project Define phase is 6 days stale."
}
```

Use `google/gemini-2.5-flash` with **tool calling** (not JSON-in-text) for reliability — fixes the `JSON.parse` brittleness in current `voice-of-system`.

### Phase 2 — Frontend Hook: `useJourneyCompass`

New hook `**src/hooks/useJourneyCompass.tsx**`:

- `getProactiveSuggestion()` — fires on panel open (cached 10 min in React Query)
- `askCompass(question: string)` — fires when user types
- `executeSuggestion(suggestion)` — handles routing across all surfaces:
  - `atlas_quest` → `/atlas?startQuest={slug}`
  - `mentor` → creates handoff record (like `useVoiceOfSystem.executeHandoff`) → `/chat/{mentor_type}`
  - `design_thinking` → `/creation-lab?dtPhase={phase}`
  - `project_block` → `/creation-lab?focusBlock={block_id}`
  - `transmutation` → `/creation-lab?bmode=transmutation&pattern={id}`
  - `becoming` → `/creation-lab?bmode=becoming`
  - `creators` → `/creators`

### Phase 3 — Refactor `JourneyPanel.tsx`

Keep the existing 4-stage visual track (it's good orientation). **Add a new top section above the stage track**:

```
┌────────────────────────────────────────┐
│ 🧭 Your next move                       │
│                                         │
│ [Compass icon + glow]                   │
│ "You've mapped 8 skills but no          │
│  Childhood Signals. The thread that     │
│  started it all is still missing."      │
│                                         │
│ → [Explore Childhood Signals]  (primary)│
│                                         │
│ Or: • Talk to Heart Mentor              │
│     • Define your project's problem     │
└────────────────────────────────────────┘
```

- Loads proactive suggestion on panel open
- Shows `stateSummary` as the orientation line
- Primary CTA = `executeSuggestion(primarySuggestion)`
- 2 alt suggestions as small chips below
- Existing chat input now calls `askCompass()` (real AI) instead of `getQuickAnswer()` (regex)
- Keep the 4-stage track underneath as the macro view

### Phase 4 — Smart pulse trigger

Replace the dot-count-based pulse with a server-side "is there a fresh suggestion?" indicator:

- Pulse when: project phase stale >5 days, OR mentor not talked to in 7+ days who is recommended, OR new pattern detected, OR Atlas gap is significant.
- Stored in `localStorage` keyed by suggestion hash so same suggestion doesn't re-pulse.

---

## 📁 Files

**Create**

- `supabase/functions/journey-compass/index.ts` — new AI compass function with cross-domain awareness
- `src/hooks/useJourneyCompass.tsx` — fetch + execute suggestions
- `src/components/layout/JourneyCompassCard.tsx` — the new top-of-panel suggestion card

**Modify**

- `src/components/layout/JourneyPanel.tsx` — mount `<JourneyCompassCard />`, wire ask input to AI, replace pulse logic
- `supabase/config.toml` — register new function (verify_jwt = true so we get the user)

**Untouched**

- `voice-of-system` (still used by the standalone `VoiceOfSystemModal`)
- All 4 stage definitions and the visual track
- All routing pages (we just navigate with new query params they already support)

---

## ✅ Success criteria

- Open Journey from anywhere → see a context-aware suggestion in <1s after AI returns
- Suggestion references **specific** user data (cluster name, project name, days, mentor name)
- At least 6 different surfaces can be recommended (quest, mentor, DT phase, block, transmutation, creators)
- Asking "what should I do" returns an AI-generated answer, not a regex match
- Pulse only fires when there's something genuinely new
- Existing 4-stage map still works exactly as today

## ⚠️ Open question before building

Want me to also **auto-trigger** a proactive Journey notification (toast or pulse) when the user has been **idle on a stale phase >5 days** without opening Journey? Or keep Journey strictly pull-based (user must open it)?  yes, also trigger notification or the bipping when the system suggest the user to do X action 