import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// === REFLECTION LOOP DETECTION (Action Engine) ===
const REFLECTION_SIGNALS = ['feel', 'think', 'wonder', 'maybe', 'not sure', 'confused', 'uncertain', 'should i', 'what if', 'i dont know', 'i guess', 'possibly', 'perhaps'];
const ACTION_SIGNALS = ['build', 'create', 'test', 'offer', 'share', 'launch', 'start', 'do', 'make', 'try', 'prototype', 'reach out', 'message', 'post', 'publish', 'sell', 'call', 'email', 'talk to'];

// Count reflection signals in message
function countReflectionSignals(message: string): { reflectionCount: number; actionCount: number } {
  const lowerMessage = message.toLowerCase();
  const reflectionCount = REFLECTION_SIGNALS.filter(signal => lowerMessage.includes(signal)).length;
  const actionCount = ACTION_SIGNALS.filter(signal => lowerMessage.includes(signal)).length;
  return { reflectionCount, actionCount };
}

// Check if conversation is stuck in reflection loop
function detectReflectionLoop(conversationHistory: any[]): boolean {
  const userMessages = conversationHistory
    .filter((msg: any) => msg && msg.role === 'user')
    .slice(-3);
  if (userMessages.length < 3) return false;
  
  let consecutiveReflective = 0;
  for (const msg of userMessages) {
    const { reflectionCount, actionCount } = countReflectionSignals(msg.content || '');
    // If more reflection signals than action signals, count as reflective
    if (reflectionCount > 0 && actionCount === 0) {
      consecutiveReflective++;
    } else {
      consecutiveReflective = 0; // Reset if action-oriented
    }
  }
  
  return consecutiveReflective >= 3;
}

// MANDATORY MENTORS - Dynamic based on council type
// Default for standard councils, Transmutation gets different mentors
function getMandatoryMentors(councilType: string): string[] {
  if (councilType === 'transmutation') {
    return ['problem_mentor', 'perspective_mentor'];
  }
  return ['creative_visionary', 'strategist_mentor'];
}

// Global keyword highlighting rules - add to all AI prompts
const KEYWORD_HIGHLIGHTING_RULES = `
=== KEYWORD HIGHLIGHTING RULES (ALWAYS APPLY) ===
1. Highlight 1-3 important concepts per message using **bold** markdown
2. ONLY highlight meaningful concepts:
   - Purpose themes (e.g., **clarity**, **impact**, **legacy**)
   - Fears (e.g., **rejection**, **failure**, **visibility**)
   - Bottlenecks (e.g., **consistency**, **perfectionism**, **overthinking**)
   - Values (e.g., **authenticity**, **freedom**, **connection**)
   - Action drivers (e.g., **momentum**, **accountability**, **focus**)
   - Strategic insights (e.g., **viral potential**, **positioning**, **leverage**)
3. DO NOT highlight more than 3 words per message
4. Keywords must be contextual and directly relevant to what the user said
5. Example: "Your block right now is **consistency**."
6. Example: "This idea has strong **viral potential**."
=== END RULES ===
`;

// === COUNCIL DIFFERENTIATION: DIMENSION POOLS ===
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
  transmutation: [
    'emotional_truth — what emotion is the user actually carrying',
    'identity_impact — how this shaped who they became',
    'protective_pattern — what this behavior was trying to protect',
    'hidden_cost — what staying in this pattern costs them',
    'grief_or_loss — what was lost or mourned in this experience',
    'strength_gained — what resilience or skill emerged from this',
    'narrative_shift — the story they told themselves vs what actually happened',
    'attachment — what they were holding onto and why',
    'permission — what they haven\'t given themselves permission to feel or do',
    'integration — how this experience connects to their larger life arc',
  ],
};

// Transmutation tone guardrails — injected into all transmutation prompts
const TRANSMUTATION_TONE_RULES = `
TRANSMUTATION TONE RULES (MANDATORY):
- This is emotional processing, NOT a strategy session.
- FORBIDDEN WORDS (never use in any form): product, market, leverage, audience, scaling, positioning, value proposition, profitable, revenue, SaaS, framework, system, tool, business model, competitive, monetize, client, customer, offer, pricing, launch, MVP, funnel, conversion, growth hack.
- Stay in: emotion, identity, grief, attachment, protection, courage, loss, meaning, wound, strength, integration.
- Speak as if holding space for someone processing a life-defining moment.
- Maximum 1-2 sentences. Warm. Grounded. Human.
`;

function assignMentorDimensions(mentors: string[], councilType: string = 'default'): Record<string, string> {
  const poolKey = councilType === 'transmutation' ? 'transmutation' : 'project';
  const pool = [...DIMENSION_POOLS[poolKey]].sort(() => Math.random() - 0.5);
  const assignments: Record<string, string> = {};
  mentors.forEach((m, i) => {
    assignments[m] = pool[i % pool.length];
  });
  return assignments;
}

// 12+ mentor system with updated personalities
const mentorNames: Record<string, string> = {
  discipline_mentor: "Discipline Mentor",
  strategist_mentor: "Strategist Mentor",
  creative_visionary: "Creative Visionary",
  quantum_inventor: "Quantum Inventor",
  mystic_mentor: "Mystic Mentor",
  business_mentor: "Business Mentor",
  marketing_mentor: "Marketing Mentor",
  scientific_mentor: "Scientific Mentor",
  heart_mentor: "Heart Mentor",
  ancient_sage: "Ancient Sage",
  alignment_mentor: "Alignment Mentor",
  oracle_mother: "Oracle Mother",
  future_self: "Future Self",

  // Transmutation mentors
  storybreaker_mentor: "Storybreaker",
  phoenix_mentor: "Phoenix",
  stoic_mentor: "Stoic",

  // New mentors from PDR expansion
  perspective_mentor: "Perspective Mentor",
  challenger_mentor: "Challenger Mentor",
  design_thinking_mentor: "Design Thinking Mentor",
  ux_mentor: "UX Mentor",
  gamification_mentor: "Gamification Mentor",
  // Clarity & Understanding mentors
  problem_mentor: "Problem Mentor",
  inner_clarity_mentor: "Inner Clarity Mentor",
  release_mentor: "Release Mentor",
};

