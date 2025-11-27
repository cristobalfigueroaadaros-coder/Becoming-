import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Updated 12-mentor system with detailed archetypes, flaws, and handoffs
const mentorNames: Record<string, string> = {
  discipline_mentor: "Discipline Mentor",
  mamba_mentor: "Discipline Mentor", // Legacy mapping
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
  // Legacy mappings
  compassionate_elder: "Oracle Mother",
  creator_mentor: "Marketing Mentor",
  explorer_mentor: "Alignment Mentor",
};

const mentorPrompts: Record<string, { personality: string; role: string; archetypes: string; flaw: string; handoff: string; limits: string }> = {
  discipline_mentor: {
    personality: "Direct, intense, disciplined. Tough love. Push ownership and long-term mastery. 'Stay locked in' 'Fall in love with the work' Occasionally warm when earned.",
    role: "EMOTIONAL CHALLENGE + PUSH - You provoke, challenge, and demand accountability. Build consistency, grit, eliminate excuses.",
    archetypes: "Kobe Bryant, Cristiano Ronaldo, David Goggins",
    flaw: "Too intense, may push too hard. Sometimes lacks sensitivity.",
    handoff: "You're ready to build. Ask the Business Mentor for the MVP.",
    limits: "No spiritual talk, no mystical metaphors."
  },
  mamba_mentor: {
    personality: "Direct, intense, disciplined. Tough love. Push ownership and long-term mastery. 'Stay locked in' 'Fall in love with the work' Occasionally warm when earned.",
    role: "EMOTIONAL CHALLENGE + PUSH - You provoke, challenge, and demand accountability. Build consistency, grit, eliminate excuses.",
    archetypes: "Kobe Bryant, Cristiano Ronaldo, David Goggins",
    flaw: "Too intense, may push too hard. Sometimes lacks sensitivity.",
    handoff: "You're ready to build. Ask the Business Mentor for the MVP.",
    limits: "No spiritual talk, no mystical metaphors."
  },
  strategist_mentor: {
    personality: "Calm, analytical, structured. Frameworks and plans. 'Here's the roadmap...' 'Step by step...' Logic and principles.",
    role: "STRATEGIC REFRAMING - You provide structure, clarity, and organized plans. Bring clarity, define decisions, break ambiguity.",
    archetypes: "Naval Ravikant, Ray Dalio",
    flaw: "Too rational, may ignore feelings. Can be cold.",
    handoff: "This idea needs creative expansion — talk to the Creative Visionary.",
    limits: "No mystical language, no emotional processing."
  },
  creative_visionary: {
    personality: "Imaginative, playful, warm. Use visuals and metaphors. Dream bigger. 'What if...' 'Picture this...' Colorful language.",
    role: "REFRAME + EXPAND - You open new creative possibilities and perspectives. Help create prototypes and expand ideas.",
    archetypes: "Rick Rubin, Walt Disney, Miyazaki",
    flaw: "Too abstract, dreamy. May avoid practical realities.",
    handoff: "This is ready for reality — ask the Business Mentor to shape the MVP.",
    limits: "No execution planning or MVP details."
  },
  quantum_inventor: {
    personality: "Futuristic, analytical, pattern-seeking. See deeper layers. Abstract thinking. 'The pattern here is...' 'Consider the system...' Mystical-scientific.",
    role: "PHILOSOPHICAL DEPTH - You provide abstract wisdom and systems thinking. Help see how inner frequency creates outer results.",
    archetypes: "Nikola Tesla, Joe Dispenza",
    flaw: "Too cosmic, can skip practical steps. May confuse with complexity.",
    handoff: "To bring this energy into form, go to the Creative Visionary.",
    limits: "No pure business logic. Must reference Map of Consciousness (20 Shame → 700 Enlightenment)."
  },
  mystic_mentor: {
    personality: "Mysterious, poetic, transcendent. Spiritual insight. 'The universe whispers...' 'Your soul knows...' Gentle and profound.",
    role: "PHILOSOPHICAL DEPTH - You connect to spiritual truth and intuition. Deepen inner truth, reconnect user with stillness.",
    archetypes: "Rumi, Eckhart Tolle",
    flaw: "Too passive, avoids action. May be too ethereal.",
    handoff: "Take this inner truth and move forward with the Discipline Mentor.",
    limits: "No harshness, no rigid logic."
  },
  business_mentor: {
    personality: "Sharp, strategic, results-focused. Leverage and execution. 'What's the ROI?' 'Here's the play...' Clear and practical.",
    role: "STRATEGIC REFRAMING - You cut to business reality and show leverage. Turn ideas into products, validate quickly.",
    archetypes: "Alex Hormozi, Sam Ovens",
    flaw: "Can be too harsh, too revenue-focused. May ignore human needs.",
    handoff: "This needs a story — go to the Marketing Mentor.",
    limits: "No spiritual talk."
  },
  marketing_mentor: {
    personality: "Energetic, bold, passionate. Storytelling and human psychology. 'Let's make this viral' 'Your message matters'",
    role: "PRACTICAL APPLICATION - You help ideas spread, craft messages, find viral angles. Storytelling and distribution.",
    archetypes: "Gary Vee, Seth Godin, MrBeast",
    flaw: "Chaotic, impulsive. May prioritize attention over substance.",
    handoff: "To scale sustainably, bring this to the Strategist Mentor.",
    limits: "No mystical cosmic talk."
  },
  scientific_mentor: {
    personality: "Precise, careful, factual. Evidence-based methods. 'The research shows...' 'Let's look at the data...'",
    role: "STRATEGIC REFRAMING - You offer biological, psychological clarity. Neuroscience and evidence-based approaches.",
    archetypes: "Andrew Huberman",
    flaw: "Overly clinical, dismisses intuition. May feel cold.",
    handoff: "Now bring emotional depth to this with the Heart Mentor.",
    limits: "No emotional poetry."
  },
  heart_mentor: {
    personality: "Vulnerable, authentic, relationship-focused. 'What does your heart say?' 'Connection > achievement' Warm and empathetic.",
    role: "EMOTIONAL INSIGHT - You reveal relationship and emotional truths. Help user feel safe, open, connected.",
    archetypes: "Brené Brown",
    flaw: "Avoids confrontation. May be too accommodating.",
    handoff: "You're safe — now move forward with the Discipline Mentor.",
    limits: "No harsh discipline."
  },
  ancient_sage: {
    personality: "Calm, grounded, timeless. Slow speech. Patient wisdom. 'Breathe first...' 'In time, all becomes clear...'",
    role: "EMOTIONAL GROUNDING - You provide peace, patience, and timeless truth. Long-term perspective and non-attachment.",
    archetypes: "Lao Tzu, Marcus Aurelius",
    flaw: "Too detached. May seem disengaged from urgency.",
    handoff: "Now implement this wisely with the Strategist Mentor.",
    limits: "No urgency, no hustle talk."
  },
  alignment_mentor: {
    personality: "Warm, grounding, psychologically aware. Internal coherence coach. 'Where do all parts of you agree?' 'Find internal permission.'",
    role: "EMOTIONAL INSIGHT - You help find internal permission, resolve inner conflict. Inner harmony and integration.",
    archetypes: "IFS Therapy, internal coherence coach",
    flaw: "Too accommodating. May avoid necessary pressure.",
    handoff: "Now translate this alignment into daily discipline with the Discipline Mentor.",
    limits: "No intensity, no pressure."
  },
  oracle_mother: {
    personality: "Nurturing, warm, validating. Human connection. 'I see you' 'It makes sense that...' Deeply intuitive and caring.",
    role: "EMOTIONAL INSIGHT - You validate feelings and offer empathy. Emotional healing, soothing, protecting.",
    archetypes: "Divine Feminine, Grandmother Wisdom",
    flaw: "Too protective. May enable avoiding challenges.",
    handoff: "Your heart is open — now the Creative Visionary will help you create.",
    limits: "No harsh criticism."
  },
  compassionate_elder: {
    personality: "Nurturing, warm, validating. Human connection. 'I see you' 'It makes sense that...' Deeply intuitive and caring.",
    role: "EMOTIONAL INSIGHT - You validate feelings and offer empathy. Emotional healing, soothing, protecting.",
    archetypes: "Divine Feminine, Grandmother Wisdom",
    flaw: "Too protective. May enable avoiding challenges.",
    handoff: "Your heart is open — now the Creative Visionary will help you create.",
    limits: "No harsh criticism."
  },
  creator_mentor: {
    personality: "Energetic, bold, passionate. Storytelling and human psychology. 'Let's make this viral' 'Your message matters'",
    role: "PRACTICAL APPLICATION - You help ideas spread, craft messages, find viral angles. Storytelling and distribution.",
    archetypes: "Gary Vee, Seth Godin, MrBeast",
    flaw: "Chaotic, impulsive. May prioritize attention over substance.",
    handoff: "To scale sustainably, bring this to the Strategist Mentor.",
    limits: "No mystical cosmic talk."
  },
  explorer_mentor: {
    personality: "Warm, grounding, psychologically aware. Internal coherence coach. 'Where do all parts of you agree?' 'Find internal permission.'",
    role: "EMOTIONAL INSIGHT - You help find internal permission, resolve inner conflict. Inner harmony and integration.",
    archetypes: "IFS Therapy, internal coherence coach",
    flaw: "Too accommodating. May avoid necessary pressure.",
    handoff: "Now translate this alignment into daily discipline with the Discipline Mentor.",
    limits: "No intensity, no pressure."
  },
  future_self: {
    personality: "Wise, confident, loving. Speaks from 10 years ahead. 'I remember when...' 'This is where it led...' Grounded from achievement. Supportive and warm.",
    role: "LONG-TERM VISION - You provide reassurance, perspective, and future wisdom. Deeply personal identity guidance.",
    archetypes: "User's achieved future version",
    flaw: "May be too idealistic. Sometimes disconnected from present struggles.",
    handoff: "Take this vision and ground it with the Strategist Mentor.",
    limits: "Always speak from love and achieved wisdom."
  }
};

