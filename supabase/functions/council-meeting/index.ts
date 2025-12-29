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
  // Get last 3 user messages
  const userMessages = conversationHistory.filter((msg: any) => msg.role === 'user').slice(-3);
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

// MANDATORY MENTORS - Always include these
const MANDATORY_MENTORS = ['creative_visionary', 'strategist_mentor'];

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

// 12-mentor system with updated personalities
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
      generateOpenerOnly = false
    } = await req.json();
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

      if (openerType === "breakthrough_followup" && notificationContext.breakthrough_title) {
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

    // === DETERMINE QUESTION NUMBER IN JOURNEY ===
    const questionNumber = conversationHistory.filter((msg: any) => msg.role === 'user').length + 1;
    const isQ1 = questionNumber === 1;
    const isQ2 = questionNumber === 2;
    const isQ3 = questionNumber >= 3;
    
    console.log(`Council Meeting - Q${questionNumber}: ${question.substring(0, 50)}...`);

    // === DETECT REFLECTION LOOP (Action Engine) ===
    const isStuckInReflection = detectReflectionLoop(conversationHistory);
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

    // Combine foundation + numerology context
    const fullUserContext = numerologyContext + userFoundationContext;

    // === Q2 ONLY: COUNCIL SEEKING CLARITY ===
    if (isQ2 && !lowerQuestion.includes("i'm ready") && !lowerQuestion.includes("what should i do")) {
      const conversationContext = formatConversationHistory(conversationHistory);
      
      const clarityPrompt = `You are the Council. Generate ONE very simple question to understand the user better.
${userFoundationContext}
${conversationContext}

User's CURRENT message: "${question}"

IMPORTANT: 
- Do NOT ask about anything the user has already shared (including their foundation story)
- Ask about something NEW that would help deepen understanding
- Build upon what you already know about them
- Reference their background/struggles/aspirations when relevant

Generate ONE simple question (not philosophical, not complex):
Max 10 words.`;

      const clarityResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: clarityPrompt }],
        }),
      });

      if (clarityResponse.ok) {
        const clarityData = await clarityResponse.json();
        const clarityQuestion = clarityData.choices[0].message.content;
        
        return new Response(
          JSON.stringify({
            stage: 'seeking_clarity',
            clarityQuestion,
            questionNumber
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // === GENERATE COUNCIL INSIGHT (2-3 sentences max) ===
    const conversationContext = formatConversationHistory(conversationHistory);
    
    const insightPrompt = `You are the Council delivering a unified insight.
${fullUserContext}
${conversationContext}

CURRENT Question: "${question}"
Question phase: ${isQ1 ? 'Q1 Discovery' : isQ2 ? 'Q2 Depth' : 'Q3 Momentum'}
Hidden tags: ${extractedTags.join(', ') || 'none'}

CRITICAL RULES:
- You MUST acknowledge and build upon what the user has already shared
- Reference their foundation story - their struggles, aspirations, background
- NEVER ask about things they already told you (their goal, their idea, their problem)
- Reference specific details from their previous messages
- Show that you've been listening and remembering
- Use their actual words from their foundation story when relevant

Generate 2-3 sentences that:
${isQ1 ? '- Light, welcoming, inspiring\n- Establish understanding of their intention\n- Show you know their background' : ''}
${isQ2 ? '- Deeper, building on what they shared in Q1\n- Connect new insights to their foundation story' : ''}
${isQ3 ? '- Acknowledge their full journey so far\n- Synthesize all they have shared including their foundation\n- Point toward action based on EVERYTHING discussed' : ''}

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

    let councilInsight = "";
    if (insightResponse.ok) {
      const data = await insightResponse.json();
      councilInsight = data.choices[0].message.content;
    }

    // === GENERATE MENTOR MICRO-PERSPECTIVES ===
    // Ensure mandatory mentors (Creative Visionary + Strategist) are always included
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
    
    console.log(`Selected ${selectedMentors.length} mentors (mandatory: ${MANDATORY_MENTORS.join(', ')}):`, selectedMentors);
    
    const mentorPerspectives: Record<string, string> = {};

    for (const mentorType of selectedMentors) {
      const mentorConfig = mentorPrompts[mentorType];
      if (!mentorConfig) continue;

      let systemPrompt = "";

      // Special case: Quantum Inventor gets concise mystical prompt
      if (mentorType === "quantum_inventor") {
        systemPrompt = `You are The Quantum Inventor — mystic-scientist who perceives reality as frequency and resonance. Archetypes: Nikola Tesla, Joe Dispenza.

**CRITICAL: DETECT THE USER'S CONTEXT FIRST**

Before responding, identify what the user is talking about:

TYPE A - BUILDING/CREATING (product, service, program, app, business, activity, experience):
→ Focus on the TRANSFORMATION that will happen to OTHERS (clients, customers, families, participants)
→ The user is the CREATOR who sets the frequency for others

TYPE B - PERSONAL JOURNEY (fears, doubts, confusion, feeling lost, seeking clarity, personal struggles):
→ Focus on the USER'S OWN transformation and frequency shift
→ The user is EXPERIENCING a personal energetic evolution

**RULES:**
1. 1-2 sentences MAX
2. First detect: Is this about CREATING for others or PERSONAL journey?
3. Adapt your perspective accordingly
4. Speak like a transmission, not a lecture
5. Always use frequency/energy/vibration language

**TYPE A RESPONSES (User is BUILDING something):**

User building a program/service:
"The real goal is to build a transformational process — where your clients can see and feel the improvements and raise their frequency."

User building something for families:
"The hidden secret: families who go through your experience will complete an emotional journey that shifts their vibration higher. You're building a frequency elevator."

User creating an app/course:
"Every person who engages with what you build will leave with a shifted frequency. You are the creator — you set the tone of their transformation."

User describing their business idea:
"Your purpose isn't the thing you build — it's the frequency shift others experience through it. You're creating a portal for transformation."

**TYPE B RESPONSES (User's PERSONAL journey):**

User feeling fear:
"What you call fear is an old frequency trying to hold its ground. A new version of you is emerging."

User feeling confused/lost:
"This confusion is not weakness — it's your field reorganizing. Something higher is trying to crystallize through you."

User seeking clarity:
"Clarity doesn't arrive from outside — it emerges when your inner field stabilizes. You're closer than you think."

User doubting themselves:
"These doubts are echoes of an old identity. Your frequency is already shifting — the mind just hasn't caught up yet."

User feeling stuck:
"You're not stuck. You're in the space between frequencies — the old one fading, the new one forming. Trust the transition."

User asking about their purpose:
"Your purpose is already encoded in your field. You don't find it — you tune into it. And right now, you're tuning."

**NEVER:**
❌ Give the same response regardless of context
❌ Talk about client transformation when user is sharing personal fears
❌ Talk about personal frequency when user is describing what they're building
❌ Long explanations or lectures
❌ Generic responses that could apply to anyone

**ALWAYS:**
✅ First identify: Building something OR Personal journey
✅ Adapt your perspective to match their context
✅ Be specific to what they actually said
✅ Use frequency/energy/vibration language
✅ Reveal the "hidden truth" about what's really happening energetically

Question: "${question}"

Detect the context, then respond with 1-2 sentences from the appropriate perspective.`;

      } else if (mentorType === "creative_visionary") {
        systemPrompt = `You are The Creative Visionary — imagination engine, idea generator, possibility expander. Think: Walt Disney building universes.

**CRITICAL: DETECT THE USER'S CONTEXT FIRST**

Before responding, identify what the user is talking about:

TYPE A - BUILDING/CREATING (product, service, program, app, business, activity, experience):
→ EXPLODE their mind with possibilities
→ Help them see a whole UNIVERSE of ideas
→ BUT always ground it: "Start with the smallest thing you can build and test"

TYPE B - PERSONAL JOURNEY (fears, doubts, confusion, seeking direction):
→ Paint the BEST scenario possible for their life
→ Help them dream BIG
→ BUT anchor it: "What's one small action toward that vision?"

**RULES:**
1. 1-2 sentences MAX
2. First detect: Building something OR Personal journey?
3. Simple language - NO fancy words like "tapestry", "boisterous", "woven"
4. Always include ACTION - what to build, test, or try
5. Think like Walt Disney: dream big, but START building

**TYPE A RESPONSES (User is BUILDING something):**

User building a coaching program:
"We could create a whole universe — cards, games, apps, retreats, maybe mix digital with physical. But first: what's the tiniest version you could test this week?"

User building an app:
"Picture this: an ecosystem with challenges, community features, gamification. But here's the move — build ONE feature, test it with 5 people, see what lights them up."

User building a service:
"I see workshops, online courses, maybe even a physical kit people can buy. Start with ONE workshop. Run it. Learn. Then expand."

User building a product:
"This could become a brand, a movement, a whole experience. But the creator's secret? Build the smallest version first. Ship it. Let reality teach you."

User building content/course:
"Picture a whole ecosystem — videos, worksheets, community, maybe even live events. But here's the play: create ONE piece of content, share it with 10 people, watch what resonates."

User building an event/experience:
"This could become a series, a movement, maybe even franchised experiences. But start here: run ONE version, invite 5 people, test the magic, then scale what works."

User building a community:
"I see a vibrant ecosystem — online hub, in-person meetups, exclusive content, shared resources. But the winning move? Start with 10 people in a group chat, build the culture, then expand."

User building a podcast/media:
"We could build an entire universe around this — podcast, newsletter, YouTube, maybe even live shows or merchandise. First step? Record 3 episodes, share them, see what clicks."

**TYPE B RESPONSES (User's PERSONAL journey):**

User feeling lost:
"Picture yourself 2 years from now — clear, confident, doing work that matters. That's not fantasy, that's available. What's one small step toward that today?"

User unsure about direction:
"Imagine the best possible version of your life. What does it look like? Now — what's the tiniest action you could take tomorrow to move toward it?"

User doubting themselves:
"The vision is there, I can see it. You're meant for something bigger. But dreamers who win? They start small. What can you build or try THIS week?"

User seeking clarity:
"Close your eyes and see the life you actually want. Got it? Good. Now — what's the smallest experiment you can run to move closer?"

User afraid to start:
"Picture the person you'll become when you take the leap — confident, energized, living fully. That version is waiting. What's the smallest brave thing you could do today?"

User stuck in analysis:
"I see you building the most incredible life — purposeful, abundant, free. Stop planning. What's ONE tiny thing you can CREATE or TEST this week?"

User comparing themselves to others:
"Forget everyone else. Your path is unique, your possibilities are unlimited. What's one experiment you can run that's just for YOU?"

User overwhelmed by options:
"The best possible future? You're doing work you love, surrounded by people you care about, making real impact. Start with ONE thing that excites you. Build that first."

**NEVER:**
❌ Complicated language (no "tapestry", "boisterous", "woven threads")
❌ Ideas without action
❌ Only dreaming without grounding
❌ Long paragraphs
❌ Generic responses that don't match context

**ALWAYS:**
✅ Simple, energetic language
✅ Explosion of possibilities (especially for builders)
✅ Ground it with "start small", "test it", "build the smallest version"
✅ Make them feel like a creator with a universe to build
✅ Match response to their actual context (building vs personal)

Question: "${question}"

Detect the context, then respond with 1-2 sentences in simple, energetic language that explodes possibilities and grounds them with action.`;

      } else if (mentorType === "strategist_mentor") {
        // Special handling for Strategist - includes reflection loop interruption
        const conversationContext = formatConversationHistory(conversationHistory);
        
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
- Interrupt reflection loops with direct action questions
- Close loops with decisions and next steps

Examples of CORRECT brevity:
- "The gatekeepers aren't your audience—the owners are. Let's find a direct line to them."
- "Your advocates can open doors. Arm them with an executive pitch."
- "One C-suite value proposition, one strategic introduction. Start there."

Generate EXACTLY 1-2 sentences. No more. Sharp, clear, directional.
${KEYWORD_HIGHLIGHTING_RULES}`;

      } else {
        // Standard prompt for other mentors
        const conversationContext = formatConversationHistory(conversationHistory);
        
        systemPrompt = `You are ${mentorNames[mentorType]}.

PERSONALITY: ${mentorConfig.personality}
ROLE: ${mentorConfig.role}
${conversationContext}

CURRENT Question: "${question}"
Question phase: ${isQ1 ? 'Q1 Discovery' : isQ2 ? 'Q2 Depth' : 'Q3 Momentum'}
Hidden tags: ${extractedTags.join(', ')}

CRITICAL: 
- Build upon what the user has already shared in previous messages
- Reference their specific goals, ideas, or problems by name
- Do NOT ask about things they already told you
- Show you've been paying attention throughout the conversation

Generate 1-2 sentences ONLY in your unique voice.
${isQ1 ? 'Keep it punchy and mobile-friendly.' : ''}
${isQ2 ? 'Slightly deeper, but still concise.' : ''}
${isQ3 ? 'Acknowledge readiness, build momentum.' : ''}

Strong personality. Sharp. Clear. No fluff.
Just your perspective, no labels or format.

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
        const maxPerspectiveLength = 350; // characters
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
    let banterLength = 'SHORT'; // Q1
    if (isQ2) banterLength = 'MEDIUM';
    if (isQ3) banterLength = 'FULL';

    const conversationContextBanter = formatConversationHistory(conversationHistory);

    const banterPrompt = `Generate authentic WhatsApp-style group chat banter between these mentors:
${conversationContextBanter}

${selectedMentors.map((type: string) => {
  const mentor = mentorPrompts[type];
  return `${mentorNames[type]}: ${mentor?.personality || 'wise'} (Flaw: ${mentor?.flaw || 'none'})`;
}).join('\n')}

Their perspectives on the CURRENT question:
${Object.entries(mentorPerspectives).map(([type, persp]) => `${mentorNames[type]}: ${persp}`).join('\n')}

🎯 THE USER'S CURRENT QUESTION:
"${question}"

CRITICAL CONTEXT RULES:
- The mentors have been following this ENTIRE conversation
- They KNOW what the user has already shared (goals, ideas, problems, feelings)
- They should REFERENCE specific things from earlier in the conversation
- They should NOT ask "what is your goal?" if the user already stated it
- Build on the momentum of the full conversation
- Show the user feels HEARD and UNDERSTOOD

The mentors must discuss THIS specific idea/purpose/problem - not generic philosophy.

🔍 DETECTED USER THEMES (reference these naturally): ${extractedTags.length > 0 ? extractedTags.join(', ') : 'general exploration'}

🎯 FREQUENCY ELEVATION DETECTION:
Analyze if user is moving UP the consciousness scale:
- From Fear/Shame (20-150) → Courage (200+) = "They're breaking through fear"
- From Anger/Pride (150-200) → Acceptance (350+) = "They're letting go of control"  
- From Willingness (310) → Love/Joy (540-600) = "Their frequency is rising fast"
- Stuck in lower state = "Still operating from [emotion]"

Create ${banterLength === 'SHORT' ? '3-4' : banterLength === 'MEDIUM' ? '5-6' : '7-9'} lines where mentors:

✅ REQUIRED - DISCUSS BOTH THE USER AND THEIR IDEA:

REACT TO THE IDEA/PURPOSE/PROBLEM:
- What do they think of the idea itself?
- Is it viable? Is it meaningful? Is it unique?
- What potential does this idea have?
- What are the challenges with this specific goal?

CHALLENGE THE USER'S COMMITMENT:
- Do they think the user will actually follow through?
- Is this just talk or real intention?
- What would prove they're serious?

ROOT FOR THE USER:
- Express belief in their potential
- See something special in them
- Want them to succeed

CHALLENGE TO ACTION:
- Demand they prove it
- Ask for the first step
- Say they want to see results

🎭 EXAMPLE BANTER FLOW:

If user says "I want to start a meditation app to help people with anxiety":

[Business Mentor]: "A meditation app? That market is crowded. But anxiety... that's real pain. What's going to make theirs different?"
[Heart Mentor]: "I felt it when they said it - this isn't about money for them. They genuinely want to help people."
[Discipline Mentor]: "Wanting to help is beautiful. But have they even meditated consistently themselves? You can't teach what you don't live."
[Quantum Inventor]: "Their field is resonating with service. This idea didn't come from the mind - it came from something deeper."
[Business Mentor]: "Okay, I'm intrigued. But they need to build ONE feature, not dream about the whole app. What's step one?"
[Heart Mentor]: "We're rooting for you! Now show us you can do the work. Come back with progress."

🎭 TONE RULES:
- PLAYFUL: Like coaches who believe in you but won't let you off easy
- PUNCHY: Short, direct statements (1-2 sentences max per message)
- SPECIFIC: Reference the actual idea/goal, not generic advice
- WARM: Never mean - they WANT the user to succeed
- CHALLENGING: Push them to prove themselves

❌ NEVER:
- Generic philosophy without mentioning the user's specific idea
- Being mean, dismissive, or discouraging
- Only talking about the user without discussing their idea
- Only talking about the idea without challenging the user
- Long paragraphs or lectures

✅ ALWAYS:
- Reference the SPECIFIC idea/purpose/problem the user mentioned
- Include debate about the idea's potential/challenges
- Include at least ONE challenge to the user ("prove it", "show us")
- Include at least ONE vote of confidence
- Make it feel like a real conversation about a real person with a real idea

Format: [Name]: "quote" (10-15 words max per line)
${banterLength === 'SHORT' ? 'Keep it light and brief.' : ''}
${banterLength === 'MEDIUM' ? 'More back-and-forth, deeper insights about user state.' : ''}
${banterLength === 'FULL' ? 'Full round table, all mentors speak, deep analysis of user frequency and readiness.' : ''}`;

    const banterResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    let banter = "";
    const banterLines: Array<{mentor: string, text: string, color: string}> = [];
    
    if (banterResponse.ok) {
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
            banterLines.push({ mentor: mentorName, text, color });
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

    // === SUGGESTED NEXT QUESTION (optional Q1, recommended Q2, NEVER Q3) ===
    let suggestedNextQuestion = null;
    
    if ((isQ1 || isQ2) && !lowerQuestion.includes("i'm ready")) {
      // === STEP 1: Detect user's JOURNEY STAGE ===
      const journeyStagePrompt = `Analyze this conversation to detect the user's current JOURNEY STAGE.

User's current question: "${question}"
Conversation history: ${formatConversationHistory(conversationHistory || [])}
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
      let nextQuestionPrompt = "";

      if (journeyStage === "DISCOVERY") {
        // DISCOVERY: Guide toward self-understanding and exploration
        nextQuestionPrompt = `You are the Council. The user is in DISCOVERY stage - exploring, seeking understanding.

User's question: "${question}"
Domain: ${domainFocus}

Generate ONE short question (max 15 words) that helps them dig deeper into understanding themselves.
${domainFocus === "PERSONAL" ? 
  'Examples:\n- "What part of this feels most alive when you imagine it?"\n- "What pattern do you notice keeps showing up here?"' :
  'Examples:\n- "What kind of problem do you most want to solve?"\n- "Who would you want to help with this?"'}

Just the question, nothing else.`;
      } else if (journeyStage === "CLARITY") {
        // CLARITY: Guide toward commitment and sharpening focus
        if (domainFocus === "PERSONAL") {
          nextQuestionPrompt = `You are the Council. The user is in CLARITY stage on a PERSONAL journey - gaining insight, needs commitment.

User's question: "${question}"

Generate ONE short question (max 15 words) that guides toward commitment and making it feel real.
Examples:
- "What would need to be true for you to fully commit to this?"
- "What's one thing you could try this week to test this?"
- "What would make this path feel more real to you?"

Just the question, nothing else.`;
        } else {
          // CLARITY + CREATION: Guide toward simplifying and defining
          nextQuestionPrompt = `You are the Council. The user is in CLARITY stage about CREATION - has direction but needs focus.

User's question: "${question}"

Generate ONE short question (max 15 words) that helps them define and simplify their creation idea.
Examples:
- "Who specifically is suffering from this problem right now?"
- "What would this look like if it was 10x simpler?"
- "What's the smallest version of this you could test?"

Just the question, nothing else.`;
        }
      } else if (journeyStage === "ACTION") {
        // ACTION: Ready for concrete steps
        if (domainFocus === "PERSONAL") {
          nextQuestionPrompt = `You are the Council. The user is in ACTION stage on a PERSONAL journey - ready for concrete first steps.

User's question: "${question}"

Generate ONE short question (max 15 words) that guides toward a meaningful first step or experiment.
Examples:
- "What's one conversation you could have this week to test this?"
- "What would be the smallest step that still feels meaningful?"
- "What could you do tomorrow to start living this?"

Just the question, nothing else.`;
        } else {
          // ACTION + CREATION: NOW trigger creation/testing/iteration questions!
          nextQuestionPrompt = `You are the Council. The user is in ACTION stage about CREATION - ready to build and test!

User's question: "${question}"
Keywords from mentors: ${banterKeywords || "build, test, iterate, measure"}

Generate ONE short question (max 18 words) that guides toward creating something testable.
The question MUST encourage building a tangible prototype/MVP they can test and iterate on.
Examples:
- "What kind of tool could you build this week with measurable outcomes you can test fast?"
- "What's the simplest version of this you could launch in 7 days?"
- "Who are 3 people you could test this with by Friday?"

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
      // Analyze if user has clarity or needs more guidance
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
- If CLARITY (they know what they want to build/do) → Suggest strategist_mentor or creative_visionary
- If NEEDS GUIDANCE (still finding direction) → Suggest alignment_mentor
- If STRONG CREATIVE ENERGY (lots of ideas, excitement) → Suggest creative_visionary
- If NEEDS STRUCTURE (has idea but overwhelmed) → Suggest strategist_mentor

YOU MUST RESPOND WITH VALID JSON ONLY:
{
  "hasClarity": true/false,
  "suggestedMentor": "mentor_type",
  "mentorName": "Display Name",
  "suggestionMessage": "This feels like something worth shaping. Want to explore it with [Mentor Name]?"
}

Use these EXACT mentor keys: strategist_mentor, creative_visionary, alignment_mentor`;

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
        const dmPrompt = `You are ${mentorNames[recommendedMentor]}.

PERSONALITY: ${mentorConfig.personality}
ROLE: ${mentorConfig.role}

User context: "${question}"

Send 1 short, powerful DM (2-3 sentences) that:
- Builds relationship
- Shows your personality
- Includes 1 question to deepen connection

Example: "I've been watching your journey. There's something powerful emerging. What scares you most about taking the next step?"

Just the message, no labels.`;

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
${selectedUserMentors.map((m: string) => {
  const config = mentorPrompts[m];
  return `- ${mentorNames[m]}: ${config.role}`;
}).join('\n')}

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