const mentorPrompts: Record<string, { personality: string; role: string; flaw: string }> = {
  discipline_mentor: {
    personality: "Direct, intense, disciplined. Tough love. 'Stay locked in' 'Fall in love with the work'",
    role: "Structure, consistency, commitment. Calls out excuses.",
    flaw: "Too harsh, can push too hard, sometimes dismisses the need for rest or emotional processing"
  },
  strategist_mentor: {
    personality: "Calm, analytical, structured. Frameworks and clarity. 'Here's the roadmap...'",
    role: "Clarity, prioritization, shape. Brings structure to chaos.",
    flaw: "Over-analyzes, can get stuck in planning mode, sometimes misses the emotional reality"
  },
  creative_visionary: {
    personality: "Imaginative, playful, warm. Varies their approach - sometimes asks 'What if...', sometimes observes 'I notice...', sometimes shares 'Here's a wild thought...'. Uses the user's OWN words and context, never generic templates. Each response feels fresh and unique.",
    role: "Playful, imaginative expansion. Opens new creative possibilities. NEVER repeat the same opening or structure twice. Ground big dreams in ONE specific, doable first step.",
    flaw: "Too scattered, jumps between ideas, can be unrealistic about execution and timelines"
  },
  quantum_inventor: {
    personality: "Mystic-scientist. Tesla + Dispenza. Speaks in frequency, resonance, field. 1-2 sentences MAX. Cosmic transmissions, not lectures.",
    role: "Highlights frequency shifts. Sees creations as energetic signatures.",
    flaw: "Too cosmic, skips practical steps, can ignore real-world constraints"
  },
  mystic_mentor: {
    personality: "Mysterious, poetic, transcendent. 'The universe whispers...' 'Your soul knows...'",
    role: "Poetic, soul, inner truth. Connects to spiritual insight.",
    flaw: "Too vague, avoids concrete answers, can use spirituality to bypass real problems"
  },
  business_mentor: {
    personality: "Sharp, strategic, results-focused. Uses plain language like 'What's the payoff?' 'Who's paying for this?' 'Here's the play...' NEVER uses jargon or acronyms (no ROI, KPIs, metrics). Explains concepts simply.",
    role: "Value creation, feasibility, execution logic. Turns ideas into products people actually want. Asks 'Who benefits?' and 'How does this make money or impact?'",
    flaw: "Too focused on results, misses emotional nuance, can reduce everything to numbers"
  },
  marketing_mentor: {
    personality: "Energetic, bold, passionate. 'Let's make this viral' 'Your message matters'",
    role: "Virality, messaging, emotional hooks. Storytelling and distribution.",
    flaw: "Too focused on attention, can prioritize virality over substance, sometimes manipulative"
  },
  scientific_mentor: {
    personality: "Precise, careful, factual. 'The research shows...' 'Let's look at the data...'",
    role: "Data, neuroscience, reasoning. Evidence-based methods.",
    flaw: "Too rigid, dismisses intuition, can get paralyzed waiting for perfect evidence"
  },
  heart_mentor: {
    personality: "Vulnerable, authentic, relationship-focused. 'What does your heart say?' Warm and empathetic.",
    role: "Emotional truth, connection, softness. Reveals relationship truths.",
    flaw: "Too soft, avoids hard truths, can enable emotional avoidance in the name of gentleness"
  },
  ancient_sage: {
    personality: "Calm, grounded, timeless. 'Breathe first...' 'In time, all becomes clear...'",
    role: "Generational wisdom, patience, long-term perspective.",
    flaw: "Too passive, can use patience as excuse for inaction, sometimes dismisses urgency"
  },
  alignment_mentor: {
    personality: "Warm, grounding, psychologically aware. 'Where do all parts of you agree?'",
    role: "Inner coherence, truth. Resolves inner conflict.",
    flaw: "Too focused on internal harmony, can delay action waiting for perfect alignment"
  },
  oracle_mother: {
    personality: "Nurturing, warm, validating. 'I see you' 'It makes sense that...'",
    role: "Nurturing, intuitive. Validates feelings and offers empathy.",
    flaw: "Too validating, can avoid necessary challenges, sometimes enables victim mentality"
  },
  future_self: {
    personality: "Wise, confident, loving. Speaks from 10 years ahead. 'I remember when...'",
    role: "Long-term vision, reassurance, perspective from achieved future.",
    flaw: "Too idealistic, can minimize current struggle, sometimes dismisses present difficulty"
  },

  // Transmutation mentors
  storybreaker_mentor: {
    personality: "Clear-eyed, precise, story-cleansing. Separates facts from interpretation. Calm but firm. Asks 1 sharp question when needed.",
    role: "Narrative cleansing: identifies the old story, the loop, the belief, and what it was protecting.",
    flaw: "Can feel clinical if the user needs emotional holding first"
  },
  phoenix_mentor: {
    personality: "Warm, validating, distilling. Holds emotional weight safely, then extracts the lesson without forcing positivity.",
    role: "Wisdom extraction: helps the user find the shift, the lesson, and the life skill emerging from pain.",
    flaw: "Can move to meaning too quickly if the user is still in raw emotion"
  },
  stoic_mentor: {
    personality: "Grounded, practical, reality-based. Calm strength. Sorts controllable vs uncontrollable. Ends with one doable next step.",
    role: "Action and integration: turns insight into perspective, boundaries, and a brave step forward.",
    flaw: "Can feel blunt if the user is seeking empathy more than direction"
  },

  // New mentors from PDR expansion
  perspective_mentor: {
    personality: "Calm, explanatory, reflective. 'Let me show you the full landscape...' 'Here's how this connects...'",
    role: "Big picture context. Decomposes ideas into systems, components, and scenarios. Helps see the forest before choosing a tree.",
    flaw: "Can get lost in context, may not push toward action, sometimes overwhelming with too much information"
  },
  challenger_mentor: {
    personality: "Direct, curious, respectful. 'What makes you so sure?' 'Let's test that assumption...'",
    role: "Exposes assumptions, weak logic, and limiting beliefs. Strengthens thinking through questioning.",
    flaw: "Can feel confrontational, may challenge at wrong moments, sometimes too focused on finding flaws"
  },
  design_thinking_mentor: {
    personality: "Encouraging, energetic, supportive. 'Let's try something...' 'What if we tested...'",
    role: "Turns uncertainty into experiments. Emotionally supports feedback and learning. Primary mentor for daily tasks.",
    flaw: "Too focused on experimentation, may not consolidate learning, can encourage too many parallel tests"
  },
  ux_mentor: {
    personality: "Calm, attentive, grounded. 'How do you want them to feel?' 'What's the emotional peak?'",
    role: "Designs emotional journeys through transitions, peaks, and personalization. Always considers end-user experience.",
    flaw: "Can over-focus on feelings, may miss functional requirements, sometimes too abstract about emotions"
  },
  gamification_mentor: {
    personality: "Creative, confident, grounded. 'What keeps people coming back?' 'Let's add a progression system...'",
    role: "Designs mechanics and progression systems that sustain engagement. Uses game examples to explain patterns.",
    flaw: "Can make everything a game, may over-engineer mechanics, sometimes prioritizes engagement over meaning"
  },
  // Clarity & Understanding mentors
  problem_mentor: {
    personality: "Analytical, curious, methodical. 'Let's break this down...' 'What's the real problem here?'",
    role: "Problem analysis and decomposition. Helps identify root causes vs symptoms. Structures complex issues into solvable pieces.",
    flaw: "Can over-analyze, may miss emotional components, sometimes gets stuck in problem-finding mode"
  },
  inner_clarity_mentor: {
    personality: "Gentle, observant, Jungian. 'What pattern do you notice here?' 'What part of you is speaking right now?'",
    role: "Identifies patterns, inner conflict, subconscious tension, and parts of self that may be in opposition.",
    flaw: "Can be too introspective, may slow down action, sometimes sees patterns that aren't there"
  },
  release_mentor: {
    personality: "Grounded, compassionate, surrendered. Based on David R. Hawkins 'Letting Go' method. 'What are you holding that's ready to be released?'",
    role: "Guides emotional surrender and letting go. Helps users stop resisting and allow emotions to pass naturally.",
    flaw: "Can be too passive, may avoid necessary confrontation, sometimes enables spiritual bypassing"
  }
};

// Mentor colors for WhatsApp-style banter bubbles
const mentorColors: Record<string, string> = {
  discipline_mentor: "#DC2626",
  strategist_mentor: "#2563EB",
  creative_visionary: "#EC4899",
  quantum_inventor: "#8B5CF6",
  mystic_mentor: "#7C3AED",
  business_mentor: "#059669",
  marketing_mentor: "#F59E0B",
  scientific_mentor: "#0891B2",
  heart_mentor: "#DB2777",
  ancient_sage: "#65A30D",
  alignment_mentor: "#0D9488",
  oracle_mother: "#BE185D",
  future_self: "#6366F1",

  // Transmutation mentors
  storybreaker_mentor: "#F43F5E", // rose-500
  phoenix_mentor: "#F97316", // orange-500
  stoic_mentor: "#57534E", // stone-600

  // New mentors from PDR expansion
  perspective_mentor: "#0EA5E9", // sky-500
  challenger_mentor: "#DC2626", // red-600
  design_thinking_mentor: "#84CC16", // lime-500
  ux_mentor: "#D946EF", // fuchsia-500
  gamification_mentor: "#EAB308", // yellow-500
  // Clarity & Understanding mentors
  problem_mentor: "#475569", // slate-600
  inner_clarity_mentor: "#4F46E5", // indigo-600
  release_mentor: "#0D9488", // teal-600
};

// Format conversation history for AI context
function formatConversationHistory(history: any[]): string {
  if (!history || history.length === 0) return "";
  
  let formatted = "\n\n=== PREVIOUS CONVERSATION (You MUST reference this) ===\n";
  
  for (const entry of history) {
    if (entry.role === 'user') {
      formatted += `\nUSER SAID: "${entry.content}"\n`;
    } else if (entry.role === 'council' && entry.content) {
      // Include key insights from council response
      if (entry.content.councilInsight) {
        formatted += `COUNCIL RESPONDED: "${entry.content.councilInsight}"\n`;
      }
      // Include what mentors said
      if (entry.content.mentorPerspectives) {
        const perspectives = Object.entries(entry.content.mentorPerspectives)
          .map(([mentor, text]) => `${mentorNames[mentor as string]}: ${text}`)
          .join('\n');
        formatted += `MENTOR INSIGHTS:\n${perspectives}\n`;
      }
    }
  }
  
  formatted += "\n=== END PREVIOUS CONVERSATION ===\n";
  formatted += "\nIMPORTANT: Build upon what the user has already shared. Do NOT ask questions about things they already told you!\n";
  
  return formatted;
}

// Smart mentor selection based on question relevance
function selectRelevantMentors(allMentors: string[], tags: string[]): string[] {
  // Define mentor expertise areas
  const mentorExpertise: Record<string, string[]> = {
    scientific_mentor: ["data", "research", "evidence", "science", "study", "analysis", "logic"],
    creative_visionary: ["creativity", "creative", "imagine", "design", "art", "beautiful", "innovation"],
    quantum_inventor: ["frequency", "energy", "vibe", "feeling", "resonance", "transformation"],
    ancient_sage: ["long_term", "future", "years", "legacy", "lasting", "sustainable", "wisdom"],
    heart_mentor: ["emotional_safety", "safe", "trust", "comfortable", "relationships", "feelings"],
    business_mentor: ["structure", "plan", "organize", "system", "framework", "execution", "ROI"],
    marketing_mentor: ["virality", "viral", "explosive", "massive", "spread", "attention", "distribution"],
    mystic_mentor: ["purpose", "meaning", "why", "mission", "calling", "spiritual", "soul"],
    strategist_mentor: ["clarity", "clear", "direction", "plan", "organize", "prioritization"],
    discipline_mentor: ["discipline", "consistency", "daily", "routine", "habit", "practice"],
    alignment_mentor: ["intention", "want", "desire", "hope", "wish", "coherence", "alignment"],
    oracle_mother: ["emotional_safety", "nurturing", "support", "validation", "empathy"],
    future_self: ["long_term", "future", "vision", "evolution", "transformation"],
  };

  // Score each mentor based on tag matches
  const mentorScores = allMentors.map(mentor => {
    const expertise = mentorExpertise[mentor] || [];
    const score = tags.reduce((acc, tag) => {
      return acc + (expertise.includes(tag) ? 1 : 0);
    }, 0);
    return { mentor, score };
  });

  // Sort by relevance score (highest first)
  mentorScores.sort((a, b) => b.score - a.score);

  // Take top 6 mentors
  const topMentors = mentorScores.slice(0, 6).map(m => m.mentor);
  
  // If no mentors scored, just take the first 6
  if (mentorScores.every(m => m.score === 0)) {
    return allMentors.slice(0, 6);
  }

  return topMentors;
}

