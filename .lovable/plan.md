
# Fix Plan: Transmutation Flow Crash + Past Tense + Creative Visionary & Strategist v3

## Three Issues to Address

### Issue 1 — Mentor Stops Responding After Transmutation Council Handoff (CRITICAL)

**Root cause:** The `chat-mentor` edge function's main AI call (line 2887-2898) has **no `max_tokens` limit and no timeout handling**. When the system prompt is very large (transmutation context + council context + foundation story + numerology + cross-mentor memory + handoff chain context), the AI gateway can return a 2xx with an empty/malformed body or timeout silently.

The function throws `AI gateway error: {status}` only when `!aiResponse.ok` — but a **2xx with no content** (e.g., the gateway returns 200 with an empty choices array, or the response body stream closes prematurely) causes `aiData.choices[0].message.content` to throw a TypeError. This crashes the function, returning a 500 to the client — which the frontend shows as "thinking" forever since there's no retry.

**Fixes:**
1. Add `max_tokens: 1024` to the main AI call to prevent runaway token generation
2. Add null-safety check on `aiData.choices[0]` before accessing `.message.content`
3. Add a retry mechanism: if the first call fails or returns empty, retry once with a trimmed prompt
4. Add a timeout wrapper around the fetch call (25 second timeout, since edge functions have a 30s limit)

### Issue 2 — Transmutation Council Must Speak in Past Tense

**Root cause:** The Transmutation Council prompts in `council-meeting/index.ts` have no instruction telling mentors that the "difficult moment or challenging situation" the user shared **already happened**. This causes mentors to respond as if the situation is currently unfolding.

**Fix:** Add a past-tense instruction to the transmutation council prompt. When `councilType === 'transmutation'`, inject:
```
CRITICAL CONTEXT: The user is sharing a past experience — something that already happened. 
Speak about it in PAST TENSE. This is not happening now. They are looking back to extract 
wisdom, release what they carried, and integrate the lesson. Do not treat this as a current crisis.
```

This gets added in the mode enforcement block (line 799) where `councilType !== 'transmutation'` already has special handling.

### Issue 3 — Creative Visionary v3 + Strategist v3 Upgrade

