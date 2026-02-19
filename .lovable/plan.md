
# Council Differentiation & Living Conversation Architecture — Implementation Plan

## Confirmation: Yes, Project Council is Fully Included

The approved PDR covers all four functions. The user's question confirms: make sure `council-meeting/index.ts` (Project Council) receives the full treatment, not just Inner Self and Builders Team.

---

## Current State (What Exists Today)

### Project Council (`council-meeting/index.ts`)
- Mentor perspectives are generated in a loop with an **identical generic template** for all non-special mentors (lines 971–999). Only Quantum, Creative Visionary, and Strategist have custom prompts.
- The standard template has zero dimension assignment. All mentors get: `"Generate 1-2 sentences ONLY in your unique voice."` — no lens constraint, no differentiation rule.
- The banter prompt (lines 1055–1148) asks mentors to: "Root for the user", "Challenge commitment", "React to the idea". This produces the predictable validation + one challenge cycle.
- Council Insight runs at Q1 and Q3, no guard against repeating banter themes.
- No user name injection.
- No "non-echo-chamber" rules anywhere.

### Builders Team (`builders-team-meeting/index.ts`)
- Uses a single JSON prompt asking all 3 mentors simultaneously. Role names are distinct but the banter instruction says: "Playfully disagreeing or challenging" — still warm and low-friction by default.
- No dimension constraints in the JSON prompt.

### Inner Self Council (`inner-self-council/index.ts`)
- Uses a single JSON prompt for all 5 mentors. Banter instruction: "NOT debating or challenging each other harshly" — intentionally soft. This is appropriate for emotional work but produces uniform warmth.
- No dimension constraints preventing overlap.

### None of the three functions have:**
- `DIMENSION_POOLS` constants
- Dimension assignment logic
- "Living Conversation Architecture" banter rules
- User name injection
- Anti-echo-chamber constraints

---

## What Gets Implemented (All 4 Files)

### File 1: `supabase/functions/council-meeting/index.ts` — Project Council (PRIMARY)

**Change 1a — Add DIMENSION_POOLS constant** (insert after line 66, before `mentorNames`):

```typescript
const DIMENSION_POOLS: Record<string, string[]> = {
  project: [
    'identity — who this person is being in this moment',
    'behavior — what they are actually doing vs. what they say',
    'system — the structural or process gap creating friction',
    'blind_spot — what they cannot see that others can',
    'risk — what could go wrong if this continues',
    'leverage — where one move unlocks the most',
    'market_reality — what the market or people actually want',
    'long_term_consequence — where this leads if nothing changes in 3-5 years',
    'short_term_action — the one concrete thing to move the needle this week',
    'leadership_maturity — what level of thinking or leadership this requires',
    'accountability — who is responsible and what is the honest measure',
    'narrative_distortion — the story they are telling themselves that may not be true',
  ],
};

function assignMentorDimensions(mentors: string[]): Record<string, string> {
  const pool = [...DIMENSION_POOLS.project].sort(() => Math.random() - 0.5);
  const assignments: Record<string, string> = {};
  mentors.forEach((m, i) => {
    assignments[m] = pool[i % pool.length];
  });
  return assignments;
}
```

**Change 1b — Assign dimensions before the mentor loop** (insert after line 754, `const mentorPerspectives: Record<string, string> = {};`):

```typescript
const mentorDimensionMap = assignMentorDimensions(selectedMentors);
const userName = profile?.display_name || null;
const nameInstruction = userName
  ? `The user's name is ${userName}. Use it naturally once if it fits — not in every sentence.`
  : '';
```

**Change 1c — Update the standard mentor template** (lines 975–999, the `else` block):

Replace the generic prompt with a dimension-locked version:

```typescript
systemPrompt = `You are ${mentorNames[mentorType]}.

PERSONALITY: ${mentorConfig.personality}
ROLE: ${mentorConfig.role}
${conversationContext}

CURRENT Question: "${question}"
Question phase: ${isQ1 ? 'Q1 Discovery' : isQ2 ? 'Q2 Depth' : 'Q3 Momentum'}
Hidden tags: ${extractedTags.join(', ')}
${nameInstruction}

YOUR ASSIGNED DIMENSION FOR THIS ROUND: ${mentorDimensionMap[mentorType]}
You must respond EXCLUSIVELY through this lens.
Do not give emotional validation if your dimension is 'risk' or 'system'.
Do not give strategy if your dimension is 'emotional_root'.
Do not repeat what another mentor would say — your job is to bring something structurally different.

CRITICAL:
- Build upon what the user has already shared
- Reference their specific goals, ideas, or problems by name
- Do NOT ask about things they already told you
- Show you've been paying attention throughout the conversation

Generate 1-2 sentences ONLY through your assigned dimension lens.
Strong personality. Sharp. Clear. No fluff.
Just your perspective, no labels or format.

${KEYWORD_HIGHLIGHTING_RULES}`;
```

**Change 1d — Rewrite the banter prompt** (lines 1055–1148) to implement Living Conversation Architecture:

Replace the entire banter prompt content with:

```
Generate authentic advisory room conversation between these mentors.
They are NOT a motivational panel. They are a real team with different minds, 
occasionally disagreeing, building on each other — not just validating.

EACH MENTOR'S DIMENSION FOR THIS ROUND (they must stay in their lane):
${selectedMentors.map(m => `- ${mentorNames[m]}: ${mentorDimensionMap[m]}`).join('\n')}

THE USER'S QUESTION: "${question}"
${userName ? `THE USER'S NAME: ${userName}` : ''}

