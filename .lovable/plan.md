

# Fix Plan: Broken Flow, Project Creation Error, Mentor Quality, and Capability Map Layout

## Issues Found

### 1. Naming Card Not Triggering During Council Perspectives
**Root cause**: The `council-meeting` edge function does NOT return `projectCoherence` — only `chat-mentor` does. When the Strategist proposes a name during council perspectives (e.g., "The Gift Compass"), the `handleUserReply` function calls `council-meeting`, which has no coherence detection. The naming card only triggers in `handleMentor1to1` (which calls `chat-mentor`).

**Fix**: After the 2nd round perspectives in `handleUserReply`, if no `projectCoherence` is detected from council-meeting, run a lightweight check through `chat-mentor` with the strategist to detect if a project name was proposed and agreed upon. Alternatively, add project coherence detection directly to the `council-meeting` edge function — extracting proposed names from the perspectives text and checking user agreement.

### 2. "Start Building" Error — `Failed to create daily steps`
**Root cause**: The `integrator_daily_steps.phase_id` column is `NOT NULL`. When the AI generates a step with a `phase` name that doesn't match any created phase (e.g., typo or mismatch between AI-generated phase names and step phase references), `phaseMap.get(step.phase)` returns `undefined`, causing the insert to fail with a null constraint violation.

**Fix**: In `integrator-setup/index.ts`, add a fallback for `phase_id`: if `phaseMap.get(step.phase)` returns `undefined`, assign the step to the first available phase. Also add error logging to show which phase name failed.

### 3. Creative Mentor Repetitiveness
**Root cause**: The Creative Visionary prompt is detailed but lacks a **diversity enforcement rule**. The "Creative Recombination Engine" section always follows the same pattern: "I see an entire ecosystem/universe... app, real-world projects, mentor networks... Build the simplest version... test with X people."

**Fix**: Add an anti-repetition rule to the creative_visionary prompt:
- "NEVER repeat structural patterns from previous messages"
- "If you previously suggested 'build X and test with Y people,' use a completely different format"
- "Vary: sometimes propose a single experiment, sometimes a framework, sometimes a constraint-based challenge"
- "Each response must feel structurally different from the last"

### 4. Marketing Mentor Not Talking About Marketing
**Root cause**: The marketing_mentor prompt is extremely thin (only 4 lines of personality guidance). It lacks specific instructions about what marketing topics to cover (distribution, positioning, audience building, go-to-market). Without this, the AI defaults to general business advice, often overlapping with the Business Mentor's financial risk framing.

**Fix**: Expand the marketing_mentor prompt with:
- Specific marketing domains: positioning, distribution channels, audience building, content strategy, go-to-market, storytelling, brand narrative
- Anti-overlap rule: "You are NOT the Business Mentor. Never discuss profitability, financial risk, or monetization strategy. Focus exclusively on how to reach people, tell the story, and build visibility."
- Practical marketing actions: "Your suggestions should always be about reaching real humans — posting, messaging, creating content, testing hooks, finding distribution."

### 5. Capability Map Missing Avatar-Centered Orbital Layout
**Root cause**: The current `CapabilityMapTab.tsx` uses a simple list layout with an avatar at the top and grouped cards below. It doesn't match the Superpower Map's radial/orbital visual where nodes orbit around a center.

**Fix**: Rebuild the visual section to use an orbital/radial layout:
- Center: User avatar with a glowing ring
- Orbiting nodes: Capabilities positioned in a circular arrangement around the avatar using CSS transforms (similar to how the Superpower Map works)
- Each node shows: icon, name, level dots, and a glow intensity based on activation count
- Keep the grouped sections below as a detail view, but the hero section should be the orbital visualization

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/ConsoleThread.tsx` | Add project coherence detection after 2nd round council perspectives |
| `supabase/functions/integrator-setup/index.ts` | Add phase_id fallback for mismatched AI phase names |
| `supabase/functions/chat-mentor/index.ts` | Expand marketing_mentor prompt; add anti-repetition rules to creative_visionary |
| `src/components/momentum/CapabilityMapTab.tsx` | Add orbital/radial visual layout for capabilities around avatar |