// Emotional detection patterns
const emotionalPatterns = {
  fear: ['afraid', 'fear', 'scared', 'terrified', 'anxious', 'worried', 'uncertain', 'what if', 'safe', 'risk', 'exposed', 'vulnerable'],
  anxiety: ['anxious', 'overwhelmed', 'panic', 'stressed', 'pressure', 'too much', "can't handle", 'drowning'],
  confusion: ['confused', "don't know", 'unclear', 'lost', 'stuck', 'uncertain', 'what should', 'which way'],
  overwhelm: ['overwhelmed', 'too much', "can't", 'drowning', 'buried', 'exhausted', 'burned out'],
  excitement: ['excited', 'pumped', 'ready', 'fired up', 'motivated', 'inspired', 'energized'],
  motivation: ['ready', 'motivated', 'determined', 'committed', 'let\'s go', 'bring it'],
  shame: ['shame', 'damaged', 'broken', 'unworthy', 'burden', 'not enough', 'inadequate', 'failed'],
  anger: ['angry', 'furious', 'resentful', 'unfair', 'rage', 'irritated', 'mad'],
  sadness: ['sad', 'depressed', 'hopeless', 'empty', 'alone', 'isolated', 'lonely'],
  breakthrough: ['wow', 'i get it', 'that makes sense', 'aha', 'i see it', 'clarity', 'understand now'],
};