LIVING CONVERSATION RULES:
1. Mentors refer to the user by name if known — naturally, once
2. At least ONE mentor must challenge or push back on what another mentor said
3. At least ONE mentor must express genuine belief in the user
4. At least ONE line must connect to concrete action or consequence
5. Each line must come from a DIFFERENT dimensional lens — no two mentors make the same type of comment
6. No generic praise. No "this is exciting." Only specific, earned responses to what the user actually shared
7. Mentors may express skepticism, disagreement, or confidence — not just support

EXAMPLE DYNAMIC (when user says "I want to start a meditation app"):
[Business Mentor — market_reality]: "Anxiety apps are crowded. What's going to make this one worth switching to?"
[Heart Mentor — emotional_root]: "Wait — is this about the app or the fact that they struggled themselves and want to help?"
[Discipline Mentor — behavior]: "I'm watching whether they actually meditate daily. You can't teach what you don't live."
[Quantum Inventor — identity]: "The frequency of someone building to heal others is completely different from building to make money. Which is it?"
[Creative Visionary — short_term_action]: "Stop debating the market. Build one guided session. Share it with 5 people this week."

Format: [Name]: "quote" (10-20 words per line)
Generate ${banterLength === 'SHORT' ? '3-4' : banterLength === 'MEDIUM' ? '5-6' : '7-9'} lines.
```

**Change 1e — Update Council Insight prompt** (around lines 688–708) to prevent repeating banter themes:

Add to the insight prompt:
```
IMPORTANT: Do NOT repeat any theme already covered in the mentor perspectives or banter.
The Council Insight must add something NEW — a synthesis, a north star, or an observation 
that none of the individual mentors captured.
${isQ1 ? 'Q1: Show the Council sees the person, not just the idea. 1-2 observational sentences.' : ''}
${isQ3 ? 'Q3: Name what has shifted or clarified across the full conversation. Point toward the north star.' : ''}
```

---

### File 2: `supabase/functions/builders-team-meeting/index.ts` — Builders Team

**Change 2a — Add dimension constraints to the JSON prompt** (lines 275–316):

Update the perspectives instruction:

```
2. **mentorPerspectives**: Each builder's unique take — they must NOT overlap in lens:
   - design_thinking_mentor: DIMENSION = experiment_design — the fastest way to test this idea. Push for speed, prototypes, learning. May challenge the others if they're overthinking.
   - ux_mentor: DIMENSION = user_emotional_journey — how will the end user feel at each stage? If design_thinking is rushing, push back: "Speed doesn't matter if the emotional journey is wrong."
   - gamification_mentor: DIMENSION = engagement_mechanics — what keeps people coming back? Find the bridge between the other two when they disagree.
```

**Change 2b — Update banter instruction** (lines 284–288):

Replace: `"Playfully disagreeing or challenging"` with:

```
3. **banterLines**: 3-4 lines from a real design meeting where people have opinions.
   - Design Thinking might push for speed: "We're overthinking this. Build it."
   - UX might push back: "But if the emotional journey is wrong, speed doesn't matter."
   - Gamification finds the bridge: "Make the first interaction a 30-second win, then build from there."
   At least one line must reference the user's specific situation, not generic design advice.
   Disagreement is healthy. Construction, not harmony.
```

---

### File 3: `supabase/functions/inner-self-council/index.ts` — Inner Self Council

**Change 3a — Add fixed dimension assignment per mentor** into the system prompt (after the 5 mentors block, around line 162):

```
=== DIMENSION LOCK ===
Each mentor responds from ONLY their assigned dimension. There must be no overlap:
- Alignment Mentor → self_reflection: what feels true vs forced right now
- Perspective Mentor → meaning_making: the broader context and what this is teaching
- Inner Clarity Mentor → psychological_pattern: the repeating dynamic being activated
- Quantum Mentor → internal_state_reading: the identity shift or energetic possibility available
- Release Mentor → emotional_root: the feeling underneath that wants to be felt first

Do not let two mentors occupy the same emotional territory in the same response.
```

**Change 3b — Update banter instruction** (lines 226–229):

Replace: `"NOT debating or challenging each other harshly"` with:

```
3. **banterLines**: 3-4 lines from wise observers who see different truths simultaneously.
   This is NOT group therapy where everyone validates.
   
   Example dynamic (user says they keep avoiding something):
   [Inner Clarity]: "This avoidance — how old is it? It doesn't feel new."
   [Release]: "There's something underneath that needs to be felt before it can be released."
   [Alignment]: "Part of them already knows what to do. That's what makes the avoidance so exhausting."
   [Perspective]: "Avoidance is protection. Worth asking: what is it still protecting them from?"
   
   They see the user with care. But they are not a cheering section. Each brings a distinct observation.
```

---

### File 4: `supabase/functions/chat-mentor/index.ts` — 1-on-1 Mentor Sessions

**Add to `HUMAN_CONVERSATION_RULES`** (after line 19):

```
LENGTH RULE BY CONTEXT:
- In GROUP COUNCIL (perspectives and banter): length is acceptable. Depth matters.
- In 1-to-1 sessions (this context): be direct, short, clear. Maximum 4-5 sentences per response.
- In Transmutation/emotional processing stages: even shorter. 2-3 sentences. Let the silence work.
- NEVER pad. NEVER repeat what you just said in different words. Say it once, clearly.
```

---

## What Does NOT Change

- Frontend components (zero UI changes)
- Database schema (no migrations)
- Mentor routing, handoff, or session logic
- Red/White/Gold phase completion triggers
- Winner card logic
- Council type detection (project / transmutation / inner_self / builders)
- The emotional reflection step in Project Council (it stays; it just no longer repeats banter themes)

---

## Deployment

All 4 edge functions deployed simultaneously after changes are applied.