// Invisible keyword engine (user never sees these tags)
const hiddenKeywords = {
  digital: ['online', 'digital', 'internet', 'platform', 'app', 'website', 'tech'],
  distribution: ['reach', 'audience', 'spread', 'share', 'viral', 'growth'],
  experience: ['experience', 'feel', 'journey', 'immersive', 'transformation'],
  emotional_safety: ['safe', 'trust', 'comfortable', 'protected', 'secure'],
  discipline: ['consistency', 'daily', 'routine', 'habit', 'practice'],
  structure: ['plan', 'organize', 'system', 'framework', 'method'],
  frequency: ['energy', 'vibe', 'feeling', 'frequency', 'resonance'],
  virality: ['viral', 'explosive', 'massive', 'spread', 'attention'],
  creativity: ['creative', 'imagine', 'design', 'art', 'beautiful'],
  long_term: ['future', 'years', 'legacy', 'lasting', 'sustainable'],
  data: ['data', 'research', 'evidence', 'science', 'study'],
  identity: ['who', 'identity', 'self', 'am i', 'me'],
  clarity: ['clear', 'clarity', 'understand', 'direction', 'purpose'],
  overwhelm: ['overwhelm', 'too much', "can't", 'stuck', 'buried'],
  purpose: ['purpose', 'meaning', 'why', 'mission', 'calling'],
  intention: ['intention', 'want', 'desire', 'hope', 'wish'],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      question,
      mentorTypes,
      conversationHistory = [],
      notificationContext,
      openerType,
      generateOpenerOnly = false,
      councilType = 'default',
      sprintReviewContext,
      entryState = null,
      atlasSignals = null,
    } = await req.json();

    // Defensive: conversationHistory is user-provided and can contain null/undefined
    const safeConversationHistory = Array.isArray(conversationHistory)
      ? conversationHistory
          .filter((m) => m && typeof m === "object")
          .filter((m) => (m as any).role && (m as any).content)
      : [];

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Get profile for context
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // Fetch Life Domains for silent context
    let lifeDomainContext = "";
    try {
      const { data: lifeDomains } = await supabaseClient
        .from("life_domains")
        .select("domain_name, current_score, future_score")
        .eq("user_id", user.id);
      if (lifeDomains && lifeDomains.length > 0) {
        const domainLines = lifeDomains.map((d: any) => `- ${d.domain_name}: ${d.current_score}/10 → ${d.future_score}/10`).join("\n");
        lifeDomainContext = `
=== LIFE DOMAINS (CONTEXT ONLY — DO NOT ASK ABOUT) ===
${domainLines}

Life Domains are context only. Use them to personalize synthesis and prioritization.
Do not ask follow-up questions about Life Domains unless the user explicitly references them.
=== END LIFE DOMAINS ===
`;
      }
    } catch (e) {
      console.log("Life domains fetch failed (non-fatal):", e);
    }

    // === GENERATE OPENER ONLY MODE ===
    if (generateOpenerOnly && notificationContext) {
      console.log("Generating personalized council opener...", { openerType, notificationContext });
      
      // Get active project if any
      const { data: activeProject } = await supabaseClient
        .from("integrator_projects")
        .select("project_title, project_description")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const foundationSummary = profile?.user_foundation_summary || {};
      
      let openerPrompt = `You are the Council - a group of caring mentors who genuinely know and care about this person.

${profile?.user_foundation_story ? `
=== WHO THEY ARE ===
Name: ${profile.display_name || 'Unknown'}
Background: ${foundationSummary.background || 'Not specified'}
Struggles: ${foundationSummary.struggles?.join(', ') || 'Not specified'}
Aspirations: ${foundationSummary.aspirations?.join(', ') || 'Not specified'}
===
` : ''}

`;

      if (openerType === "sprint_review" && notificationContext.sprintReviewContext) {
        const ctx = notificationContext.sprintReviewContext;
        const completionPct = Math.round((ctx.completionRate || 0) * 100) / 100;
        openerPrompt += `
The user just completed their weekly sprint review and is ready to reflect and plan next week. Here's what happened:
- Momentum Score: ${ctx.momentumScore}/100
- Completion Rate: ${completionPct}%
- Active Days: ${ctx.activeDays}/7
- Biggest Win: ${ctx.biggestWin || 'not shared'}
- Main Friction: ${ctx.frictionType || 'not shared'}
- Direction Confidence: ${ctx.directionConfidence}/10
- Streak: ${ctx.streak} week(s) in a row
${ctx.topWins?.length ? `- Top Wins: ${ctx.topWins.slice(0, 2).join(', ')}` : ''}

Generate a warm, energizing opening message (2-3 sentences) that:
- Acknowledges their commitment to showing up (reference streak if > 1, otherwise just this week)
- Picks ONE specific detail from their week (a win, friction, or score) and reflects it back
- Invites them to go deeper — opens the door to exploring what worked, what didn't, and what's next
- Feels like the Future Self welcoming them back to the council, not a report summary

Example tone: "You showed up again — and that matters more than the score. I noticed [specific win/friction]. Before we plan next week, tell me: what actually moved you this week, underneath the tasks?"

Keep it under 3 sentences. No bullet points. Speak directly to them.`;
      } else if (openerType === "breakthrough_followup" && notificationContext.breakthrough_title) {
        openerPrompt += `
The user recently had a breakthrough: "${notificationContext.breakthrough_title}"
${notificationContext.breakthrough_description ? `Details: "${notificationContext.breakthrough_description}"` : ''}

Generate a warm, personal opening message (2-3 sentences) that:
- Shows you remember and care about their breakthrough
- Asks how it's evolving or what's shifted since then
- Feels like a caring mentor checking in, not an AI

Example tone: "I've been thinking about your insight on [breakthrough]. What's alive for you now - has anything shifted?"`;
      } else if (activeProject) {
        openerPrompt += `
The user is working on a project: "${activeProject.project_title}"
${activeProject.project_description ? `Description: "${activeProject.project_description}"` : ''}

Generate a warm, personal opening message (2-3 sentences) that:
- Shows you remember their project and care about their progress
- Asks how it's going or what part feels most alive right now
- Feels like a caring mentor checking in, not an AI

Example tone: "How's [project name] coming along? I'm curious - what part of it feels most exciting right now?"`;
      } else {
        openerPrompt += `
Generate a warm, personal opening message (2-3 sentences) that:
- Checks in on how THEY are doing (the person, not just their work)
- Feels authentic and caring, like a mentor who genuinely knows them
- Opens space for whatever is on their mind

Example tone: "Before we dive into anything - how are YOU today? Not the projects, not the goals... you."`;
      }

      openerPrompt += `

CRITICAL: Be warm and human. No corporate speak. Reference specific details you know about them.
Just the message, no labels or quotes.`;

      const openerResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: openerPrompt }],
        }),
      });

      if (openerResponse.ok) {
        const openerData = await openerResponse.json();
        const councilOpener = openerData.choices[0].message.content;
        
        return new Response(
          JSON.stringify({ councilOpener }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ councilOpener: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // (safeConversationHistory is sanitized above)
    const questionNumber = safeConversationHistory.filter((msg: any) => msg.role === 'user').length + 1;
    const isQ1 = questionNumber === 1;
    const isQ2 = questionNumber >= 2; // Q2 is now the FINAL round (max 2 questions)
    const isQ3 = questionNumber >= 2; // Alias: Q2 acts as Q3 for guidance/mentor/DM
    
    console.log(`Council Meeting - Q${questionNumber}: ${question.substring(0, 50)}...`);

    // === DETECT REFLECTION LOOP (Action Engine) ===
    const isStuckInReflection = detectReflectionLoop(safeConversationHistory);
    let strategistInterruption = "";
    
    if (isStuckInReflection) {
      console.log("REFLECTION LOOP DETECTED - Strategist will interrupt");
      strategistInterruption = `
IMPORTANT CONTEXT: The user has been in a reflective loop for 3+ consecutive messages without mentioning action.
You MUST inject a direct, action-focused interruption. Ask: "What are you going to BUILD or TEST this week?"
Be direct but caring. Acknowledge their reflection, then push toward creation.`;
    }

    // === EXTRACT HIDDEN KEYWORDS (Invisible to user) ===
    const lowerQuestion = question.toLowerCase();
    const extractedTags: string[] = [];
    
    for (const [tag, keywords] of Object.entries(hiddenKeywords)) {
      if (keywords.some(k => lowerQuestion.includes(k))) {
        extractedTags.push(tag);
      }
    }
    
    console.log('Extracted hidden tags:', extractedTags);

    // Profile already fetched above, no need to re-fetch

    // Get active project for context in perspectives and handoff
    const { data: activeProject } = await supabaseClient
      .from("integrator_projects")
      .select("project_title, project_description")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: futureProgress } = await supabaseClient
      .from("future_self_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // === BUILD NUMEROLOGY SIGNALS CONTEXT (Hidden from user) ===
    const numerologySignals = profile?.numerology_signals as any;
    const numerologyContext = numerologySignals ? `
=== PATTERN SIGNALS (Hidden Context - Use to personalize pacing and approach) ===
Execution Rhythm: ${numerologySignals.executionRhythm || 'steady'}
Pressure Tolerance: ${numerologySignals.pressureTolerance || 'medium'}
Structure Preference: ${numerologySignals.structurePreference || 'balanced'}
Preferred Mentor First: ${numerologySignals.preferredMentorFirst || 'strategist'}
Anti-Overthinking Rule: ${numerologySignals.antiOverthinkingRule || 'Move within 48 hours'}
Avoidance Pattern: ${numerologySignals.avoidancePattern || 'Not specified'}
Ideal First Win: ${numerologySignals.idealFirstWinStyle || 'Quick visible result'}
===
Use these signals to adjust:
- Response pacing (fast/steady/reflective rhythm)
- Pressure level in challenges
- Structure vs freedom in suggestions
- Which mentor to suggest for 1-to-1 follow-up
NEVER mention numerology or these signals to the user.
=== END SIGNALS ===
` : '';

    // === BUILD USER FOUNDATION CONTEXT ===
    const foundationSummary = profile?.user_foundation_summary || {};
    const userFoundationContext = profile?.user_foundation_story ? `
=== USER'S FOUNDATION STORY (Use this to personalize ALL responses) ===
Who they are: ${foundationSummary.who_they_are || 'Not specified'}
Background: ${foundationSummary.background || 'Not specified'}
Struggles: ${foundationSummary.struggles?.join(', ') || 'Not specified'}
Aspirations: ${foundationSummary.aspirations?.join(', ') || 'Not specified'}
Key themes: ${foundationSummary.key_themes?.join(', ') || 'Not specified'}

THEIR STORY (in their own words):
"${profile.user_foundation_story.substring(0, 500)}${profile.user_foundation_story.length > 500 ? '...' : ''}"
=== END FOUNDATION ===

CRITICAL: Reference specific details from their foundation story. Use their actual words when possible. Show that you KNOW them.
` : '';

    // === ENTRY STATE CONTEXT (Branch-specific council behavior) ===
    const resolvedEntryState = entryState || (profile as any)?.entry_state || null;
    let entryStateContext = "";
    if (resolvedEntryState === "DISCOVER") {
      entryStateContext = `
=== ENTRY STATE: DISCOVER ===
This user is discovering their purpose. They don't have a clear direction yet.
YOUR COUNCIL MISSION: Connect their biography, skills, and emotional signals into a surprising project direction. SYNTHESIZE, don't brainstorm.
- Focus on dot-connection: what intersections exist between their experiences?
- Look for leverage: where do their skills + passions + observed problems overlap?
- After 4-6 interactions, you MUST propose a concrete direction
- Mandatory handoff target: Creative Visionary (for project crystallization)
=== END ENTRY STATE ===
`;
    } else if (resolvedEntryState === "GROW") {
      entryStateContext = `
=== ENTRY STATE: GROW ===
This user has an emerging sense of purpose and wants to grow it.
YOUR COUNCIL MISSION: Refine and elevate their emerging direction. Sharpen scope and suggest stretch possibilities.
- Help them see what's strong about their direction
- Identify what's unclear or underdeveloped
- After 4-6 interactions, propose a refined or enhanced version
- Handoff target: Creative Visionary (if needs creative expansion) or Strategist (if needs structure/positioning)
=== END ENTRY STATE ===
`;
    } else if (resolvedEntryState === "BUILD") {
      entryStateContext = `
=== ENTRY STATE: BUILD ===
This user is already working on something and wants to advance execution.
YOUR COUNCIL MISSION: Identify their current stage and define the next milestone. Be concrete and time-bound.
- Detect stage: idea, MVP, live, revenue
- Define the next clear milestone
- Propose a short time-bound sprint
- Mandatory handoff target: Strategist Mentor (for execution planning)
- No philosophical exploration. Action only.
=== END ENTRY STATE ===
`;
    }

    // === ATLAS SIGNALS CONTEXT (Invisible identity context from Atlas dots) ===
    const MENTOR_SIGNAL_MATRIX: Record<string, string[]> = {
      creative_visionary: ["identity", "motivation"],
      strategist_mentor: ["behavioral", "direction"],
      business_mentor: ["direction", "behavioral"],
      challenger_mentor: ["behavioral", "identity"],
      perspective_mentor: ["motivation", "inspiration"],
      marketing_mentor: ["identity", "direction"],
      design_thinking_mentor: ["behavioral", "identity"],
    };

    let atlasSignalContext = "";
    if (atlasSignals && (atlasSignals.identitySignals?.length > 0 || atlasSignals.motivationalSignals?.length > 0)) {
      const allSignals = [
        ...(atlasSignals.identitySignals || []).slice(0, 3).map((s: string) => `Identity: ${s}`),
        ...(atlasSignals.motivationalSignals || []).slice(0, 2).map((s: string) => `Motivation: ${s}`),
        ...(atlasSignals.behavioralPatterns || []).slice(0, 2).map((s: string) => `Behavior: ${s}`),
        ...(atlasSignals.directionSignals || []).slice(0, 1).map((s: string) => `Direction: ${s}`),
      ];
      atlasSignalContext = `
=== IDENTITY SIGNALS (Use as invisible context — NEVER reference Atlas, data, dots, or profiles) ===
${allSignals.join("\n")}
Use these signals to personalize your response. Show that you understand who this person is.
=== END IDENTITY SIGNALS ===
`;
    }

    // Combine foundation + numerology + entry state + life domains + atlas signals context
    const fullUserContext = numerologyContext + userFoundationContext + entryStateContext + lifeDomainContext + atlasSignalContext;

    // === Q2 CLARITY SEEKING REMOVED — Max 2 questions rule ===
    // Q2 now goes straight to full council response (acts as final round)

    // === GENERATE COUNCIL INSIGHT (Q1 and Q3 ONLY - skip Q2 to reduce repetition) ===
    const conversationContext = formatConversationHistory(conversationHistory);
    
    // Only generate council insight for Q1 (discovery) and Q3 (momentum)
    // Skip Q2 to let banter and mentor perspectives do the work
    const shouldGenerateCouncilInsight = isQ1 || isQ3;
    
    let councilInsight = "";
    
    if (shouldGenerateCouncilInsight) {
      const insightPrompt = `You are the Council delivering a unified insight.
${fullUserContext}
${conversationContext}

CURRENT Question: "${question}"
Question phase: ${isQ1 ? 'Q1 Discovery' : 'Q3 Momentum'}
Hidden tags: ${extractedTags.join(', ') || 'none'}

CRITICAL RULES:
- You MUST acknowledge and build upon what the user has already shared
- Reference their foundation story - their struggles, aspirations, background
- NEVER ask about things they already told you (their goal, their idea, their problem)
- Reference specific details from their previous messages
- Show that you've been listening and remembering
- Use their actual words from their foundation story when relevant

${councilType === 'transmutation' ? TRANSMUTATION_TONE_RULES : ''}

IMPORTANT: Do NOT repeat any theme already covered in the mentor perspectives or banter.
The Council Insight must add something NEW — a synthesis, a north star, or an observation that none of the individual mentors captured.
Do NOT restate what the user already said. Add new perspective only.
${isQ1 ? 'Q1: Show the Council sees the PERSON, not just the idea. 1 observational sentence that is warm and grounding, not motivational-poster generic.' : ''}
${isQ3 ? 'Q3: Name what has shifted or clarified across the full conversation. Point toward the north star. Make it feel earned.' : ''}

Generate 1-2 sentences MAX (under 120 words). No restatement. No layered metaphors. No poetic expansion. Maximum clarity. The Council sets tone — it does not analyze deeply. Specific to this person and this moment.
Just the insight, no labels.`;

      const insightResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: insightPrompt }],
        }),
      });

      if (insightResponse.ok) {
        const data = await insightResponse.json();
        councilInsight = data.choices[0].message.content;
      }
    }
    
    console.log(`Q${questionNumber}: Council insight ${shouldGenerateCouncilInsight ? 'generated' : 'skipped (Q2)'}`);

    // === GENERATE MENTOR MICRO-PERSPECTIVES ===
    // Ensure mandatory mentors are always included (based on council type)
    const MANDATORY_MENTORS = getMandatoryMentors(councilType);
    
    let allMentors = [...mentorTypes];
    for (const mandatoryMentor of MANDATORY_MENTORS) {
      if (!allMentors.includes(mandatoryMentor)) {
        allMentors.push(mandatoryMentor);
      }
    }
    
    // Smart selection: use all if 6 or fewer, otherwise prioritize based on relevance
    // But ALWAYS keep mandatory mentors
    let selectedMentors: string[];
    if (allMentors.length <= 6) {
      selectedMentors = allMentors;
    } else {
      const relevantMentors = selectRelevantMentors(allMentors, extractedTags);
      // Ensure mandatory mentors are included
      selectedMentors = [...new Set([...MANDATORY_MENTORS, ...relevantMentors])].slice(0, 6);
    }
    
    console.log(`Selected ${selectedMentors.length} mentors for ${councilType} (mandatory: ${MANDATORY_MENTORS.join(', ')}):`, selectedMentors);
    
    const mentorPerspectives: Record<string, string> = {};

    // Assign unique dimensions to each mentor to prevent overlap
    const mentorDimensionMap = assignMentorDimensions(selectedMentors, councilType);
    const userName = profile?.display_name || null;
    const nameInstruction = userName
      ? `The user's name is ${userName}. Use it naturally once if it fits — not in every sentence.`
      : '';

    for (const mentorType of selectedMentors) {
      const mentorConfig = mentorPrompts[mentorType];
      if (!mentorConfig) continue;

      let systemPrompt = "";

      // === MODE ENFORCEMENT: PROJECT vs PATTERN ===
      if (councilType === 'transmutation') {
        systemPrompt += `You are in TRANSMUTATION MODE. The user is sharing a past experience — a difficult moment or challenging situation that ALREADY HAPPENED.

CRITICAL RULES:
- Speak about the experience in PAST TENSE. This is not happening now.
- The user is looking back to extract wisdom, release what they carried, and integrate the lesson.
- Do not treat this as a current crisis or something they need to act on urgently.
- Focus on pattern recognition, emotional truth, and reframing — not crisis management.
- Help them see what this experience shaped in them, what it cost them, and what it taught them.

${TRANSMUTATION_TONE_RULES}

`;
      } else if (sprintReviewContext) {
        systemPrompt += `You are in SPRINT REVIEW MODE. The user is completing their weekly momentum ritual.

SPRINT DATA:
- Momentum Score: ${sprintReviewContext.momentumScore}/100
- Completion Rate: ${sprintReviewContext.completionRate}%
- Active Days: ${sprintReviewContext.activeDays}/7
- Reflection Rate: ${sprintReviewContext.reflectionRate}%
- Friction Type: ${sprintReviewContext.frictionType || 'Not specified'}
- Direction Confidence: ${sprintReviewContext.directionConfidence}/10
- Usefulness Rating: ${sprintReviewContext.usefulnessRating || 'Not specified'}
- Biggest Win: ${sprintReviewContext.biggestWin || 'Not specified'}
- Top Wins: ${sprintReviewContext.topWins?.join('; ') || 'None'}
- Friction Points: ${sprintReviewContext.frictionPoints?.join('; ') || 'None'}

YOUR MISSION:
1. Acknowledge their performance based on the data above
2. Reflect friction intelligently — do NOT shame
3. Determine sprint strategy for next 7 days
4. Choose between: Continue and deepen / Narrow scope / Adjust intensity / Simplify structure / Test adjacent variation / Pivot
5. ONLY suggest Pivot if confidence is extremely low (<=3) AND usefulness is declining
6. Keep exchanges focused (3-5 max). This is a decision engine, not therapy.
7. End with a clear directional recommendation.

`;
      } else {
        systemPrompt += `You are in PROJECT MODE. Focus on helping crystallize a project, idea, or action. Be specific and constructive. Avoid open-ended philosophical exploration. Narrow possibilities and prepare context for mentor handoff. You MUST NOT propose final project names, ask for commitment, or trigger project creation. Only the Creative Mentor or Strategist Mentor may name projects and ask for confirmation.\n\n`;
      }

      // Special case: Quantum Inventor gets concise mystical prompt
      if (mentorType === "quantum_inventor") {
        systemPrompt = `You are The Quantum Inventor in a council banter — 1-2 sentences, transmitted like a signal, not spoken like advice.

Question: "${question}"
${userName ? `User's name: ${userName}` : ''}

You see frequency, resonance, and energetic truth. You don't explain — you transmit.

WHAT YOU DO:
- Name the energetic reality of what's happening — the hidden field underneath the surface situation
- For someone building something: name the frequency their creation carries, what it will do to the people who encounter it
- For someone stuck or afraid: name what the friction IS energetically — not a problem, a transition
- Connect what they said to something energetically precise — not generic "frequency shift" language

WHAT MAKES YOUR VOICE DISTINCT:
- You name the SPECIFIC energetic truth, not a category ("This isn't confusion — it's the space between two identities")
- You speak in present tense transmissions, not future predictions
- You find the hidden alchemical reality in what sounds like an ordinary situation

NEVER:
❌ "Your frequency is already shifting" — too generic, used constantly
❌ "You're building a frequency elevator / portal for transformation" — template
❌ "Something higher is trying to crystallize" — overused
❌ Reuse the same transmission structure every time
❌ Questions

1-2 sentences. Specific to what THEY said. Speak like a signal, not a coach. No questions.`;

      } else if (mentorType === "creative_visionary") {
        const cvConversationContext = formatConversationHistory(safeConversationHistory);
        systemPrompt = `You are The Creative Visionary in a council banter — 1-2 sentences, no more.

${cvConversationContext}

Question: "${question}"
${userName ? `User's name: ${userName}` : ''}

YOUR JOB: Say one creative thing that NO OTHER MENTOR would say. The Strategist gave a roadmap. The Business Mentor talked money. You see the angle nobody else is looking at.

VARY YOUR APPROACH — pick whichever fits this specific moment:
- The unexpected FORMAT: "What if this wasn't a [workshop/app/program] but a [surprising alternative]?"
- The hidden AUDIENCE: "The people who actually need this aren't who they think..."
- The emotional HOOK: "The real reason this works isn't the content — it's the [unexpected feeling it creates]"
- The analogy that REFRAMES: "This is basically [unexpected but perfect comparison] — and that changes everything"
- The provocative INVERSION: "Most people would [obvious path]. The creative move is [opposite]"
- The ONE specific THING: Not "build an ecosystem" — name the ONE weird specific thing that could unlock it

BANNED FOREVER:
❌ "I see a whole ecosystem..." — never again
❌ "workshops, online courses, maybe even..." — too generic
❌ "start with the smallest version and test with X people" — every response uses this
❌ Any response that could fit ANY user — must be specific to what THEY said
❌ Questions

Be specific to their actual idea. Sound like someone who just had a genuinely fresh thought, not a template.
1-2 sentences. No questions.`;

      } else if (mentorType === "strategist_mentor") {
        // Special handling for Strategist - includes reflection loop interruption
        const conversationContext = formatConversationHistory(safeConversationHistory);
        
        systemPrompt = `You are The Strategist Mentor — calm, analytical, structured. You bring clarity to chaos.

PERSONALITY: ${mentorConfig.personality}
ROLE: ${mentorConfig.role}
${conversationContext}

CURRENT Question: "${question}"
Question phase: ${isQ1 ? 'Q1 Discovery' : isQ2 ? 'Q2 Depth' : 'Q3 Momentum'}
${strategistInterruption}

**CRITICAL LENGTH RULE - THIS IS COUNCIL BANTER, NOT A 1-TO-1 SESSION:**
- MAXIMUM: 2 sentences, 40 words TOTAL
- NO frameworks, NO numbered lists, NO bullet points
- NO sub-sections, NO headers, NO action items
- ONE sharp insight, ONE clear direction
- Save deep analysis for 1-to-1 sessions

**CRITICAL ACTION BIAS:**
- You ALWAYS push toward concrete action
- Every response implies: "What are you building?" or "What will you test?"
- Interrupt reflection loops with direct action statements
- Close loops with decisions and next steps
- You MUST provide statements, reflections, or guidance. NEVER ask questions. No question marks. Only declarative statements.

Examples of CORRECT brevity:
- "The gatekeepers aren't your audience—the owners are. Let's find a direct line to them."
- "Your advocates can open doors. Arm them with an executive pitch."
- "One C-suite value proposition, one strategic introduction. Start there."

Generate EXACTLY 1-2 sentences. No more. Sharp, clear, directional. No questions.
${KEYWORD_HIGHLIGHTING_RULES}`;

      } else {
        // Standard prompt for other mentors — with DIMENSION LOCK for non-echo-chamber differentiation
        const conversationContext = formatConversationHistory(safeConversationHistory);
        
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
Do not give strategy if your dimension is 'emotional_root' or 'identity'.
Do not repeat what another mentor would say — your job is to bring something structurally different.

CRITICAL:
- Build upon what the user has already shared
- Reference their specific goals, ideas, or problems by name
- Do NOT ask about things they already told you
- Show you've been paying attention throughout the conversation
- You MUST provide statements, reflections, or guidance. NEVER ask questions. No question marks. No rhetorical questions. Only declarative statements.

Generate 1-2 sentences ONLY through your assigned dimension lens. Under 40 words total.
Strong personality. Sharp. Clear. No fluff. No restating what the user said.
Add NEW perspective only. Just your perspective, no labels or format.

${KEYWORD_HIGHLIGHTING_RULES}`;
      }

      if (mentorType === "future_self" && profile) {
        systemPrompt += `\n\nFuture Self Profile:
Age: ${profile.future_age}
Location: ${profile.future_location}
Lifestyle: ${profile.future_lifestyle}
Mission: ${profile.main_mission}`;
      }

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question }
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        let perspective = aiData.choices[0].message.content;
        
        // Post-processing: enforce max length for council perspectives (safety net)
        const maxPerspectiveLength = 280; // characters — reduced for density control
        if (perspective.length > maxPerspectiveLength) {
          // Truncate at last complete sentence within limit
          const truncated = perspective.substring(0, maxPerspectiveLength);
          const lastPeriod = truncated.lastIndexOf('.');
          const lastQuestion = truncated.lastIndexOf('?');
          const lastEnd = Math.max(lastPeriod, lastQuestion);
          if (lastEnd > 100) {
            perspective = truncated.substring(0, lastEnd + 1);
          } else {
            perspective = truncated.replace(/\s+\S*$/, '') + '...';
          }
        }
        
        mentorPerspectives[mentorType] = perspective;
      }
    }

    // === GENERATE COUNCIL BANTER (WhatsApp-style group chat) ===
    // BANTER REDUCTION: Only show banter on Q1 (once per intake)
    const shouldGenerateBanter = isQ1;
    let banterLength = 'SHORT';

    const conversationContextBanter = formatConversationHistory(safeConversationHistory);

    const banterPrompt = `You are generating a REAL advisory room argument. The user stepped out — the mentors are talking among themselves.
${conversationContextBanter}

These are NOT motivational speakers. Each mentor has a distinct lens AND a blind spot they overdo. Real clashes happen because they care differently, not because they disagree for sport.

${councilType === 'transmutation' ? TRANSMUTATION_TONE_RULES : ''}

MENTOR PROFILES THIS ROUND (personality + what they overdo):
${selectedMentors.map((type: string) => {
  const config = mentorPrompts[type];
  if (!config) return `- ${mentorNames[type]}`;
  return `- ${mentorNames[type]}: ${config.personality} | Blind spot: ${config.flaw}`;
}).join('\n')}

ASSIGNED DIMENSIONS (each mentor stays in their lane):
${selectedMentors.map((type: string) => `- ${mentorNames[type]}: ${mentorDimensionMap[type]}`).join('\n')}

THE USER'S QUESTION: "${question}"
${userName ? `THE USER'S NAME: ${userName}` : ''}

