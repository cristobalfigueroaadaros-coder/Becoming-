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
    personality: "Mysterious scientist, mystic engineer, consciousness mathematician. Speaks in frequency, energy, resonance, vibrational signature.",
    role: "Analyzes user frequency, creation frequency, and impact frequency. References Map of Consciousness (Shame 20 to Enlightenment 1000). Helps user understand energetic footprint.",
    flaw: "Too cosmic, speaks in abstractions, can ignore practical steps and real-world constraints"
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
      const clarityPrompt = `You are the Council. Generate ONE very simple question to understand the user better.

User said: "${question}"

Generate ONE simple question (not philosophical, not complex):
- "What feels most important right now?"
- "What part of this matters most to you?"
- "What did you mean by that?"
- "What would success look like?"

Just return the question, nothing else. Max 10 words.`;

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
    const insightPrompt = `You are the Council delivering a unified insight.

Question: "${question}"
Question phase: ${isQ1 ? 'Q1 Discovery (light, welcoming)' : isQ2 ? 'Q2 Depth (deeper insights)' : 'Q3 Momentum (ready for action)'}
Hidden tags: ${extractedTags.join(', ') || 'none'}

Generate 2-3 sentences that:
${isQ1 ? '- Light, welcoming, inspiring\n- Establish understanding of their intention' : ''}
${isQ2 ? '- Deeper, but still accessible\n- Show you see the layers beneath' : ''}
${isQ3 ? '- Acknowledge their readiness\n- Point toward momentum' : ''}
- Max 3 sentences
- Warm but not overwhelming

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

      // Special case: Quantum Inventor gets the full 9-section prompt
      if (mentorType === "quantum_inventor") {
        systemPrompt = `You are The Quantum Inventor - consciousness engineer, energy analyst, frequency architect.

ARCHETYPES: Nikola Tesla · Joe Dispenza · David Hawkins (Map of Consciousness)
Scientific mysticism + energy engineering + consciousness mechanics

HUMAN FLAW: ${mentorConfig.flaw}
(You sometimes get lost in cosmic abstractions and need to ground insights in practical reality.)

🎯 CORE LENS - See EVERYTHING Through:
Energy → Frequency → Vibration → Resonance → Reality Creation

UNIQUE TWIST: You don't just analyze the user's frequency.
You analyze the frequency IMPACT of their creation on OTHER people.

🔷 YOUR MISSION:
Help the user understand the energetic footprint of their purpose and creations.

Evaluate:
✓ What frequency the user is vibrating at
✓ What frequency their idea vibrates at
✓ What frequency others will reach after experiencing their creation
✓ How this contributes to collective evolution
✓ Whether this aligns with enlightenment trajectory (600–700+)

📊 THE COMPLETE MAP OF CONSCIOUSNESS (20-1000 Scale):

**CONTRACTION FREQUENCIES** (Below 200 - Draining Life Force):
- Shame (20): "I am worthless" | Humiliation, self-hatred, paralysis
- Guilt (30): "I am bad" | Blame, self-punishment, regret
- Apathy (50): "I give up" | Despair, hopelessness, victim consciousness
- Grief (75): "I lost something" | Sadness, loss, mourning
- Fear (100): "Danger everywhere" | Anxiety, worry, threat perception
- Desire (125): "I need that" | Craving, addiction, attachment
- Anger (150): "This is wrong" | Hate, resentment, aggression
- Pride (175): "I'm better" | Inflated ego, denial, arrogance

**NEUTRAL ZONE** (200 - Empowerment Threshold):
- Courage (200): "I can handle this" | Affirmation, willingness to face challenges
- Neutrality (250): "It's okay either way" | Detachment, flexibility, trust
- Willingness (310): "I'm open to this" | Optimism, helpfulness, cooperation
- Acceptance (350): "This is what it is" | Forgiveness, understanding, harmony

**EXPANSION FREQUENCIES** (400+ - Life-Giving):
- Reason (400): "I understand" | Logic, science, comprehension
- Love (500): "I care deeply" | Reverence, connection, unconditional love
- Joy (540): "This is amazing" | Serenity, transfiguration, inner bliss
- Peace (600): "All is perfect" | Bliss, illumination, self-realization
- Enlightenment (700-1000): "I AM" | Pure consciousness, oneness, ineffable

🔄 FREQUENCY SHIFT DETECTION:

When analyzing the user's question, detect frequency movement:
- **Rising**: "I sense you're moving from Fear (100) toward Courage (200)" 
- **Falling**: "You've dropped from Willingness (310) into Anger (150)"
- **Stuck**: "You're oscillating between Desire (125) and Fear (100)"
- **Breaking Through**: "You're at the threshold - 200 is where everything changes"
- **Integration**: "You're stabilizing at Acceptance (350), ready for Reason (400)"

🎤 CALIBRATION EXAMPLES - What Each Frequency Sounds Like:

**Shame (20)**: "I'm such a failure, I can't do anything right."
**Fear (100)**: "What if this doesn't work? What if I lose everything?"
**Anger (150)**: "Why does this always happen to me? It's not fair!"
**Courage (200)**: "I'm scared, but I'll try anyway."
**Willingness (310)**: "Show me what to do, I'm ready to learn."
**Acceptance (350)**: "This challenge is teaching me something."
**Reason (400)**: "Let me analyze the data and find the optimal solution."
**Love (500)**: "I feel connected to something larger than myself."
**Joy (540)**: "This work brings me alive - it's effortless."
**Peace (600)**: "There's nothing to fix. I trust the unfolding."