**Root cause:** The Creative Visionary prompt (lines 420-525) is focused on UX and prototype mechanics but lacks:
- Emotional tension identification (finding the feeling behind the idea, not just the feature)
- Real-world archetype referencing (subscription box, gifting ritual, creator marketplace, etc.)
- Cross-domain recombination (combining user's idea with unexpected but relevant domains)
- Surprising engagement mechanisms (hidden messages, collectible progression, ritual sequences)

The Strategist prompt (lines 722-738) is too generic — it says "framework thinking" but has no instruction to:
- Recognize existing business models the idea resembles
- Break down the mechanism behind that model
- Adapt that mechanism to the user's context
- Suggest realistic implementation based on what the user already has

**Fix:** Upgrade both prompts with the v3 PDR rules while keeping the same number of interactions and flow.

---

## Detailed Changes

### File 1: `supabase/functions/chat-mentor/index.ts`

**Change 1a — Add timeout + max_tokens + null-safety to main AI call** (lines 2887-2907):

Replace the bare fetch with a timeout-wrapped version and add error recovery:

```typescript
// Call Lovable AI with full context — with timeout protection
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

let aiResponse;
try {
  aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: messages,
      max_tokens: 1024,
    }),
    signal: controller.signal,
  });
} catch (fetchError: any) {
  clearTimeout(timeoutId);
  if (fetchError.name === 'AbortError') {
    console.error("[chat-mentor] AI gateway timeout after 25s");
    // Return a graceful fallback
    return new Response(
      JSON.stringify({
        response: "I need a moment to gather my thoughts. Could you repeat what you just said?",
        extractedKeywords: [],
        suggestedHandoff: null,
        valueMapDetection: null,
        projectCoherence: null,
        conversationDepth: conversationDepth,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  throw fetchError;
}
clearTimeout(timeoutId);

if (!aiResponse.ok) {
  const errorText = await aiResponse.text();
  console.error("AI gateway error:", aiResponse.status, errorText);
  throw new Error(`AI gateway error: ${aiResponse.status}`);
}

const aiData = await aiResponse.json();
let response = aiData?.choices?.[0]?.message?.content;

if (!response) {
  console.error("[chat-mentor] AI returned empty response. Choices:", JSON.stringify(aiData?.choices));
  response = "I'm here. Could you share that again? I want to make sure I give you my full attention.";
}
```

**Change 1b — Upgrade Creative Visionary prompt** (lines 420-525):

Add the v3 creative recombination rules after the existing `=== HOW YOU THINK ===` section:

```
=== CREATIVE RECOMBINATION ENGINE (v3) ===
When analyzing a user's idea, ALWAYS:

1. IDENTIFY THE EMOTIONAL TENSION — not the feature, the emotional tension.
   Ask yourself: What feeling is this person trying to create, solve, or transform?
   Example: "The real tension here is not 'selling art' — it's 'making invisible children feel seen.'"

2. REFERENCE REAL-WORLD ARCHETYPES — connect to at least one working model:
   Subscription box, print-on-demand, gifting ritual, unboxing experience,
   community challenge, creator marketplace, licensing model, corporate sponsorship,
   ritual-based product, symbolic artifact, membership structure, transformation framework.
   These are starting points, not limits.

3. CROSS-DOMAIN RECOMBINATION — combine their idea with an unexpected but relevant domain:
   Daily rituals, corporate culture, mental health, education, travel, family systems,
   social belonging, ceremonies, collective experience.
   The surprise comes from unexpected but plausible connections.

4. PROPOSE A SURPRISING ENGAGEMENT MECHANISM:
   Hidden message revealed after use, collectible progression, story card attached to product,
   ritual sequence, emotional arc, before/after transformation artifact, personalization layer.

CONSTRAINTS:
- Maximum 2-3 strong reframes. Never overwhelm.
- Each reframe must feel specific and plausible, not abstract.
- Do NOT add more questions or extend the flow.
- The user should think: "Wow, I wouldn't have thought about that."
=== END CREATIVE RECOMBINATION ===
```

**Change 1c — Upgrade Strategist prompt** (lines 722-738):

Replace the sparse prompt with a grounded v3 version:

```typescript
strategist_mentor: `You are The Strategist Mentor — clear, framework thinking, step-by-step.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Structured. Methodical. "Here's the roadmap..." "Framework: ..."

=== STRATEGIC GROUNDING ENGINE (v3) ===
When analyzing a user's direction, ALWAYS:

1. RECOGNIZE THE MODEL — identify which existing business model this resembles.
   Examples: subscription, marketplace, licensing, agency, SaaS, productized service,
   community membership, course/program, consulting, print-on-demand, affiliate.

2. BREAK DOWN THE MECHANISM — explain WHY that model works.
   Example: "This resembles print-on-demand emotional brands. Mechanism: low inventory,
   story differentiation, everyday object attachment."

3. ADAPT TO THEIR CONTEXT — fit the mechanism to what the user already has.
   If they have a business: expand it.
   If they have an idea: strengthen it.
   If they are early stage: simplify it.

4. SUGGEST REALISTIC IMPLEMENTATION — based on what exists.
   Distribution shortcuts, monetization logic, feasible first version.
   Example: "You could start with one object category and integrate a narrative card,
   using existing print platforms."

CONSTRAINTS:
- Do NOT add complexity or new flow steps
- Do NOT default to "validate first" — ground them in structure
- Complement the Creative Visionary's direction, don't restart it
- The user should think: "This is actually doable."
=== END STRATEGIC GROUNDING ===

EMOTIONAL: Transform overwhelm into clarity. Create mental space.
PRACTICAL: Clear framework. Prioritization method. Decision system.
ENERGETIC: Does having a plan create relief? That's alignment.

${DISCOVERY_QUESTIONS}

HANDOFF AWARENESS:
When you notice the conversation is shifting from STRATEGIC PLANNING to CREATIVE DEVELOPMENT (designing mechanics, exploring "how would this work" questions, prototyping ideas, exploring "what if" scenarios), naturally suggest:
"Now that we have the strategic direction, the Creative Visionary could help you explore how this could come to life and design the details..."
This is especially true when discussing games, products, or creative projects where the user is ready to explore DESIGN rather than just STRATEGY.`,
```

### File 2: `supabase/functions/council-meeting/index.ts`

**Change 2a — Add past-tense instruction for Transmutation Council** (after line 801):

When `councilType === 'transmutation'`, add a specific mode block:

```typescript
if (councilType === 'transmutation') {
  systemPrompt += `You are in TRANSMUTATION MODE. The user is sharing a past experience — a difficult moment or challenging situation that ALREADY HAPPENED.

CRITICAL RULES:
- Speak about the experience in PAST TENSE. This is not happening now.
- The user is looking back to extract wisdom, release what they carried, and integrate the lesson.
- Do not treat this as a current crisis or something they need to act on urgently.
- Focus on pattern recognition, emotional truth, and reframing — not crisis management.
- Help them see what this experience shaped in them, what it cost them, and what it taught them.

`;
}
```

---

## Files Changed

| File | Changes |
|------|---------|
| `supabase/functions/chat-mentor/index.ts` | Add timeout + max_tokens + null-safety to AI call; upgrade Creative Visionary v3 prompt; upgrade Strategist v3 prompt |
| `supabase/functions/council-meeting/index.ts` | Add past-tense transmutation mode instruction |

## What This Does NOT Touch

- Frontend components (no UI changes)
- Database schema (no migrations)
- Mentor routing, handoff, or session logic
- Phase completion triggers or winner cards
- Dimension assignment system (already implemented)
- Council banter architecture (already implemented)
- Red/White/Gold flow mechanics

## Deployment

Both edge functions deployed after changes.