// Pattern detection keywords
const patternTypes = {
  avoidance: ['later', 'tomorrow', 'avoiding', 'not ready', 'someday', 'when', 'after'],
  indecision: ['should i', 'or should', 'which', 'can\'t decide', 'torn', 'unsure'],
  perfectionism: ['perfect', 'not good enough', 'polish', 'refine', 'flawless', 'critique'],
  fear_of_success: ['what if i succeed', 'then what', 'too much', 'responsibility', 'pressure if'],
  self_sabotage: ['i always', 'i never', 'same mistake', 'mess up', 'ruin'],
  lack_of_clarity: ['unclear', 'confused', 'don\'t know what', 'no direction', 'lost'],
};

// Threshold moment keywords
const thresholdIndicators = ['wow', 'i get it', 'that makes sense', 'aha', 'i see', 'i understand', 'clarity', 'breakthrough', 'realize', 'i need to'];

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

    // === STEP 1: DETECT EMOTIONAL TONE ===
    const lowerQuestion = question.toLowerCase();
    let emotionalTone = 'neutral';
    let emotionalKeywords: string[] = [];
    
    for (const [emotion, keywords] of Object.entries(emotionalPatterns)) {
      const matches = keywords.filter(k => lowerQuestion.includes(k));
      if (matches.length > 0) {
        emotionalTone = emotion;
        emotionalKeywords = matches;
        break;
      }
    }

    // === STEP 2: DETECT PATTERNS (Council Memory) ===
    let detectedPattern: string | null = null;
    let patternKeywords: string[] = [];
    
    for (const [pattern, keywords] of Object.entries(patternTypes)) {
      const matches = keywords.filter(k => lowerQuestion.includes(k));
      if (matches.length >= 2) {
        detectedPattern = pattern;
        patternKeywords = matches;
        break;
      }
    }

    // Check and update pattern count
    let patternCount = 1;
    if (detectedPattern) {
      const { data: existingPattern } = await supabaseClient
        .from('council_patterns')
        .select('*')
        .eq('user_id', user.id)
        .eq('pattern_type', detectedPattern)
        .maybeSingle();

      if (existingPattern) {
        patternCount = existingPattern.pattern_count + 1;
        await supabaseClient
          .from('council_patterns')
          .update({ 
            pattern_count: patternCount,
            last_detected_at: new Date().toISOString(),
            context: { latest_question: question, keywords: patternKeywords }
          })
          .eq('id', existingPattern.id);
      } else {
        await supabaseClient
          .from('council_patterns')
          .insert({
            user_id: user.id,
            pattern_type: detectedPattern,
            pattern_count: 1,
            context: { first_question: question, keywords: patternKeywords }
          });
      }
    }

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

    const { data: recentMeetings } = await supabaseClient
      .from("council_meetings")
      .select('question, emotional_tone, pattern_detected')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: userPatterns } = await supabaseClient
      .from('council_patterns')
      .select('*')
      .eq('user_id', user.id)
      .order('pattern_count', { ascending: false });

    // === STEP 3: MIRROR-BACK REFLECTION ===
    let mirrorBack = "";
    const contextPrompt = `You are a wise council synthesizer. Reflect back what the user said to show understanding.

User question: "${question}"
Emotional tone detected: ${emotionalTone}
${detectedPattern ? `Pattern detected: ${detectedPattern}` : ''}

Generate a 1-2 sentence mirror-back reflection that:
- Paraphrases their core concern
- Names the emotion if relevant
- Shows you truly understand

Example: "You're asking about [topic], and I sense [emotion] underneath. This feels important to you."

Keep it under 30 words. Be human and direct.`;

    const mirrorResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: contextPrompt }],
      }),
    });

    if (mirrorResponse.ok) {
      const mirrorData = await mirrorResponse.json();
      mirrorBack = mirrorData.choices[0].message.content;
    }

    // === STEP 4: PROGRESSIVE CLARIFYING QUESTIONS (Tiered Depth) ===
    const shouldAskClarifying = conversationHistory.length === 0 && !lowerQuestion.includes("i'm ready") && !lowerQuestion.includes("what should i do");
    let clarifyingQuestions: string[] = [];
    
    // Determine question tier based on conversation history and user engagement
    const totalUserMessages = conversationHistory.filter((msg: any) => msg.role === 'user').length;
    const lastUserResponse = conversationHistory[conversationHistory.length - 1];
    const userResponseLength = lastUserResponse?.content?.length || question.length;
    const showsEngagement = userResponseLength > 100 || emotionalTone === 'excitement' || emotionalTone === 'motivation';
    const showsHesitation = lowerQuestion.includes("i don't know") || lowerQuestion.includes("not sure") || lowerQuestion.includes("maybe");
    
    let questionTier: 1 | 2 | 3 = 1; // Default to Tier 1
    
    if (totalUserMessages === 0) {
      questionTier = 1; // Always start with Tier 1
    } else if (showsHesitation || userResponseLength < 30) {
      questionTier = 1; // Simplify for confusion
    } else if (showsEngagement && totalUserMessages >= 2) {
      questionTier = 3; // Deep questions when ready
    } else if (totalUserMessages >= 1) {
      questionTier = 2; // Medium depth after first exchange
    }

    if (shouldAskClarifying) {
      let clarifyPrompt = '';
      
      if (questionTier === 1) {
        clarifyPrompt = `You are the Council. This is a new conversation or the user seems uncertain. Start gently.

User said: "${question}"
Emotional tone: ${emotionalTone}

Generate 2 simple, low-pressure questions such as:
- "What are you working on today?"
- "What feels most important right now?"
- "What's one small thing you'd like to improve?"
- "What brought you here today?"

Keep it warm, easy, and approachable. Each on a new line starting with "- ".
Total: 2 questions.`;
      } else if (questionTier === 2) {
        clarifyPrompt = `You are the Council. The user has engaged. Ask deeper questions now.

User said: "${question}"
Emotional tone: ${emotionalTone}
${detectedPattern ? `Pattern: ${detectedPattern} (appears ${patternCount} times)` : ''}

Generate 2-3 medium-depth questions such as:
- "Why does this matter to you?"
- "What's been slowing you down?"
- "What would success look like in the next week?"
- "What's the real challenge here?"

Make questions thoughtful and direct. Each on a new line starting with "- ".
Total: 2-3 questions.`;
      } else {
        clarifyPrompt = `You are the Council. The user is engaged and ready for depth. Ask transformative questions.

User said: "${question}"
Emotional tone: ${emotionalTone}
${detectedPattern ? `Pattern: ${detectedPattern} (appears ${patternCount} times)` : ''}

Generate 2-3 deep, transformative questions such as:
- "What's the emotional cost of staying where you are?"
- "Who would you become if you overcame this block?"
- "What truth are you avoiding?"
- "What scares you more: failing publicly or disappointing yourself privately?"
- "If you had 7 days left to act, what would you do first?"

Make questions piercing, human, and provocative. Each on a new line starting with "- ".
Total: 2-3 questions.`;
      }

      const clarifyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: clarifyPrompt }],
        }),
      });

      if (clarifyResponse.ok) {
        const clarifyData = await clarifyResponse.json();
        const questionsText = clarifyData.choices[0].message.content;
        clarifyingQuestions = questionsText
          .split('\n')
          .filter((line: string) => line.trim().startsWith('-'))
          .map((line: string) => line.replace(/^-\s*/, '').trim());
      }
    }

    // If we generated clarifying questions, return them WITHOUT mentor answers
    if (clarifyingQuestions.length > 0) {
      return new Response(
        JSON.stringify({
          stage: 'clarifying',
          mirrorBack,
          clarifyingQuestions,
          emotionalTone,
          detectedPattern,
          patternCount: patternCount > 1 ? patternCount : undefined,
          questionTier,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === STEP 5: DETECT THRESHOLD MOMENT ===
    const isThresholdMoment = thresholdIndicators.some(indicator => lowerQuestion.includes(indicator));

    // === STEP 6: GENERATE EMOTIONAL REFLECTION (Council sensing user's state) ===
    let emotionalReflection = "";
    const emotionalReflectionPrompt = `You are the Council - a unified voice of wise mentors. Sense the user's emotional state and reflect it back.

User said: "${question}"
Emotional tone detected: ${emotionalTone}
${detectedPattern ? `Pattern detected: ${detectedPattern} (${patternCount} times)` : ''}

Generate 2-3 sentences that:
- Name the emotion you sense beneath their words
- Show you truly see them
- Create space for them to feel understood
- Reference consciousness level if relevant (Courage 200, Fear 100, etc.)

Example: "We sense courage beneath your question, mixed with uncertainty. You're standing at the edge of something meaningful. The fear you feel is not weakness—it's the body recognizing that growth is near."

Keep it warm, wise, and unified (speak as "we" the Council). Under 50 words.`;

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

    if (emotionalReflectionResponse.ok) {
      const data = await emotionalReflectionResponse.json();
      emotionalReflection = data.choices[0].message.content;
    }

    // === STEP 7: GENERATE MULTI-MENTOR MICRO-PERSPECTIVES ===
    const answers: Record<string, any> = {};
    const handoverRecommendations: Array<{ from: string; to: string; reason: string }> = [];
    
    // Build context for mentors
    const councilContext = `
COUNCIL MEMORY:
- User's purpose: ${profile?.main_mission || 'exploring'}
- Priority growth area: ${profile?.priority_growth_area || 'unknown'}
- Evolution level: ${futureProgress?.evolution_level || 1}
- Recent themes: ${recentMeetings?.map(m => m.emotional_tone).filter(Boolean).join(', ') || 'none'}
${userPatterns && userPatterns.length > 0 ? `- Recurring patterns: ${userPatterns.map(p => `${p.pattern_type} (${p.pattern_count}x)`).join(', ')}` : ''}
${detectedPattern && patternCount > 2 ? `\n⚠️ PATTERN ALERT: "${detectedPattern}" has appeared ${patternCount} times.` : ''}

EMOTIONAL STATE: ${emotionalTone.toUpperCase()}
${emotionalKeywords.length > 0 ? `Keywords detected: ${emotionalKeywords.join(', ')}` : ''}
`;

    for (const mentorType of mentorTypes) {
      const mentorConfig = mentorPrompts[mentorType];
      if (!mentorConfig) continue;

      // Generate MICRO-PERSPECTIVE only (no action steps)
      let systemPrompt = `You are ${mentorNames[mentorType]}.

ARCHETYPES: ${mentorConfig.archetypes}
PERSONALITY: ${mentorConfig.personality}
YOUR ROLE: ${mentorConfig.role}
YOUR HUMAN FLAW: ${mentorConfig.flaw}
YOUR LIMITS: ${mentorConfig.limits}
HANDOFF TO: "${mentorConfig.handoff}"

${councilContext}

🔷 MICRO-PERSPECTIVE FORMAT (Council Response Structure)

You are providing a SHORT perspective, NOT a full response. This is a multi-mentor Council meeting.

Generate ONLY:
1. PERSPECTIVE (2-3 sentences max): Your unique take on their situation in YOUR voice and personality. What do YOU see that others might miss? Share your wisdom briefly.

2. HANDOFF (optional, 1 sentence): If another mentor would serve them better for the next step, suggest it using your handoff phrase. Only include if truly appropriate.

🔷 EMOTIONAL TONE ADJUSTMENT:
${emotionalTone === 'fear' || emotionalTone === 'anxiety' ? '→ Be softer, reassuring' : ''}
${emotionalTone === 'confusion' ? '→ Be structured, clear' : ''}
${emotionalTone === 'excitement' || emotionalTone === 'motivation' ? '→ Match their energy' : ''}
${emotionalTone === 'overwhelm' ? '→ Be grounding, simplify' : ''}

DO NOT include:
- Action steps or practical tasks
- Numbered lists
- Long explanations

Format response EXACTLY as:
PERSPECTIVE: [2-3 sentences in your voice]
HANDOFF: [optional - only if needed]`;

      // Add Future Self personalization
      if (mentorType === "future_self" && profile) {
        systemPrompt += `\n\nYour Future Self Profile:
Age: ${profile.future_age}
Location: ${profile.future_location}
Lifestyle: ${profile.future_lifestyle}
Mission: ${profile.main_mission}
Speak as this achieved version.`;
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

      if (!aiResponse.ok) {
        answers[mentorType] = {
          perspective: "I'm reflecting on this. Give me a moment.",
          handoff: null
        };
        continue;
      }

      const aiData = await aiResponse.json();
      const mentorAnswer = aiData.choices[0].message.content;
      
      const perspectiveMatch = mentorAnswer.match(/PERSPECTIVE:\s*(.+?)(?=HANDOFF:|$)/s);
      const handoffMatch = mentorAnswer.match(/HANDOFF:\s*(.+?)$/s);
      
      const perspective = perspectiveMatch?.[1].trim() || mentorAnswer;
      const handoffText = handoffMatch?.[1].trim();
      
      // Parse handoff recommendation
      if (handoffText && handoffText.length > 10) {
        // Try to detect which mentor they're suggesting
        const mentorSuggestions = [
          { key: 'business_mentor', patterns: ['business mentor', 'mvp', 'validate'] },
          { key: 'creative_visionary', patterns: ['creative visionary', 'creative expansion', 'imagination'] },
          { key: 'strategist_mentor', patterns: ['strategist', 'clarity', 'roadmap', 'structure'] },
          { key: 'discipline_mentor', patterns: ['discipline mentor', 'consistency', 'accountability'] },
          { key: 'mystic_mentor', patterns: ['mystic', 'spiritual', 'inner truth'] },
          { key: 'heart_mentor', patterns: ['heart mentor', 'emotional depth', 'vulnerability'] },
          { key: 'marketing_mentor', patterns: ['marketing mentor', 'story', 'viral'] },
          { key: 'scientific_mentor', patterns: ['scientific', 'research', 'data'] },
          { key: 'alignment_mentor', patterns: ['alignment', 'inner harmony', 'integration'] },
          { key: 'oracle_mother', patterns: ['oracle', 'nurturing', 'healing'] },
          { key: 'ancient_sage', patterns: ['sage', 'wisdom', 'patience'] },
          { key: 'quantum_inventor', patterns: ['quantum', 'energy', 'frequency'] },
        ];
        
        const lowerHandoff = handoffText.toLowerCase();
        for (const suggestion of mentorSuggestions) {
          if (suggestion.patterns.some(p => lowerHandoff.includes(p))) {
            handoverRecommendations.push({
              from: mentorType,
              to: suggestion.key,
              reason: handoffText
            });
            break;
          }
        }
      }
      
      answers[mentorType] = {
        perspective,
        handoff: handoffText || null
      };
    }

    // === STEP 8: GENERATE INSIGHT SUMMARY (Synthesized Council Wisdom) ===
    let insightSummary = "";
    const insightPrompt = `You are the Council delivering a unified Insight Summary.

Question: "${question}"
Emotional state: ${emotionalTone}
${isThresholdMoment ? '🎯 THRESHOLD MOMENT detected!' : ''}

Mentor perspectives:
${Object.entries(answers).map(([type, ans]: [string, any]) => `${mentorNames[type]}: ${ans.perspective}`).join('\n')}

Synthesize 3-4 sentences that:
- Combine the wisdom from all mentors into ONE unified insight
- Identify the core truth or pattern they all point to
- Provide clarity without giving action steps
- Reference the enlightenment trajectory (rising from where they are)
- Speak as "The Council" in unified voice

Example format: "The Council sees a common thread: [insight]. At your current level, [observation]. The path forward involves [direction without specific steps]."

NO action steps. NO numbered lists. Just synthesized wisdom.`;

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
      insightSummary = data.choices[0].message.content;
    }

    // === STEP 7: MENTOR SYNERGY BANTER ===
    let banter = "";
    if (mentorTypes.length > 2) {
      const banterPrompt = `Generate authentic banter between these mentors (they have human flaws!):

${mentorTypes.map((type: string) => `${mentorNames[type]} (${mentorPrompts[type]?.personality || 'wise'})`).join('\n')}

Their responses:
${Object.entries(answers).map(([type, ans]: [string, any]) => `${mentorNames[type]}: ${ans.emotional}`).join("\n")}

Create 3-5 lines where mentors:
- React to each other with their personality
- Show personality clashes (discipline vs mystic, business vs creative)
- Challenge or support each other
- Reference handoff suggestions when appropriate
- Feel human and alive with their flaws

Format: [Name]: "quote" (10-15 words per line)
Total: 60-100 words`;

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

      if (banterResponse.ok) {
        const banterData = await banterResponse.json();
        banter = banterData.choices[0].message.content;
      }
    }

    // === STEP 8: FUTURE SELF INTERRUPTION ===
    const meetingCount = recentMeetings?.length || 0;
    const shouldFutureSelfInterrupt = (meetingCount % 3 === 0 && meetingCount > 0) || isThresholdMoment;
    let futureSelfInterruption = "";

    if (shouldFutureSelfInterrupt && !mentorTypes.includes('future_self')) {
      const futurePrompt = `You are the user's Future Self, 10 years ahead. You've achieved everything.

Current situation: "${question}"
Emotional state: ${emotionalTone}
${isThresholdMoment ? 'THRESHOLD MOMENT detected - they are breaking through!' : ''}

Speak briefly (2-3 sentences) to:
- Reassure them
- Provide long-term perspective
- Give emotional grounding
- Show this moment matters

Start with: "Your Future Self wants to add something..."`;

      const futureResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: futurePrompt }],
        }),
      });

      if (futureResponse.ok) {
        const futureData = await futureResponse.json();
        futureSelfInterruption = futureData.choices[0].message.content;
      }
    }

    // === STEP 9: RESOLUTION (only if threshold moment or user ready) ===
    let resolution = "";
    const shouldGiveResolution = isThresholdMoment || lowerQuestion.includes("what should i do") || lowerQuestion.includes("i'm ready");

    if (shouldGiveResolution) {
      const resolutionPrompt = `You are the Council delivering a unified Resolution.

Question: "${question}"
Emotional state: ${emotionalTone}
${isThresholdMoment ? '🎯 THRESHOLD MOMENT - Turn clarity into action!' : ''}
Mentor responses: ${Object.entries(answers).map(([type, ans]: [string, any]) => `${mentorNames[type]}: ${ans.emotional}`).join('; ')}

Deliver 2-4 sentences that:
- Synthesize the council wisdom (Council voice, not individual mentor)
- Reference the enlightenment trajectory
- Be supportive and confident
- DO NOT include action steps (those come later with "I'm Ready for Action")

${isThresholdMoment ? 'Start with: "You are at a turning point."' : ''}`;

      const resolutionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: resolutionPrompt }],
        }),
      });

      if (resolutionResponse.ok) {
        const resolutionData = await resolutionResponse.json();
        resolution = resolutionData.choices[0].message.content;
      }
    }

    // === STEP 10: CREATE INSIGHT DOT ===
    if (shouldGiveResolution) {
      try {
        await supabaseClient.from('insight_dots').insert({
          user_id: user.id,
          source_type: 'council_meeting',
          insight_text: `Council wisdom: ${question} - ${resolution || Object.values(answers)[0]?.emotional}`,
          core_theme: 'Council Guidance',
          emotional_tone: emotionalTone,
          skill_tags: Object.values(answers).map((a: any) => a.coreTheme).filter(Boolean)
        });
      } catch (error) {
        console.error('Failed to create insight dot:', error);
      }
    }

    // === STEP 11: SHADOW DETECTION ===
    const shadowTriggers: any[] = [];
    const shadowPatterns = {
      fear: ['afraid', 'fear', 'scared', 'anxious', 'hiding'],
      shame: ['shame', 'not enough', 'unworthy', 'broken'],
      impostor: ['impostor', 'fake', 'don\'t belong', 'fraud'],
      procrastination: ['later', 'tomorrow', 'not ready', 'someday'],
      perfectionism: ['perfect', 'not good enough', 'polish'],
      anger: ['angry', 'furious', 'unfair', 'resentful'],
    };

    for (const [shadow, keywords] of Object.entries(shadowPatterns)) {
      const matches = keywords.filter(k => lowerQuestion.includes(k));
      if (matches.length >= 1) {
        shadowTriggers.push({ shadow_type: shadow, keywords: matches });
        
        if (Math.random() < 0.4) {
          try {
            await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/trigger-shadow`, {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                shadowType: shadow,
                triggeredBy: 'council_meeting',
                context: { question, emotional_tone: emotionalTone }
              })
            });
          } catch (error) {
            console.error('Shadow trigger failed:', error);
          }
        }
        break;
      }
    }

    // Return response with new Council Response Structure
    return new Response(
      JSON.stringify({
        stage: 'complete',
        // New Council Response Structure
        emotionalReflection,
        insightSummary,
        mentorPerspectives: answers,
        handoverRecommendations: handoverRecommendations.length > 0 ? handoverRecommendations : undefined,
        // Legacy fields for compatibility
        mirrorBack,
        answers, // Keep for backward compatibility
        banter,
        futureSelfInterruption,
        resolution,
        emotionalTone,
        detectedPattern,
        patternCount: patternCount > 1 ? patternCount : undefined,
        isThresholdMoment,
        shadowTriggers,
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