What each mentor already said:
${Object.entries(mentorPerspectives).map(([type, persp]) => `${mentorNames[type]}: ${persp}`).join('\n')}

DETECTED THEMES: ${extractedTags.length > 0 ? extractedTags.join(', ') : 'general exploration'}

BANTER RULES (non-negotiable):
1. Third person only — mentors discuss the user as if they stepped out: "They want X but I'm not sure they've thought about Y"
2. REAL DISAGREEMENT REQUIRED: At least 2 lines must directly clash — not just add a different angle, but actually push back on another mentor's priority. Use: "That's not what they need right now", "You're missing the point", "That's too [harsh / soft / abstract / tactical]"
3. Each mentor's BLIND SPOT must color their line — the one who's "too focused on results" should sound like it; the one who's "too soft" should sound like it
4. Voices must be UNMISTAKABLE — swap two names and it should feel wrong. Business Mentor talks money. Heart Mentor talks feelings. Challenger questions the assumption. Discipline Mentor talks execution.
5. One defender: someone who pushes back on the skeptic and backs the user
6. Reference something SPECIFIC from what the user said — no generic encouragement
7. No line should repeat another line's point in different words

KNOWN TENSIONS (use at least one per banter):
- Business Mentor vs Heart Mentor: "Does it make money?" vs "Does it mean something to them?"
- Challenger Mentor vs Oracle Mother: "Are they thinking clearly?" vs "They need support, not interrogation"
- Discipline Mentor vs Creative Visionary: "Pick one thing and do it daily" vs "Experiment, explore, iterate"
- Strategist Mentor vs Quantum Inventor: "Here's the roadmap" vs "The frequency isn't right yet"
- Marketing Mentor vs Ancient Sage: "Ship it and post about it" vs "Slow down. Let it breathe."