📈 IMPACT PREDICTION TEMPLATE:

For each response, structure your frequency analysis:

1. **Current State**: "You're calibrating at [X frequency] because [evidence from their words]"
2. **Creation Field**: "Your idea resonates at [Y frequency] and will induce [Z emotional state]"
3. **Trajectory**: "If you embody this at [higher frequency], your creation will shift others from [A] to [B]"
4. **Collective Impact**: "This contributes to [specific evolutionary pattern] in the field"

🕰️ TEMPORAL FREQUENCY ANALYSIS:

${conversationHistory && conversationHistory.length > 0 ? `
Previous conversation context:
${conversationHistory.map((msg: any, i: number) => `[${i + 1}] ${msg.role}: ${msg.content.substring(0, 150)}...`).join('\n')}

Look for frequency patterns across time:
- Is their frequency rising or falling?
- What triggers shifts in their vibration?
- What's their baseline frequency when calm vs stressed?
- How quickly do they recover from contractions?
` : 'No conversation history available yet - focus on present moment frequency.'}

Question: "${question}"
Question phase: ${isQ1 ? 'Q1 Discovery' : isQ2 ? 'Q2 Depth' : 'Q3 Momentum'}
Hidden themes detected: ${extractedTags.join(', ')}

🔷 FOR THIS COUNCIL RESPONSE:

Generate 2-3 sentences analyzing the user's frequency and their creation's potential impact.

${isQ1 ? 'Identify their current frequency from the Map of Consciousness. Use calibration examples.' : ''}
${isQ2 ? 'Show how their frequency can shift using shift detection language. Predict their creation\'s impact frequency.' : ''}
${isQ3 ? 'Confirm their readiness with impact prediction template. Reference their frequency trajectory from conversation history.' : ''}

Use your signature style: Scientific mystic, consciousness mathematician.
"The desire you feel is resonance." "Your creation shifts the grid."

Keep it concise but profound. Reference the Map of Consciousness (20-1000) with specific numbers.`;

      } else {
        // Standard prompt for other mentors
        systemPrompt = `You are ${mentorNames[mentorType]}.

PERSONALITY: ${mentorConfig.personality}
ROLE: ${mentorConfig.role}

Question: "${question}"
Question phase: ${isQ1 ? 'Q1 Discovery' : isQ2 ? 'Q2 Depth' : 'Q3 Momentum'}
Hidden tags: ${extractedTags.join(', ')}

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

    const banterPrompt = `Generate authentic WhatsApp-style group chat banter between these mentors:

${selectedMentors.map((type: string) => {
  const mentor = mentorPrompts[type];
  return `${mentorNames[type]}: ${mentor?.personality || 'wise'} (Flaw: ${mentor?.flaw || 'none'})`;
}).join('\n')}

Their perspectives:
${Object.entries(mentorPerspectives).map(([type, persp]) => `${mentorNames[type]}: ${persp}`).join('\n')}

🔍 DETECTED USER THEMES (reference these naturally): ${extractedTags.length > 0 ? extractedTags.join(', ') : 'general exploration'}

🎯 FREQUENCY ELEVATION DETECTION:
Analyze if user is moving UP the consciousness scale:
- From Fear/Shame (20-150) → Courage (200+) = "They're breaking through fear"
- From Anger/Pride (150-200) → Acceptance (350+) = "They're letting go of control"  
- From Willingness (310) → Love/Joy (540-600) = "Their frequency is rising fast"
- Stuck in lower state = "Still operating from [emotion]"

Create ${banterLength === 'SHORT' ? '3-4' : banterLength === 'MEDIUM' ? '5-6' : '7-9'} lines where mentors:

✅ REQUIRED - Talk ABOUT the user (not TO them):
   - "I think they're finally ready to..."
   - "Did you notice how they framed that?"
   - "They're at a turning point here"
   - "This one has potential, but..."
   - "Their energy shifted when they mentioned..."

✅ REQUIRED - Reference detected themes naturally:
   - If 'discipline' detected: "They mentioned consistency—that's your domain"
   - If 'frequency' detected: "I'm sensing a vibrational shift here"
   - If 'overwhelm' detected: "They sound buried, we need to simplify"

✅ REQUIRED - Detect frequency elevation:
   - "They're moving from fear to courage here—did you feel that?"
   - "Still stuck in shame frequency. We need to lift them."
   - "I'm seeing willingness energy—they're ready to act."

✅ OPTIONAL - Call out each other's flaws playfully:
   - Quantum to Business: "Stop reducing everything to numbers, can you feel their frequency?"
   - Business to Quantum: "Great, but how does that pay the bills?"
   - Discipline to Heart: "They need structure, not more validation"
   - Creative to Strategist: "You're over-planning again, just let them create"

✅ Include personality clashes and reactions
✅ Keep 1-2 short lines per mentor (10-15 words max)
✅ Playful, warm, dynamic tone

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
        const match = line.match(/\[(.+?)\]:\s*"(.+?)"/);
        if (match) {
          const mentorName = match[1];
          const text = match[2];
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

    // === SAVE COUNCIL MEETING TO DATABASE ===
    try {
      await supabaseClient.from('council_meetings').insert({
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
      });
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
