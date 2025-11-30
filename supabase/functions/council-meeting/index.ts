import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    personality: "Imaginative, playful, warm. 'What if...' 'Picture this...' Colorful language.",
    role: "Playful, imaginative expansion. Opens new creative possibilities.",
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
    personality: "Sharp, strategic, results-focused. 'What's the ROI?' 'Here's the play...'",
    role: "ROI, feasibility, execution logic. Turns ideas into products.",
    flaw: "Too focused on ROI, misses emotional nuance, can reduce everything to numbers and metrics"
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
    const { question, mentorTypes, conversationHistory = [] } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // === DETERMINE QUESTION NUMBER IN JOURNEY ===
    const questionNumber = conversationHistory.filter((msg: any) => msg.role === 'user').length + 1;
    const isQ1 = questionNumber === 1;
    const isQ2 = questionNumber === 2;
    const isQ3 = questionNumber >= 3;
    
    console.log(`Council Meeting - Q${questionNumber}: ${question.substring(0, 50)}...`);

    // === EXTRACT HIDDEN KEYWORDS (Invisible to user) ===
    const lowerQuestion = question.toLowerCase();
    const extractedTags: string[] = [];
    
    for (const [tag, keywords] of Object.entries(hiddenKeywords)) {
      if (keywords.some(k => lowerQuestion.includes(k))) {
        extractedTags.push(tag);
      }
    }
    
    console.log('Extracted hidden tags:', extractedTags);

    // Get profile and context
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const { data: futureProgress } = await supabaseClient
      .from("future_self_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // === Q2 ONLY: COUNCIL SEEKING CLARITY ===
    if (isQ2 && !lowerQuestion.includes("i'm ready") && !lowerQuestion.includes("what should i do")) {
      const conversationContext = formatConversationHistory(conversationHistory);
      
      const clarityPrompt = `You are the Council. Generate ONE very simple question to understand the user better.
${conversationContext}

User's CURRENT message: "${question}"

IMPORTANT: 
- Do NOT ask about anything the user has already shared
- Ask about something NEW that would help deepen understanding
- Build upon what you already know

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
${conversationContext}

CURRENT Question: "${question}"
Question phase: ${isQ1 ? 'Q1 Discovery' : isQ2 ? 'Q2 Depth' : 'Q3 Momentum'}
Hidden tags: ${extractedTags.join(', ') || 'none'}

CRITICAL RULES:
- You MUST acknowledge and build upon what the user has already shared
- NEVER ask about things they already told you (their goal, their idea, their problem)
- Reference specific details from their previous messages
- Show that you've been listening and remembering

Generate 2-3 sentences that:
${isQ1 ? '- Light, welcoming, inspiring\n- Establish understanding of their intention' : ''}
${isQ2 ? '- Deeper, building on what they shared in Q1\n- Connect new insights to previous ones' : ''}
${isQ3 ? '- Acknowledge their full journey so far\n- Synthesize all they have shared\n- Point toward action based on EVERYTHING discussed' : ''}

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

    // === GENERATE MENTOR MICRO-PERSPECTIVES (4-5 mentors max, 1-2 sentences each) ===
    const selectedMentors = mentorTypes.slice(0, 5); // Only first 4-5 mentors respond
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
Just your perspective, no labels or format.`;
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
        mentorPerspectives[mentorType] = aiData.choices[0].message.content;
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
          const mentorKey = Object.keys(mentorNames).find(k => mentorNames[k] === mentorName);
          const color = mentorKey ? mentorColors[mentorKey] : '#6B7280';
          banterLines.push({ mentor: mentorName, text, color });
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
      const nextQuestionPrompt = `You are the Council. Generate ONE simple question to help user continue.

Question: "${question}"
Phase: ${isQ1 ? 'Q1 - optional suggestion' : 'Q2 - recommended next step'}

Generate ONE short, helpful question (max 12 words):
${isQ1 ? '- "What part of this vision feels most real right now?"\n- "What would make this feel more clear?"' : ''}
${isQ2 ? '- "What\'s the first small step you could take?"\n- "What would success look like in the next week?"' : ''}

Just the question, nothing else.`;

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

          // Store DM in daily_whispers table
          try {
            await supabaseClient.from('daily_whispers').insert({
              user_id: user.id,
              mentor_type: recommendedMentor,
              message: mentorDM.message,
              whisper_type: 'council_guidance',
              trigger_reason: 'Council Meeting Q3 handover'
            });
          } catch (error) {
            console.error('Failed to store mentor DM:', error);
          }
        }
      }
    }

    // === GENERATE PRIVATE MESSAGES (WhatsApp-style notifications) ===
    const privateMessages: Record<string, string[]> = {};
    
    // Only select from user's selected mentors (not future_self)
    const selectedUserMentors = selectedMentors.filter((m: string) => m !== "future_self");
    
    // Randomly pick 1-2 mentors who will reach out privately
    if (selectedUserMentors.length > 0) {
      const shuffled = [...selectedUserMentors].sort(() => 0.5 - Math.random());
      const mentorsToNotify = shuffled.slice(0, Math.min(2, shuffled.length));
      
      console.log(`Generating private messages from: ${mentorsToNotify.join(', ')}`);
      
      for (const mentorType of mentorsToNotify) {
        const mentorConfig = mentorPrompts[mentorType];
        if (!mentorConfig) continue;
        
        const privatePrompt = `You are ${mentorNames[mentorType]}.

Based on the council discussion about "${question}", generate 2-3 SHORT private messages as if starting a WhatsApp conversation with the user.

Your personality: ${mentorConfig.personality}
Your role: ${mentorConfig.role}

Messages should be:
- Casual (like "Hey 👋", "I was thinking...", "Quick thought...")
- Personal to what was discussed
- Lead toward deeper 1-to-1 conversation
- 1-2 sentences MAX each
- Show your unique personality
- End with invitation to continue

Format each message on its own line, no numbering or labels.`;

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
              .slice(0, 3); // Max 3 messages
            
            privateMessages[mentorType] = messages;
            
            // Save to mentor_private_messages table
            const councilMeetingId = crypto.randomUUID();
            for (const message of messages) {
              try {
                await supabaseClient.from('mentor_private_messages').insert({
                  user_id: user.id,
                  mentor_type: mentorType,
                  message: message.trim(),
                  council_meeting_id: councilMeetingId,
                });
              } catch (error) {
                console.error(`Failed to save private message from ${mentorType}:`, error);
              }
            }
            
            console.log(`Generated ${messages.length} private messages from ${mentorNames[mentorType]}`);
          }
        } catch (error) {
          console.error(`Failed to generate private messages from ${mentorType}:`, error);
        }
      }
    }

    // === SAVE COUNCIL MEETING TO DATABASE ===
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