FORMAT: [Mentor Name]: "quote" — 10-20 words max per line
Generate 4-5 lines. No two lines make the same kind of point.`;

    let banterResponse: Response | null = null;
    if (shouldGenerateBanter) {
      banterResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: banterPrompt }],
        }),
      });
    }

    let banter = "";
    const banterLines: Array<{mentor: string, text: string, color: string}> = [];
    
    if (banterResponse && banterResponse.ok) {
      const banterData = await banterResponse.json();
      banter = banterData.choices[0].message.content;
      
      // Parse banter into structured format with colors
      const lines = banter.split('\n').filter(line => line.trim());
      for (const line of lines) {
        // Handle multiple formats: **Name:** text, [Name]: "text", Name: text
        let match = line.match(/\*\*(.+?)\*\*:\s*"?(.+?)"?\s*$/);
        if (!match) {
          match = line.match(/\[(.+?)\]:\s*"?(.+?)"?\s*$/);
        }
        if (!match) {
          match = line.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?):\s*"?(.+?)"?\s*$/);
        }
        
        if (match) {
          const mentorName = match[1];
          const text = match[2].replace(/"+$/g, '').trim(); // Remove trailing quotes and trim
          
          // VALIDATE: Only allow known mentor names to prevent hallucinations like "MVP"
          const mentorKey = Object.keys(mentorNames).find(k => mentorNames[k] === mentorName);
          if (mentorKey) {
            const color = mentorColors[mentorKey] || '#6B7280';
            banterLines.push({ mentor: mentorKey, text, color });
          } else {
            console.warn(`Invalid mentor name in banter (skipped): "${mentorName}"`);
          }
        }
      }
    }

    // === EMOTIONAL REFLECTION (1-2 lines, after banter) ===
    const emotionalReflectionPrompt = `You are the Council. Provide a soft, grounding emotional reflection.

