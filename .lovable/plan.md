

## What's happening today vs. what you're asking for

**Where Builder Team conversations go right now:**
- Each meeting saves mentor perspectives into `design_thinking_content` (under `empathize` + `ideate` phases, as a `builderTeamInsights` array)
- Visible only inside the Design Thinking Lab phase view
- **Zero connection to `project_structure`** — your blocks/activities never see this content

**What you're feeling is correct:** valuable insights are being captured but they're not flowing into the actual execution structure (blocks + activities) of your project. The Builder Team is a parallel silo.

---

## Proposed: Builder Team → Project Structure Sync

A new edge function `sync-builder-insights-to-structure` runs after each Builder Team round. It reads the latest mentor perspectives + the current `project_structure` and decides one of three actions per insight:

```text
   Builder Team round ends
            │
            ▼
   ┌────────────────────┐
   │ AI classifies each │
   │ insight vs blocks  │
   └────────┬───────────┘
            │
   ┌────────┼────────────────┐
   ▼        ▼                ▼
ENRICH   ADD_ACTIVITY    NEW_BLOCK
existing  to existing    (only if truly
block     block          new territory)
```

### Classification rules
- **ENRICH** — insight refines/clarifies an existing block's intent → appended to block's notes
- **ADD_ACTIVITY** — insight is a concrete action that fits an existing block → added as a new activity (with `source: "builder_team"` tag)
- **NEW_BLOCK** — insight opens a clearly different work area not covered by any current block → suggested as a new block (max 1 per round, requires user confirm)

### UX surface
1. **Subtle "Builder Team contributed" badge** appears on blocks/activities that came from a meeting (small lime dot — Builder Team's color)
2. **Pending suggestions panel** in Project Structure: "Builder Team suggested 2 activities and 1 new block — Review" → user accepts/rejects each
3. Activities auto-added are marked `pending_review: true` so they're visible but distinguishable until you confirm

### Where the change lives
- **New:** `supabase/functions/sync-builder-insights-to-structure/index.ts`
- **Modified:** `src/pages/BuilderTeamThread.tsx` — invoke the sync function after `saveDesignThinkingInsights` in both `runBuilderTeamMeeting` and `handleFollowupReply`
- **Modified:** `src/components/project-engine/ProjectStructure.tsx` — render pending suggestions banner + source badges
- **Migration:** add `pending_review` and `source` fields to structure node JSON shape (no schema change needed, it's already JSON)

### Guardrails
- Max 3 activity suggestions per round (respects Surface Simplification rule)
- Max 1 new block suggestion per round, only when insight clearly doesn't map
- Never auto-deletes or modifies user-created blocks
- All AI-suggested items require explicit user confirmation before becoming "active"

### Out of scope (deferred)
- Retroactive sync of past Builder Team conversations (we can do this separately if you want)
- Auto-syncing other chats (Project Chat, individual mentors) — same pattern can extend later

<lov-actions>
<lov-suggestion message="Approved — build the Builder Team to Project Structure sync as planned.">Approve and build it</lov-suggestion>
<lov-suggestion message="Also retroactively sync my existing Builder Team conversations into the project structure.">Include retroactive sync</lov-suggestion>
<lov-suggestion message="Extend the same sync pattern to Project Chat and individual mentor conversations too.">Extend to all chats</lov-suggestion>
</lov-actions>
