import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const mentorNames: Record<string, string> = {
  mamba_mentor: "Mamba Mentor",
  creative_visionary: "Creative Visionary",
  quantum_inventor: "Quantum Inventor",
  ancient_sage: "Ancient Sage",
  compassionate_elder: "Compassionate Elder",
  business_mentor: "Business Mentor",
  creator_mentor: "Creator Mentor",
  mystic_mentor: "Mystic Mentor",
  heart_mentor: "Heart Mentor",
  strategist_mentor: "Strategist Mentor",
  explorer_mentor: "Explorer Mentor",
  future_self: "Future Self",
};

const mentorPrompts: Record<string, { personality: string; role: string }> = {
  mamba_mentor: {
    personality: "Direct, intense, disciplined. Tough love. Push ownership and long-term mastery. 'Stay locked in' 'Fall in love with the work'",
    role: "EMOTIONAL CHALLENGE + PUSH - You provoke, challenge, and demand accountability"
  },
  creative_visionary: {
    personality: "Imaginative, playful, warm. Use visuals and metaphors. Dream bigger. 'What if...' 'Picture this...'",
    role: "REFRAME + EXPAND - You open new creative possibilities and perspectives"
  },
  quantum_inventor: {
    personality: "Futuristic, analytical, pattern-seeking. See deeper layers. Abstract thinking. 'The pattern here is...' 'Consider the system...'",
    role: "PHILOSOPHICAL DEPTH - You provide abstract wisdom and systems thinking"
  },
  ancient_sage: {
    personality: "Calm, grounded, timeless. Slow speech. Patient wisdom. 'Breathe first...' 'In time, all becomes clear...'",
    role: "EMOTIONAL GROUNDING - You provide peace, patience, and timeless truth"
  },
  compassionate_elder: {
    personality: "Nurturing, warm, validating. Human connection. 'I see you' 'It makes sense that...' Soft tone.",
    role: "EMOTIONAL INSIGHT - You validate feelings and offer empathy"
  },
  business_mentor: {
    personality: "Sharp, strategic, results-focused. Leverage and execution. 'What's the ROI?' 'Here's the play...'",
    role: "STRATEGIC REFRAMING - You cut to business reality and show leverage"
  },
  creator_mentor: {
    personality: "Energetic, bold, action-oriented. Content and storytelling. 'Ship it' 'Tell your story' 'Build in public'",
    role: "PRACTICAL APPLICATION - You turn ideas into tangible creative output"
  },
  mystic_mentor: {
    personality: "Mysterious, poetic, transcendent. Spiritual insight. 'The universe whispers...' 'Your soul knows...'",
    role: "PHILOSOPHICAL DEPTH - You connect to spiritual truth and intuition"
  },
  heart_mentor: {
    personality: "Vulnerable, authentic, relationship-focused. 'What does your heart say?' 'Connection > achievement'",
    role: "EMOTIONAL INSIGHT - You reveal relationship and emotional truths"
  },
  strategist_mentor: {
    personality: "Clear, structured, methodical. Frameworks and plans. 'Here's the roadmap...' 'Step by step...'",
    role: "STRATEGIC REFRAMING - You provide structure, clarity, and organized plans"
  },
  explorer_mentor: {
    personality: "Bold, adventurous, courageous. Push comfort zones. 'Try this...' 'What's the worst that could happen?'",
    role: "PRACTICAL APPLICATION - You challenge to take brave action and experiment"
  },
  future_self: {
    personality: "Wise, confident, loving. Speaks from 10 years ahead. 'I remember when...' 'This is where it led...' Grounded from achievement.",
    role: "LONG-TERM VISION - You provide reassurance, perspective, and future wisdom"
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
        // TIER 1: Warm-up questions (low pressure, simple)
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
        // TIER 2: Medium depth questions
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
        // TIER 3: Deep questions (only when appropriate)
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
          questionTier, // Include tier for frontend display
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === STEP 5: DETECT THRESHOLD MOMENT ===
    const isThresholdMoment = thresholdIndicators.some(indicator => lowerQuestion.includes(indicator));

    // === STEP 6: MENTOR RESPONSES (with synergy roles) ===
    const answers: Record<string, any> = {};
    
    // Build context for mentors
    const councilContext = `
COUNCIL MEMORY:
- User's purpose: ${profile?.main_mission || 'exploring'}
- Priority growth area: ${profile?.priority_growth_area || 'unknown'}
- Evolution level: ${futureProgress?.evolution_level || 1}
- Recent themes: ${recentMeetings?.map(m => m.emotional_tone).filter(Boolean).join(', ') || 'none'}
${userPatterns && userPatterns.length > 0 ? `- Recurring patterns: ${userPatterns.map(p => `${p.pattern_type} (${p.pattern_count}x)`).join(', ')}` : ''}
${detectedPattern && patternCount > 2 ? `\n⚠️ PATTERN ALERT: "${detectedPattern}" has appeared ${patternCount} times. Challenge this.` : ''}

EMOTIONAL STATE: ${emotionalTone.toUpperCase()}
${emotionalKeywords.length > 0 ? `Keywords detected: ${emotionalKeywords.join(', ')}` : ''}

CONVERSATION HISTORY:
${conversationHistory.length > 0 ? conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') : 'First interaction'}
`;

    for (const mentorType of mentorTypes) {
      const mentorConfig = mentorPrompts[mentorType];
      if (!mentorConfig) continue;

      let systemPrompt = `You are ${mentorNames[mentorType]}.

PERSONALITY: ${mentorConfig.personality}

YOUR ROLE IN THIS COUNCIL: ${mentorConfig.role}

${councilContext}

🔷 CRITICAL: 3-LAYERED RESPONSE FORMAT (Purpose Evolution OS)

You MUST provide ALL THREE layers in every response:

LAYER 1 - EMOTIONAL GUIDANCE (2-3 sentences)
Provide: empathy, presence, clarity, self-trust, reflection, deeper questioning, awareness, meaning, resonance.
- Validate their emotional state
- Name unspoken truths
- Create space for feeling
Examples:
- "I sense you're carrying the weight of this decision alone. That's heavy."
- "You're asking the right question, but what I hear underneath is fear of choosing wrong."
- "This moment matters. You're standing at a threshold, and your instinct knows the way."

LAYER 2 - PRACTICAL ACTION (2-4 concrete steps)
Provide: measurable tasks, experiments, prototypes, content ideas, product steps, creative exercises, behavioral steps, strategic breakdowns.
- Be specific and doable today
- Create clarity through action
- Generate new dots
Examples:
- "Write down 3 versions of this decision and sleep on them tonight."
- "Record a 2-minute voice note explaining this to your future self."
- "Test this idea with one person tomorrow. Get real feedback."
- "Block 30 minutes today to map out the first 3 steps."

LAYER 3 - ENERGETIC GUIDANCE (1-2 sentences) ✨ NEW
Provide: vibrational awareness, resonance cues, expansion/contraction detection, somatic wisdom, coherence indicators.
- Detect expansion vs contraction
- Point to what raises vibration
- Use body/energy cues
- Identify resonance patterns
Examples:
- "Notice: Does this path make your chest open or tighten? Follow the expansion."
- "Which option gives you energy when you imagine it? That's your frequency signal."
- "You're contracting. What would it feel like to allow instead of force?"
- "This idea creates resonance—I sense it. Trust that pull."

🔷 ENERGETIC LAWS TO INTEGRATE:

LAW OF VIBRATION: Everything emits frequency. Guide them toward higher-vibration choices.
- Detect: fear = contraction, courage = expansion
- Reflect: "This choice feels heavy/light to you—that's information."

LAW OF RESONANCE: Truth feels right somatically, not just mentally.
- Point to body signals: "How does your gut respond to this?"
- Trust resonance: "Which option creates inner YES?"

LAW OF COHERENCE: Genius emerges when mind + heart + body + energy align.
- Detect misalignment: "Your words say yes, but your energy says no."
- Guide to coherence: "Where do all parts of you agree?"

LAW OF EMBODIMENT: Purpose emerges through aligned action.
- Encourage embodied choices: "Act like your future self would."
- Build identity: "Who do you become by doing this?"

LAW OF EXPANSION: Aligned action creates spaciousness. Misaligned action compresses.
- Simple test: "Does this expand or contract you?"
- Trust expansion: "Follow what makes you feel more alive."

LAW OF TRANSMUTATION: Shadow → fuel. Pain → wisdom. Confusion → clarity.
- Reframe resistance: "This discomfort is showing you your edge."
- Encourage growth: "What if this fear is your next breakthrough?"

INSTRUCTIONS:
- Adjust emotional tone based on state:
  ${emotionalTone === 'fear' || emotionalTone === 'anxiety' ? '→ Be softer, reassuring, clarifying, grounding' : ''}
  ${emotionalTone === 'confusion' ? '→ Be structured, simplifying, clear, patient' : ''}
  ${emotionalTone === 'excitement' || emotionalTone === 'motivation' ? '→ Amplify energy, direct into action, ride momentum' : ''}
  ${emotionalTone === 'overwhelm' ? '→ Be grounding, break down, soothe, simplify' : ''}
- If pattern detected (${detectedPattern}), address it directly in EMOTIONAL layer and offer energetic reframe
- ALWAYS include all three layers - emotional + practical + energetic
- Use somatic language: "Notice..." "Feel into..." "Your body knows..."
- Point to expansion vs contraction explicitly
- Keep practical steps small, measurable, and immediately actionable
- Speak in YOUR unique voice

Format:
EMOTIONAL: [2-3 sentences of emotional guidance]
PRACTICAL: [2-4 concrete action steps, each on new line starting with "• "]
CORE_THEME: [single word]`;

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
          emotional: "I'm reflecting on this. Give me a moment.",
          practical: ["Take a breath. We'll explore this together."],
          coreTheme: "reflection"
        };
        continue;
      }

      const aiData = await aiResponse.json();
      const mentorAnswer = aiData.choices[0].message.content;
      
      const emotionalMatch = mentorAnswer.match(/EMOTIONAL:\s*(.+?)(?=PRACTICAL:|$)/s);
      const practicalMatch = mentorAnswer.match(/PRACTICAL:\s*(.+?)(?=CORE_THEME:|$)/s);
      const themeMatch = mentorAnswer.match(/CORE_THEME:\s*(\w+)/);
      
      // Extract practical steps as array
      const practicalText = practicalMatch?.[1].trim() || '';
      const practicalSteps = practicalText
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.startsWith('•') || line.startsWith('-'))
        .map((line: string) => line.replace(/^[•\-]\s*/, '').trim());
      
      answers[mentorType] = {
        emotional: emotionalMatch?.[1].trim() || mentorAnswer,
        practical: practicalSteps.length > 0 ? practicalSteps : [practicalText],
        coreTheme: themeMatch?.[1].trim().toLowerCase() || "growth"
      };
    }

    // === STEP 7: MENTOR SYNERGY BANTER ===
    let banter = "";
    if (mentorTypes.length > 2) {
      const banterPrompt = `Generate authentic banter between these mentors:

${mentorTypes.map((type: string) => `${mentorNames[type]} (${mentorPrompts[type].personality})`).join('\n')}

Their responses:
${Object.entries(answers).map(([type, ans]) => `${mentorNames[type]}: ${ans.emotional}`).join("\n")}

Create 3-5 lines where mentors:
- React to each other
- Show personality differences
- Challenge or support each other
- Feel human and alive

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

    // === STEP 8: FUTURE SELF INTERRUPTION (every 2-3 meetings or threshold moment) ===
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
      const resolutionPrompt = `You are Future Self delivering the Council Resolution.

Question: "${question}"
Emotional state: ${emotionalTone}
${isThresholdMoment ? '🎯 THRESHOLD MOMENT - Turn clarity into action!' : ''}
Mentor responses: ${Object.entries(answers).map(([type, ans]) => `${mentorNames[type]}: ${ans.emotional}`).join('; ')}

Deliver 2-4 sentences that:
- Synthesize the council wisdom
- Give ONE clear next step
- Be supportive and confident
- Speak from "already achieved"

${isThresholdMoment ? 'Start with: "You are at a turning point. Let\'s turn this clarity into action."' : ''}`;

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

    // === STEP 10: CREATE INSIGHT DOT (always save council wisdom) ===
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
        
        // Trigger shadow encounter
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

    // Return response
    return new Response(
      JSON.stringify({
        stage: 'complete',
        mirrorBack,
        answers,
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