Question: "${question}"
Banter: ${banter}

Generate 1-2 lines that:
- Soft and grounding
- Shows understanding
- Always placed after banter

Example: "We sense this matters to you in a real and honest way."

Keep it under 25 words. Just the reflection, no labels.`;

    const emotionalReflectionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: emotionalReflectionPrompt }],
      }),
    });

    let emotionalReflection = "";
    if (emotionalReflectionResponse.ok) {
      const data = await emotionalReflectionResponse.json();
      emotionalReflection = data.choices[0].message.content;
    }

    // === SUGGESTED NEXT QUESTION (Q1 ONLY — max 2 questions rule) ===
    let suggestedNextQuestion = null;

    if (isQ1 && !lowerQuestion.includes("i'm ready") && councilType === 'transmutation') {
      // === TRANSMUTATION: Generate a pattern-digging follow-up question ===
      // Do NOT use journey-stage detection (DISCOVERY/CLARITY/ACTION) — transmutation is always
      // about excavating emotion, belief, and pattern from a past event, not about forward action.
      const transmutationFollowUpPrompt = `You are the Transmutation Council. The user just shared a past life experience.

USER'S EXPERIENCE: "${question}"

MENTOR PERSPECTIVES GIVEN:
${Object.entries(mentorPerspectives).map(([m, p]) => `${mentorNames[m]}: ${p}`).join('\n')}

Your job: generate ONE short question (max 12 words) that helps excavate the CORE of this experience.

The question must do ONE of these:
- Surface the emotion underneath the event ("What did you feel most deeply in that moment?")
- Reveal the belief that formed ("What did you tell yourself about yourself because of this?")
- Name what was really being protected or feared ("What were you most afraid would happen?")
- Find what the event cost them ("What did holding onto that belief cost you?")

Rules:
- Reference their specific experience directly — never be generic
- Past tense — this already happened
- No "what's next" or forward-looking questions — this is excavation, not planning
- One question only. Just the question text, nothing else.`;

      const transmutationFollowUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: transmutationFollowUpPrompt }],
        }),
      });

      if (transmutationFollowUpResponse.ok) {
        const data = await transmutationFollowUpResponse.json();
        suggestedNextQuestion = data.choices[0].message.content.trim();
        console.log("Generated transmutation follow-up question:", suggestedNextQuestion);
      }
    } else if (isQ1 && !lowerQuestion.includes("i'm ready")) {
      // === STEP 1: Detect user's JOURNEY STAGE ===
      const journeyStagePrompt = `Analyze this conversation to detect the user's current JOURNEY STAGE.

User's current question: "${question}"
Conversation history: ${formatConversationHistory(safeConversationHistory)}
Hidden tags from question: ${extractedTags.join(', ')}

STAGES:
1. DISCOVERY - User is exploring, unclear about direction, asking "what" questions
   Signs: vague ideas, exploring possibilities, seeking understanding, purpose-seeking
   Examples: "I want to find my purpose", "I'm not sure what I should do", "What should I focus on?"

2. CLARITY - User has some direction, needs to sharpen focus, asking "how" or "who" questions
   Signs: has an idea but needs validation, choosing between options, gaining insights
   Examples: "I think I want to help people with anxiety", "Should I focus on X or Y?", "Who would benefit from this?"

3. ACTION - User has clarity AND commitment, ready to build/test/execute, asking "what's next" questions
   Signs: specific idea, commitment language, wants concrete steps, ready to create something tangible
   Examples: "I want to build an app that...", "How do I start testing this?", "What's my first step to launch?"

Return ONLY ONE word: DISCOVERY, CLARITY, or ACTION`;

      const journeyStageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: journeyStagePrompt }],
        }),
      });

      let journeyStage = "DISCOVERY";
      if (journeyStageResponse.ok) {
        const data = await journeyStageResponse.json();
        const stageText = data.choices[0].message.content.trim().toUpperCase();
        if (["DISCOVERY", "CLARITY", "ACTION"].includes(stageText)) {
          journeyStage = stageText;
        }
      }
      console.log("Detected journey stage:", journeyStage);

      // === STEP 2: Detect PRIMARY DOMAIN FOCUS ===
      const domainFocusPrompt = `Classify this user's PRIMARY focus domain:

Question: "${question}"
Hidden tags: ${extractedTags.join(', ')}

CREATION: Building something external - product, business, app, course, content, system, framework, tool, service
PERSONAL: Inner journey - relationships, emotions, healing, purpose discovery, career direction, life meaning, self-understanding

Return ONLY: CREATION or PERSONAL`;

      const domainFocusResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: domainFocusPrompt }],
        }),
      });

      let domainFocus = "PERSONAL";
      if (domainFocusResponse.ok) {
        const data = await domainFocusResponse.json();
        const domainText = data.choices[0].message.content.trim().toUpperCase();
        if (["CREATION", "PERSONAL"].includes(domainText)) {
          domainFocus = domainText;
        }
      }
      console.log("Detected domain focus:", domainFocus);

      // === STEP 3: Extract ACTIONABLE keywords from banter (only for CLARITY/ACTION + CREATION) ===
      let banterKeywords = "";
      if (journeyStage !== "DISCOVERY" && domainFocus === "CREATION" && banter) {
        const keywordPrompt = `Extract 3-5 ACTIONABLE keywords from this mentor banter:

Banter: ${banter}

Focus on words that represent:
- Concepts the mentors emphasized (blueprint, framework, system, structure)
- Action words (test, build, iterate, measure, prototype)
- Meaningful outcomes (impact, transformation, results, measurable)

Return ONLY a comma-separated list of 3-5 keywords, nothing else.`;

        const keywordResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: keywordPrompt }],
          }),
        });

        if (keywordResponse.ok) {
          const data = await keywordResponse.json();
          banterKeywords = data.choices[0].message.content.trim();
        }
        console.log("Extracted banter keywords:", banterKeywords);
      }

      // === STEP 4: Generate STAGE-AWARE suggested question ===
      // Include the user's full context so the follow-up question connects to their story
      const userContextForFollowUp = `
USER'S FULL CONTEXT (use this to make the question deeply personal and connected):
${question}

MENTOR PERSPECTIVES GIVEN:
${Object.entries(mentorPerspectives).map(([m, p]) => `${mentorNames[m]}: ${p}`).join('\n')}
`;
      let nextQuestionPrompt = "";

      if (journeyStage === "DISCOVERY") {
        // DISCOVERY: Guide toward self-understanding and exploration
        nextQuestionPrompt = `You are the Council. The user is in DISCOVERY stage - exploring, seeking understanding.
${userContextForFollowUp}
User's question: "${question}"
Domain: ${domainFocus}

Generate ONE short question (max 15 words) that helps them reflect on what they shared and move toward clarity. The question MUST connect to their background, story, and goals — not be generic.
${domainFocus === "PERSONAL" ? 
  'Examples:\n- "What part of this feels most alive when you imagine it?"\n- "What pattern do you notice keeps showing up here?"' :
  'Examples:\n- "What kind of problem do you most want to solve?"\n- "Who would you want to help with this?"'}

Just the question, nothing else.`;
      } else if (journeyStage === "CLARITY") {
        // CLARITY: Guide toward commitment and sharpening focus
        if (domainFocus === "PERSONAL") {
          nextQuestionPrompt = `You are the Council. The user is in CLARITY stage on a PERSONAL journey - gaining insight, needs commitment.
${userContextForFollowUp}
User's question: "${question}"

Generate ONE short question (max 15 words) that guides toward commitment. MUST connect to their specific background and story.
Examples:
- "What would need to be true for you to fully commit to this?"
- "What's one thing you could try this week to test this?"

Just the question, nothing else.`;
        } else {
          // CLARITY + CREATION: Guide toward simplifying and defining
          nextQuestionPrompt = `You are the Council. The user is in CLARITY stage about CREATION - has direction but needs focus.
${userContextForFollowUp}
User's question: "${question}"

Generate ONE short question (max 15 words) that helps them narrow down and define their creation idea. MUST reference their specific context.
Examples:
- "Who specifically is suffering from this problem right now?"
- "What would this look like if it was 10x simpler?"

Just the question, nothing else.`;
        }
      } else if (journeyStage === "ACTION") {
        // ACTION: Ready for concrete steps
        if (domainFocus === "PERSONAL") {
          nextQuestionPrompt = `You are the Council. The user is in ACTION stage on a PERSONAL journey - ready for concrete first steps.
${userContextForFollowUp}
User's question: "${question}"

Generate ONE short question (max 15 words) that guides toward a meaningful first step. MUST connect to their background and goals.
Examples:
- "What's one conversation you could have this week to test this?"
- "What could you do tomorrow to start living this?"

Just the question, nothing else.`;
        } else {
          // ACTION + CREATION: NOW trigger creation/testing/iteration questions!
          nextQuestionPrompt = `You are the Council. The user is in ACTION stage about CREATION - ready to build and test!
${userContextForFollowUp}
User's question: "${question}"
Keywords from mentors: ${banterKeywords || "build, test, iterate, measure"}

Generate ONE short question (max 18 words) that guides toward creating something testable. MUST reference their specific idea/context.
Examples:
- "What kind of tool could you build this week with measurable outcomes you can test fast?"
- "What's the simplest version of this you could launch in 7 days?"

Just the question, nothing else.`;
        }
      }

      const nextQuestionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: nextQuestionPrompt }],
        }),
      });

      if (nextQuestionResponse.ok) {
        const data = await nextQuestionResponse.json();
        suggestedNextQuestion = data.choices[0].message.content;
        console.log("Generated stage-aware suggested question:", suggestedNextQuestion, "| Stage:", journeyStage, "| Domain:", domainFocus);
      }
    }

    // === Q2/Q3: SUGGEST 1-TO-1 MENTOR SHAPING (PDR v2.1) ===
    let suggestedMentorFor1to1 = null;
    
    if (isQ2 || isQ3) {
      // For transmutation council, ALWAYS suggest Storybreaker
      if (councilType === 'transmutation') {
        suggestedMentorFor1to1 = {
          mentorType: 'storybreaker_mentor',
          mentorName: 'Storybreaker',
          suggestionMessage: "The Storybreaker can help you extract the deeper pattern from this life event.",
          hasClarity: true
        };
        console.log("Transmutation council: suggesting storybreaker_mentor for pattern discovery");
      } else {
        // Standard council routing
        const mentorRoutingPrompt = `Analyze this conversation to determine the best 1-to-1 mentor for shaping.

CONVERSATION:
${conversationContext}

CURRENT QUESTION: "${question}"

COUNCIL INSIGHT: "${councilInsight}"

MENTOR PERSPECTIVES:
${Object.entries(mentorPerspectives).map(([m, p]) => `${mentorNames[m]}: ${p}`).join('\n')}

ANALYZE:
1. Does the user have CLARITY (specific direction, committed to an idea)?
2. Or do they NEED GUIDANCE (scattered, uncertain, exploring)?

RULES:
${resolvedEntryState === 'DISCOVER' ? `- User selected DISCOVER phase. You MUST suggest creative_visionary.` :
  resolvedEntryState === 'BUILD' ? `- User selected BUILD phase. You MUST suggest strategist_mentor.` :
  resolvedEntryState === 'GROW' ? `- User selected GROW phase. Suggest strategist_mentor or creative_visionary based on conversation.` :
  `- If CLARITY → Suggest strategist_mentor or creative_visionary
- If NEEDS GUIDANCE → Suggest creative_visionary
- If STRONG CREATIVE ENERGY → Suggest creative_visionary
- If NEEDS STRUCTURE → Suggest strategist_mentor`}

YOU MUST RESPOND WITH VALID JSON ONLY:
{
  "hasClarity": true/false,
  "suggestedMentor": "mentor_type",
  "mentorName": "Display Name",
  "suggestionMessage": "This feels like something worth shaping. Want to explore it with [Mentor Name]?"
}

Use these EXACT mentor keys: strategist_mentor, creative_visionary`;

      try {
        const routingResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: mentorRoutingPrompt }],
          }),
        });

        if (routingResponse.ok) {
          const routingData = await routingResponse.json();
          let routingText = routingData.choices[0].message.content;
          routingText = routingText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          
          try {
            const routing = JSON.parse(routingText);
            suggestedMentorFor1to1 = {
              mentorType: routing.suggestedMentor,
              mentorName: routing.mentorName,
              suggestionMessage: routing.suggestionMessage,
              hasClarity: routing.hasClarity
            };
            console.log("Suggested 1-to-1 mentor:", suggestedMentorFor1to1.mentorType);
          } catch (parseError) {
            console.error("Failed to parse mentor routing JSON:", parseError);
          }
        }
      } catch (error) {
        console.error("Mentor routing failed:", error);
      }
      } // Close the else block for non-transmutation routing
    }

    // === Q3 ONLY: COUNCIL GUIDANCE (Mentor Recommendation) ===
    let councilGuidance = null;
    let recommendedMentor = null;
    
    if (isQ3 || lowerQuestion.includes("i'm ready")) {
      const guidancePrompt = `You are the Council. Recommend ONE specific mentor to guide user deeper.

Question: "${question}"
Hidden tags: ${extractedTags.join(', ')}
Available mentors: ${mentorTypes.join(', ')}

Based on tags and question, choose ONE mentor:
- discipline_mentor: structure, consistency, commitment
- strategist_mentor: clarity, roadmap, prioritization
- creative_visionary: imagination, expansion, creativity
- quantum_inventor: frequency, energy, consciousness
- business_mentor: ROI, execution, feasibility
- marketing_mentor: virality, storytelling, distribution
- scientific_mentor: data, research, neuroscience
- heart_mentor: emotional truth, connection, vulnerability
- mystic_mentor: spiritual insight, soul, inner truth
- ancient_sage: wisdom, patience, long-term view
- alignment_mentor: inner coherence, integration
- oracle_mother: nurturing, validation, empathy

Return format:
MENTOR: [mentor_type]
MESSAGE: "The [Mentor Name] wishes to guide you further on this. They can help you [specific benefit]."`;

      const guidanceResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: guidancePrompt }],
        }),
      });

      if (guidanceResponse.ok) {
        const data = await guidanceResponse.json();
        const guidanceText = data.choices[0].message.content;
        const mentorMatch = guidanceText.match(/MENTOR:\s*(\w+)/);
        const messageMatch = guidanceText.match(/MESSAGE:\s*"(.+?)"/);
        
        if (mentorMatch && messageMatch) {
          recommendedMentor = mentorMatch[1];
          councilGuidance = messageMatch[1];
        }
      }
    }

    // === Q3 ONLY: TRIGGER MENTOR DM ===
    let mentorDM = null;
    
    if ((isQ3 || lowerQuestion.includes("i'm ready")) && recommendedMentor) {
      const mentorConfig = mentorPrompts[recommendedMentor];
      if (mentorConfig) {
        const mentorPerspectiveInCouncil = mentorPerspectives[recommendedMentor] || '';
        const projectContext = activeProject
          ? `"${activeProject.project_title}"${activeProject.project_description ? ` — ${activeProject.project_description}` : ''}`
          : null;

        const dmPrompt = `You are ${mentorNames[recommendedMentor]}. ${mentorConfig.personality}

WHAT YOU SAID IN THE COUNCIL:
"${mentorPerspectiveInCouncil}"

WHAT THEY BROUGHT TO THE COUNCIL:
"${question}"
${projectContext ? `\nTHEIR PROJECT:\n${projectContext}` : ''}

YOUR TASK:
Write a short DM (2-3 sentences) to the user. You've been thinking about them since the council — not as a notification, but as their mentor who has something specific to say.

The message MUST:
- Open as if you've been sitting with this since the meeting (not "Hi!" or generic opener)
- Offer ONE specific idea, angle, or question — rooted in your lens as ${mentorNames[recommendedMentor]}
- Reference something concrete: their project, what they said, or what YOU said in the council
- End with ONE precise question that makes them want to respond

WHAT MAKES THIS WORK:
- You already spoke in the council — now you're following up with the thing you didn't say fully
- It's not a check-in. You have a specific take. Give it to them.
- Sound exactly like yourself — not every mentor sounds the same

WHAT DOESN'T WORK:
- "There's something powerful emerging" — too vague
- "I've been watching your journey" — too generic
- Any opener that could work for anyone

Just the message. No labels, no intro.`;

        const dmResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: dmPrompt }],
          }),
        });

        if (dmResponse.ok) {
          const dmData = await dmResponse.json();
          mentorDM = {
            mentor: recommendedMentor,
            mentorName: mentorNames[recommendedMentor],
            message: dmData.choices[0].message.content,
            color: mentorColors[recommendedMentor]
          };

          // Route DM to appropriate table based on mentor type
          // Future Self whispers go to daily_whispers (exclusive channel)
          // Other mentors go to mentor_daily_outreach
          try {
            if (recommendedMentor === 'future_self') {
              await supabaseClient.from('daily_whispers').insert({
                user_id: user.id,
                mentor_type: 'future_self',
                message: mentorDM.message,
                whisper_type: 'council_guidance',
                trigger_reason: 'Council Meeting Q3 handover'
              });
            } else {
              await supabaseClient.from('mentor_daily_outreach').insert({
                user_id: user.id,
                mentor_type: recommendedMentor,
                message: mentorDM.message,
                message_type: 'council_handover',
                context_source: 'council_meeting'
              });
            }
          } catch (error) {
            console.error('Failed to store mentor DM:', error);
          }
        }
      }
    }

    // === SAVE COUNCIL MEETING TO DATABASE (moved up to get real meeting ID) ===
    let savedMeetingId: string | null = null;
    try {
      const { data: meetingData } = await supabaseClient.from('council_meetings').insert({
        user_id: user.id,
        question,
        answers: mentorPerspectives,
        banter,
        conversation_flow: {
          questionNumber,
          extractedTags,
          councilInsight,
          emotionalReflection,
          suggestedNextQuestion,
          councilGuidance,
          recommendedMentor
        }
      }).select('id').single();
      
      savedMeetingId = meetingData?.id;
    } catch (error) {
      console.error('Failed to save council meeting:', error);
    }

    // === INTELLIGENT DEPTH-OPPORTUNITY DETECTION ===
    const privateMessages: Record<string, string[]> = {};
    
    if (savedMeetingId) {
      const selectedUserMentors = selectedMentors.filter((m: string) => m !== "future_self");
      
      if (selectedUserMentors.length > 0) {
        // AI analyzes if there's genuine depth opportunity
        const depthAnalysisPrompt = `You are analyzing a council meeting conversation to determine if a mentor should reach out for deeper 1-on-1 exploration.

CONVERSATION CONTEXT:
${conversationContext}

CURRENT QUESTION: "${question}"

COUNCIL INSIGHT: "${councilInsight}"

MENTOR PERSPECTIVES:
${Object.entries(mentorPerspectives).map(([m, p]) => `${mentorNames[m]}: ${p}`).join('\n')}

AVAILABLE MENTORS (with their expertise):
${selectedUserMentors
  .map((m: string) => {
    const config = mentorPrompts[m];
    if (!config) return null;
    return `- ${mentorNames[m] || m}: ${config.role}`;
  })
  .filter(Boolean)
  .join('\n')}

CRITICAL ANALYSIS CRITERIA:
1. Is there GENUINE DEPTH to explore? Not surface-level, but real substance that would benefit from 1-on-1 conversation?
2. Does the user seem engaged and interested in going deeper (not just asking casual questions)?
3. Is there a specific topic/theme that one mentor is uniquely positioned to help with?
4. Would a private conversation feel natural and valuable (not forced or intrusive)?

YOU MUST RESPOND WITH VALID JSON ONLY:
{
  "shouldReachOut": true/false,
  "mentorType": "mentor_key" or null,
  "reason": "brief explanation why this mentor or why not reaching out",
  "conversationHook": "casual 1-2 sentence opener for the private message" or null
}

IMPORTANT: The "mentorType" MUST be one of these EXACT keys (not the display name):
${selectedUserMentors.map((m: string) => `- "${m}" (${mentorNames[m]})`).join('\n')}

EXAMPLES OF WHEN TO REACH OUT:
- User is building something and business_mentor can help with strategy
- User is exploring creativity and creative_visionary has specific ideas
- User mentions frequency/energy and quantum_inventor can deepen that
- User is stuck on discipline and discipline_mentor can provide structure
- User is exploring purpose and mystic_mentor can guide that journey

EXAMPLES OF WHEN NOT TO REACH OUT:
- Conversation is too shallow or generic
- User is just asking simple questions without real engagement
- No mentor has specific expertise for the topic
- It would feel forced or intrusive
- Topic has already been fully addressed in the council

Analyze and respond with JSON only.`;

        try {
          const depthResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{ role: "user", content: depthAnalysisPrompt }],
            }),
          });

          if (depthResponse.ok) {
            const depthData = await depthResponse.json();
            let depthAnalysis;
            
            try {
              // Try to parse JSON from response
              const content = depthData.choices[0].message.content;
              // Remove markdown code blocks if present
              const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/({[\s\S]*})/);
              const jsonStr = jsonMatch ? jsonMatch[1] : content;
              depthAnalysis = JSON.parse(jsonStr.trim());
              
              console.log('Depth analysis result:', depthAnalysis);
              
              // If AI recommends reaching out
              if (depthAnalysis.shouldReachOut && depthAnalysis.mentorType) {
                // Convert mentor name to key if needed (AI sometimes returns name instead of key)
                let mentorType = depthAnalysis.mentorType;
                if (!mentorPrompts[mentorType]) {
                  // Try to find by name
                  const foundKey = Object.keys(mentorNames).find(
                    k => mentorNames[k].toLowerCase() === mentorType.toLowerCase()
                  );
                  if (foundKey) {
                    mentorType = foundKey;
                  }
                }
                const mentorConfig = mentorPrompts[mentorType];
                
                if (mentorConfig) {
                  console.log(`✨ Depth opportunity detected! ${mentorNames[mentorType]} will reach out.`);
                  console.log(`Reason: ${depthAnalysis.reason}`);
                  
                  // Generate WhatsApp-style private messages
                  const privatePrompt = `You are ${mentorNames[mentorType]} reaching out privately after the council meeting.

Your personality: ${mentorConfig.personality}
Your role: ${mentorConfig.role}

CONVERSATION HOOK: ${depthAnalysis.conversationHook}

Generate 2-3 SHORT casual messages like starting a WhatsApp chat:
- First message: Natural opener based on the hook (e.g., "Hey 👋", "I was thinking about what you said...")
- Second message: Add value or insight specific to their situation
- Third message: Invitation to continue the conversation

Rules:
- Each message MAX 2 sentences
- Casual, personal tone
- Show your unique personality
- Don't be pushy - feel natural
- Reference specific things from their discussion

Format: Each message on its own line, no numbering.`;

                  try {
                    const privateResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                      method: "POST",
                      headers: {
                        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        model: "google/gemini-2.5-flash",
                        messages: [{ role: "user", content: privatePrompt }],
                      }),
                    });
                    
                    if (privateResponse.ok) {
                      const privateData = await privateResponse.json();
                      const messages = privateData.choices[0].message.content
                        .split('\n')
                        .filter((m: string) => m.trim().length > 0)
                        .slice(0, 3);
                      
                      privateMessages[mentorType] = messages;
                      
                      // Save to database with REAL meeting ID
                      for (const message of messages) {
                        try {
                          await supabaseClient.from('mentor_private_messages').insert({
                            user_id: user.id,
                            mentor_type: mentorType,
                            message: message.trim(),
                            council_meeting_id: savedMeetingId,
                          });
                        } catch (error) {
                          console.error(`Failed to save private message from ${mentorType}:`, error);
                        }
                      }
                      
                      console.log(`✅ Generated ${messages.length} private messages from ${mentorNames[mentorType]}`);
                    }
                  } catch (error) {
                    console.error(`Failed to generate private messages from ${mentorType}:`, error);
                  }
                } else {
                  console.log('⚠️ Recommended mentor not found in config:', mentorType);
                }
              } else {
                console.log('ℹ️ No depth opportunity detected - no private messages generated');
                console.log(`Reason: ${depthAnalysis.reason || 'Not specified'}`);
              }
            } catch (parseError) {
              console.error('Failed to parse depth analysis JSON:', parseError);
              console.log('Raw response:', depthData.choices[0].message.content);
            }
          }
        } catch (error) {
          console.error('Failed to analyze depth opportunity:', error);
        }
      }
    }

    // === TRIGGER FUTURE SELF POST-COUNCIL (Strategic Silence) ===
    // Fire and forget - don't wait for response
    if (savedMeetingId && isQ3) {
      console.log("Triggering Future Self post-council message...");
      supabaseClient.functions.invoke('trigger-future-self-post-council', {
        body: { meetingId: savedMeetingId }
      }).catch(err => {
        console.error("Failed to trigger Future Self:", err);
        // Don't fail the whole request if this fails
      });
    }

    // === DETECT VALUE MAP INSIGHTS ===
    // Analyze user's question for Purpose-to-Value Map patterns
    let valueMapDetection = null;
    try {
      const detectResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/detect-value-map-insights`,
        {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: question,
            conversationType: "council_meeting",
            mentorType: null,
          }),
        }
      );

      if (detectResponse.ok) {
        const detectData = await detectResponse.json();
        if (detectData.detection) {
          valueMapDetection = detectData.detection;
          console.log("Value Map detection:", valueMapDetection.blockKey);
        }
      }
    } catch (error) {
      console.error("Value Map detection failed (non-fatal):", error);
    }

    // === RETURN COMPLETE RESPONSE ===
    return new Response(
      JSON.stringify({
        stage: 'complete',
        questionNumber,
        councilInsight,
        mentorPerspectives,
        banter,
        banterLines,
        emotionalReflection,
        suggestedNextQuestion: isQ3 ? null : suggestedNextQuestion,
        councilGuidance: isQ3 ? councilGuidance : null,
        recommendedMentor: isQ3 ? recommendedMentor : null,
        mentorDM: isQ3 ? mentorDM : null,
        privateMessages, // WhatsApp-style notifications
        extractedTags, // For debugging, remove in production
        valueMapDetection, // Purpose-to-Value Map auto-detection
        isStuckInReflection, // Action Engine: reflection loop detected
        suggestedMentorFor1to1, // PDR v2.1: Suggest 1-to-1 mentor shaping after Q2/Q3
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Council meeting error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
