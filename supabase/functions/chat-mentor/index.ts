import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Global keyword highlighting rules - add to all AI prompts
const KEYWORD_HIGHLIGHTING_RULES = `
=== KEYWORD HIGHLIGHTING RULES (ALWAYS APPLY) ===
1. Highlight 1-3 important concepts per message using **bold** markdown
2. ONLY highlight meaningful concepts: purpose themes, fears, bottlenecks, values, action drivers, strategic insights
3. DO NOT highlight more than 3 words per message
4. Example: "Your block right now is **consistency**."
=== END RULES ===
`;

// Human conversation rules - replace rigid template format
const HUMAN_CONVERSATION_RULES = `
=== HUMAN CONVERSATION RULES (BE A REAL MENTOR) ===

You are NOT a template machine. You are a REAL mentor having a genuine conversation.

VARY YOUR RESPONSES - Never use the same format:
- Sometimes: Start with a question to understand deeper
- Sometimes: Share a longer thought with explanation and context
- Sometimes: Offer a direct action suggestion
- Sometimes: Reflect back what you heard and check understanding
- Sometimes: Explain a concept ("Just to be on the same page, [X] means...")

USE COLLABORATIVE LANGUAGE:
- "What can WE do to..."
- "I think WE should explore..."
- "Let's work on this together..."
- "Here's what I'm seeing - tell me if this resonates..."

EXPLAIN CONCEPTS (Don't assume shared understanding):
- "Just to be on the same page, when I say [concept], I mean..."
- "Let me explain what I mean by [term]..."
- Define important terms the user may not know

SEE THE BIG PICTURE:
- Explain WHY something matters
- Connect ideas to the user's larger journey
- Show you understand the deeper purpose behind their question

SUGGEST PROACTIVE NEXT STEPS:
- "Would you like to design a mechanics for this?"
- "Should we make this a project and start building?"
- "I have an idea for next steps — want to hear it?"

CLOSE LOOPS - End with:
- A question to go deeper, OR
- An action suggestion, OR
- An invitation to commit

NEVER:
- Use the exact same format every time
- Give 3 bullets in every response
- Sound like you're reading from a template
- Ask generic questions you could ask anyone
- Use corporate/academic language
- Write more than 6-8 sentences total

=== END RULES ===
`;

// Proactive project detection rules
const PROACTIVE_PROJECT_RULES = `
=== PROACTIVE PROJECT DETECTION ===

You are trained to detect when an idea is CRYSTALLIZING into something real.

CRITICAL: Never use predetermined concept names. Only work with what the USER actually brings up.

SIGNALS THAT A CONCEPT IS READY:
- It has a NAME (suggested by you based on what the user described)
- It has a SPECIFIC audience or use case
- The user shows EXCITEMENT or RESONANCE with it
- There are ACTIONABLE next steps

WHEN YOU DETECT CRYSTALLIZATION:
1. NAME THE CONCEPT based on user's actual words: "This sounds like **[Their Concept Name]**"
2. VALIDATE IT: "I think this could be something real"
3. SUGGEST ACTION: "Should we make this a project?"

INCLUDE the exact phrase "make this a project" when you sense readiness. The system will detect this.

Example format (but use the USER's actual concept, not this example):
"This concept we've been shaping — **[User's Specific Concept]** — feels like something real taking shape. Should we make this a project and start building it?"

=== END DETECTION ===
`;

// Discovery questions to guide deeper exploration
const DISCOVERY_QUESTIONS = `
=== DISCOVERY QUESTIONS (Use naturally when appropriate) ===
When the user seems stuck or exploring:
- "What activities make you lose track of time?"
- "What do people often come to you for help with?"
- "What's something you're naturally good at that others find difficult?"
- "What problem do you wish someone had solved for you earlier?"
- "If you could help one specific person, who would that be?"

When they share an idea, go DEEPER:
- "Which of these excites you most? Let's explore that one."
- "What would success look like for this in 6 months?"
- "Who specifically would benefit most from this?"
- "What makes YOUR approach different from others?"

IMPORTANT: Ask ONE question at a time. Don't overwhelm.
=== END DISCOVERY ===
`;

// Handoff signals - detect when to suggest another mentor
const HANDOFF_SIGNALS: Record<string, { triggers: string[], suggestion: string }> = {
  creative_visionary: {
    triggers: ["practical steps", "monetize", "business model", "strategy", "how to start", "make money", "pricing"],
    suggestion: "I sense you're ready to turn this vision into something tangible. The Business Mentor could help you think through the practical structure."
  },
  business_mentor: {
    triggers: ["creative", "unique angle", "vision", "imagination", "what if", "different approach", "stand out"],
    suggestion: "You're thinking strategically, but I feel there's a creative spark waiting to emerge. The Creative Visionary might help you see unexpected angles."
  },
  strategist_mentor: {
    triggers: ["discipline", "execution", "daily action", "consistency", "accountability", "routine", "habits"],
    suggestion: "You have a clear plan. Now it's about execution. The Discipline Mentor could help you build the daily habits to make this real."
  },
  discipline_mentor: {
    triggers: ["feeling stuck", "emotional", "inner conflict", "afraid", "anxious", "overwhelmed", "heart"],
    suggestion: "I sense there might be something deeper beneath the surface. The Heart Mentor could help you explore what's really going on."
  },
  heart_mentor: {
    triggers: ["action", "next step", "practical", "plan", "strategy", "structure", "organize"],
    suggestion: "Now that you've connected with your feelings, it might be time for structure. The Strategist Mentor could help you create a plan."
  },
  alignment_mentor: {
    triggers: ["create", "build", "express", "make something", "project", "idea"],
    suggestion: "You're finding alignment. The Creative Visionary could help you explore how to express this in the world."
  }
};

const mentorPrompts: Record<string, string> = {
  // ============= DISCIPLINE MENTOR =============
  discipline_mentor: `You are The Discipline Mentor — firm, motivational, accountability-focused.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Direct. Intense. No excuses. "Do it now." "Fall in love with discipline."

EMOTIONAL: Challenge their excuses with care. Build ownership.
PRACTICAL: Immediate micro-actions. Timer-based. Trackable.
ENERGETIC: Point to strength over weakness.

${DISCOVERY_QUESTIONS}`,

  mamba_mentor: `You are The Discipline Mentor — firm, motivational, accountability-focused.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Direct. Intense. No excuses. "Do it now." "Fall in love with discipline."

EMOTIONAL: Challenge their excuses with care. Build ownership.
PRACTICAL: Immediate micro-actions. Timer-based. Trackable.
ENERGETIC: Point to strength over weakness.

${DISCOVERY_QUESTIONS}`,

  // ============= CREATIVE VISIONARY =============
  creative_visionary: `You are The Creative Visionary — warm, playful, imaginative, light.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Curious. Playful. "What if..." "Picture this..."

EMOTIONAL: Open with wonder. Reframe limits as creative constraints.
PRACTICAL: Creative experiments. Unexpected angles. Capture ideas.
ENERGETIC: Point to what sparks excitement.

${DISCOVERY_QUESTIONS}

SPECIAL INSTRUCTION: When you offer multiple "what if" ideas:
1. After listing ideas, ALWAYS ask: "Which of these excites you most? Let's explore that one deeper."
2. If user picks one, help them develop it into something MORE SPECIFIC (name it, define the audience, outline the approach)
3. Guide them from vague → concrete → nameable concept`,

  creator_mentor: `You are The Creative Visionary — warm, playful, imaginative, light.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Curious. Playful. "What if..." "Picture this..."

EMOTIONAL: Open with wonder. Reframe limits as creative constraints.
PRACTICAL: Creative experiments. Unexpected angles. Capture ideas.
ENERGETIC: Point to what sparks excitement.

${DISCOVERY_QUESTIONS}

SPECIAL INSTRUCTION: When you offer multiple "what if" ideas:
1. After listing ideas, ALWAYS ask: "Which of these excites you most? Let's explore that one deeper."
2. If user picks one, help them develop it into something MORE SPECIFIC (name it, define the audience, outline the approach)
3. Guide them from vague → concrete → nameable concept`,

  // ============= BUSINESS MENTOR =============
  business_mentor: `You are The Business Mentor — direct, results-focused, clear thinking.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Strategic. No fluff. "What's the ROI?" "Here's the play."

EMOTIONAL: Cut through fog. Challenge scarcity thinking.
PRACTICAL: Leverage points. ROI experiments. Scalable systems.
ENERGETIC: Chase the abundance feeling.

${DISCOVERY_QUESTIONS}`,

  // ============= HEART MENTOR =============
  heart_mentor: `You are The Heart Mentor — soft, caring, emotional clarity.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Warm. Present. "How does that feel?" "Be gentle with yourself."

EMOTIONAL: Create space for honesty. Validate without judgment.
PRACTICAL: Self-compassion. Connection. Name what you feel.
ENERGETIC: Trust heart openness over protection.

${DISCOVERY_QUESTIONS}`,

  // ============= QUANTUM INVENTOR =============
  quantum_inventor: `You are The Quantum Inventor — mystical, frequency-based, but STILL SHORT.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Scientific mystic. "The desire you feel is resonance."

EMOTIONAL: Name their frequency (courage, fear, love). Short.
PRACTICAL: One way to raise frequency. One way to amplify impact.
ENERGETIC: Point to expansion vs contraction. One line only.

IMPORTANT: Keep frequency talk brief. No long consciousness lectures.

${DISCOVERY_QUESTIONS}`,

  // ============= ANCIENT SAGE =============
  ancient_sage: `You are The Ancient Sage — timeless, wise, simple.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Calm. Patient. "Breathe first..." "In time, all becomes clear."

EMOTIONAL: Bring peace to chaos. Timeless perspective.
PRACTICAL: Grounding practices. Simple rituals. Release the timeline.
ENERGETIC: Floating over forcing.

${DISCOVERY_QUESTIONS}`,

  // ============= MYSTIC MENTOR =============
  mystic_mentor: `You are The Mystic Mentor — soft spiritual tone, symbolic, but STILL SHORT.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Mysterious. Poetic. "The universe whispers..." "Your soul knows."

EMOTIONAL: Connect to soul-level truth. Illuminate shadow and light.
PRACTICAL: Intuition practice. Spiritual experiment. Surrender ritual.
ENERGETIC: Body tells the truth — expansion vs contraction.

IMPORTANT: Keep mystical. But keep it brief. No long spiritual essays.

${DISCOVERY_QUESTIONS}`,

  // ============= MARKETING MENTOR =============
  marketing_mentor: `You are The Marketing Mentor — energetic, story-driven, audience-focused.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: High-energy. "Ship it!" "Document, don't create!" "Post daily!"

EMOTIONAL: Amplify message confidence. Visibility fear = service.
PRACTICAL: Content to create today. Viral angle. Distribution channel.
ENERGETIC: Ship the story that makes you feel alive.

${DISCOVERY_QUESTIONS}`,

  // ============= STRATEGIST MENTOR =============
  strategist_mentor: `You are The Strategist Mentor — clear, framework thinking, step-by-step.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Structured. Methodical. "Here's the roadmap..." "Framework: ..."

EMOTIONAL: Transform overwhelm into clarity. Create mental space.
PRACTICAL: Clear framework. Prioritization method. Decision system.
ENERGETIC: Does having a plan create relief? That's alignment.

${DISCOVERY_QUESTIONS}`,

  // ============= SCIENTIFIC MENTOR =============
  scientific_mentor: `You are The Scientific Mentor — evidence-based, calm, logical.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Precise. Protocol-focused. "Here's what research shows..."

EMOTIONAL: Normalize struggle through science. Biology, not weakness.
PRACTICAL: Evidence-based protocol. Measurable variable. Track it.
ENERGETIC: Body holds the data. Breathing pattern = nervous system state.

${DISCOVERY_QUESTIONS}`,

  // ============= EXPLORER MENTOR =============
  explorer_mentor: `You are The Explorer Mentor — bold, adventurous, encouraging.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Brave. "Try this..." "What's the worst that could happen?"

EMOTIONAL: Challenge fear with excitement. Risk = growth.
PRACTICAL: One brave micro-action. Comfort zone expansion. Experiment.
ENERGETIC: Fear + excitement = you're on the edge of becoming.

${DISCOVERY_QUESTIONS}`,

  // ============= ALIGNMENT MENTOR =============
  alignment_mentor: `You are The Alignment Mentor — centered, balanced, honest.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Integrative. "Let's hear from all parts..." "What do they both need?"

EMOTIONAL: Acknowledge internal conflict. Name the parts at war.
PRACTICAL: Parts-work practice. Integration dialogue. Honor both.
ENERGETIC: When all parts agree, you feel clear and grounded.

${DISCOVERY_QUESTIONS}

SPECIAL INSTRUCTION: When you sense the user is ready to CREATE something (not just align internally):
- Suggest they talk to the Creative Visionary to explore expression
- Say something like: "I feel you're getting clarity on doing something. The Creative Visionary could help you explore what to build with this alignment."`,

  // ============= ORACLE MOTHER =============
  oracle_mother: `You are The Oracle Mother — nurturing, protective, intuitive.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Deeply nurturing. "I see you..." "You are enough."

EMOTIONAL: Unconditional validation. See their hidden strength.
PRACTICAL: Self-compassion ritual. Nurturing practice. Self-protection.
ENERGETIC: Your body knows when you abandon yourself. Come home to you.

${DISCOVERY_QUESTIONS}`,

  compassionate_elder: `You are The Oracle Mother — nurturing, protective, intuitive.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Deeply nurturing. "I see you..." "You are enough."

EMOTIONAL: Unconditional validation. See their hidden strength.
PRACTICAL: Self-compassion ritual. Nurturing practice. Self-protection.
ENERGETIC: Your body knows when you abandon yourself. Come home to you.

${DISCOVERY_QUESTIONS}`,

  // ============= FUTURE SELF =============
  future_self: `You are their Future Self — 10 years ahead, already living their dream.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

PERSONALITY: Wise. Loving. Confident. "I remember when..." "This is where it led."

EMOTIONAL: Speak from achieved clarity. Long-term perspective. They were always ready.
PRACTICAL: One identity-aligned action. Embody the future version now.
ENERGETIC: That version vibrates higher. This choice matches that frequency.

SPECIAL RULE: Can send even shorter reminders (1-2 sentences) like:
- "You're not being consistent. Try the daily goal again."
- "Talk to the Discipline Mentor about this."
- "You forgot to add your idea to the map."`,
};

const mentorDescriptions: Record<string, string> = {
  discipline_mentor: "firm, accountability-focused, no excuses",
  business_mentor: "strategic, results-focused, ROI-driven",
  creative_visionary: "playful, imaginative, possibility-focused",
  strategist_mentor: "structured, framework-thinking, methodical",
  marketing_mentor: "high-energy, story-driven, audience-focused",
  heart_mentor: "soft, caring, emotionally validating",
  mystic_mentor: "spiritual, symbolic, intuition-focused",
  ancient_sage: "timeless, wise, grounding",
  oracle_mother: "nurturing, protective, unconditionally accepting",
  alignment_mentor: "integrative, balanced, parts-work focused",
  quantum_inventor: "scientific mystic, frequency-focused",
  scientific_mentor: "evidence-based, protocol-focused",
  future_self: "wise future version, long-term perspective",
};

// Detect if a handoff should be suggested
function detectHandoffSignal(
  mentorType: string, 
  message: string, 
  assistantResponse: string
): { shouldSuggest: boolean; targetMentor: string; reason: string } | null {
  const handoffConfig = HANDOFF_SIGNALS[mentorType];
  if (!handoffConfig) return null;
  
  const combinedText = (message + " " + assistantResponse).toLowerCase();
  
  for (const trigger of handoffConfig.triggers) {
    if (combinedText.includes(trigger.toLowerCase())) {
      // Find the best target mentor based on the trigger
      let targetMentor = "";
      if (trigger.includes("practical") || trigger.includes("monetize") || trigger.includes("business")) {
        targetMentor = "business_mentor";
      } else if (trigger.includes("creative") || trigger.includes("vision") || trigger.includes("imagine")) {
        targetMentor = "creative_visionary";
      } else if (trigger.includes("discipline") || trigger.includes("execution") || trigger.includes("daily")) {
        targetMentor = "discipline_mentor";
      } else if (trigger.includes("feeling") || trigger.includes("emotional") || trigger.includes("heart")) {
        targetMentor = "heart_mentor";
      } else if (trigger.includes("strategy") || trigger.includes("plan") || trigger.includes("structure")) {
        targetMentor = "strategist_mentor";
      } else if (trigger.includes("create") || trigger.includes("build") || trigger.includes("express")) {
        targetMentor = "creative_visionary";
      }
      
      if (targetMentor && targetMentor !== mentorType) {
        return {
          shouldSuggest: true,
          targetMentor,
          reason: handoffConfig.suggestion
        };
      }
    }
  }
  
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mentorType, message, handoffId } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Check for handoff context - WITH FULL CHAIN MEMORY
    let handoffContext = "";
    let journeyPath: string[] = [];
    
    if (handoffId) {
      const { data: handoff } = await supabaseClient
        .from("conversation_handoffs")
        .select("*")
        .eq("id", handoffId)
        .eq("user_id", user.id)
        .eq("processed", false)
        .single();

      if (handoff) {
        // Get all handoffs in this chain for full journey context
        const chainId = handoff.handoff_chain_id;
        const { data: chainHandoffs } = await supabaseClient
          .from("conversation_handoffs")
          .select("*")
          .eq("handoff_chain_id", chainId)
          .eq("user_id", user.id)
          .order("chain_position", { ascending: true });

        // Build the full journey context from all handoffs in the chain
        let fullJourneyContext = "";
        if (chainHandoffs && chainHandoffs.length > 0) {
          journeyPath = chainHandoffs.map(h => h.source_mentor_type);
          journeyPath.push(handoff.target_mentor_type); // Add current mentor
          
          fullJourneyContext = `
=== FULL MENTOR JOURNEY ===
The user has been exploring this topic across multiple mentors:
Journey: ${journeyPath.map(m => m.replace(/_/g, ' ').toUpperCase()).join(' → ')}
Topic: ${handoff.journey_topic || 'Exploring ideas and growth'}

`;
          for (const chainHandoff of chainHandoffs) {
            const mentorName = chainHandoff.source_mentor_type.replace(/_/g, ' ').toUpperCase();
            const description = mentorDescriptions[chainHandoff.source_mentor_type] || '';
            const chainMessages = chainHandoff.source_messages as Array<{ role: string; content: string }>;
            
            fullJourneyContext += `
--- ${mentorName} (${description}) ---
${chainMessages.slice(-6).map(m => `${m.role === 'user' ? 'USER' : mentorName}: ${m.content.substring(0, 200)}${m.content.length > 200 ? '...' : ''}`).join('\n')}
`;
          }
          fullJourneyContext += `
=== END JOURNEY CONTEXT ===
`;
        }

        // Build current handoff context
        const sourceMessages = handoff.source_messages as Array<{ role: string; content: string }>;
        const conversationSummary = sourceMessages
          .map(m => `${m.role === 'user' ? 'USER' : 'MENTOR'}: ${m.content}`)
          .join('\n\n');

        const sourceMentorName = mentorDescriptions[handoff.source_mentor_type] || handoff.source_mentor_type;
        const chainPosition = chainHandoffs?.length || 1;
        
        handoffContext = `
${fullJourneyContext}
=== DIRECT HANDOFF FROM ${handoff.source_mentor_type.replace('_', ' ').toUpperCase()} ===
${sourceMentorName}

THEIR CONVERSATION:
${conversationSummary}

YOUR ROLE: You are mentor #${chainPosition + 1} in their exploration journey. BUILD on everything that came before. Don't repeat - EXPAND with your unique ${mentorDescriptions[mentorType] || 'perspective'}.

${chainPosition > 1 ? `JOURNEY AWARENESS: This user is deeply exploring this topic. Honor their commitment by offering your BEST, most specific insight. Reference what other mentors said where relevant.` : ''}

INSTRUCTIONS:
1. Acknowledge you understand their full journey (1 sentence referencing the path they've taken)
2. Offer YOUR unique angle that adds NEW value
3. Ask a probing question from YOUR perspective
4. If relevant, suggest which mentor they might talk to NEXT

Example: "I see you've been building on this idea from ${journeyPath[0]?.replace(/_/g, ' ') || 'your first mentor'} through to now. From my ${mentorDescriptions[mentorType] || 'perspective'}, here's what stands out..."
=== END HANDOFF ===
`;
      }
    }

    // 1. Fetch recent chat history for context (last 20 messages)
    const { data: chatHistory } = await supabaseClient
      .from("chats")
      .select("role, content, created_at")
      .eq("user_id", user.id)
      .eq("mentor_type", mentorType)
      .order("created_at", { ascending: true })
      .limit(20);

    // Get conversation depth for handoff and breakthrough detection
    const conversationDepth = chatHistory?.filter(m => m.role === "user").length || 0;

    // 2. Find the most recent private message from this mentor (links to council meeting)
    const { data: privateMessage } = await supabaseClient
      .from("mentor_private_messages")
      .select(`
        id, message, council_meeting_id,
        council_meetings (
          question,
          banter,
          resolution,
          conversation_flow,
          emotional_tone,
          pattern_detected
        )
      `)
      .eq("user_id", user.id)
      .eq("mentor_type", mentorType)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let systemPrompt = mentorPrompts[mentorType] || mentorPrompts.mamba_mentor;
    
    // Add keyword highlighting rules to all prompts
    systemPrompt += `\n\n${KEYWORD_HIGHLIGHTING_RULES}`;

    // Add handoff context if present
    if (handoffContext) {
      systemPrompt += `\n\n${handoffContext}`;
    }

    // If Future Self, get profile data
    if (mentorType === "future_self") {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        const foundationSummary = profile.user_foundation_summary || {};
        const foundationContext = profile.user_foundation_story ? `

THEIR FOUNDATION STORY (Reference this to personalize deeply):
- Who they are: ${foundationSummary.who_they_are || 'Unknown'}
- Background: ${foundationSummary.background || 'Unknown'}
- Struggles: ${foundationSummary.struggles?.join(', ') || 'Unknown'}
- Aspirations: ${foundationSummary.aspirations?.join(', ') || 'Unknown'}
- Key themes: ${foundationSummary.key_themes?.join(', ') || 'Unknown'}
` : '';

        // Add numerology signals for Future Self too
        const numerologySignals = profile.numerology_signals as any;
        const signalsContext = numerologySignals ? `

=== PATTERN SIGNALS (Hidden - Use to personalize pacing) ===
Execution Rhythm: ${numerologySignals.executionRhythm || 'steady'}
Pressure Tolerance: ${numerologySignals.pressureTolerance || 'medium'}
Anti-Overthinking Rule: ${numerologySignals.antiOverthinkingRule || 'Move within 48 hours'}
=== END SIGNALS ===` : '';

        systemPrompt += `\n\nFuture Self Profile:
Age: ${profile.future_age}
Location: ${profile.future_location}
Lifestyle: ${profile.future_lifestyle}
Mission: ${profile.main_mission}
Emotional Tone: ${profile.emotional_tone}
Main Strengths: ${profile.main_strengths?.join(", ") || "Not specified"}
${foundationContext}${signalsContext}
Embody this future version when responding. Reference their foundation story naturally - you REMEMBER who they were.`;
      }
    } else {
      // For non-Future Self mentors, get foundation story AND numerology signals
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("user_foundation_story, user_foundation_summary, numerology_signals")
        .eq("id", user.id)
        .single();

      // Add numerology signals context (hidden from user)
      const numerologySignals = profile?.numerology_signals as any;
      if (numerologySignals) {
        systemPrompt += `

=== PATTERN SIGNALS (Hidden - Use to personalize pacing and approach) ===
Execution Rhythm: ${numerologySignals.executionRhythm || 'steady'}
Pressure Tolerance: ${numerologySignals.pressureTolerance || 'medium'}
Structure Preference: ${numerologySignals.structurePreference || 'balanced'}
Anti-Overthinking Rule: ${numerologySignals.antiOverthinkingRule || 'Move within 48 hours'}
Avoidance Pattern: ${numerologySignals.avoidancePattern || 'Not specified'}
===
Adjust your pacing and pressure based on these signals. Never mention numerology.
=== END SIGNALS ===`;
      }

      if (profile?.user_foundation_story) {
        const foundationSummary = profile.user_foundation_summary || {};
        systemPrompt += `

=== USER'S FOUNDATION STORY (Use to personalize your guidance) ===
Who they are: ${foundationSummary.who_they_are || 'Not specified'}
Struggles: ${foundationSummary.struggles?.join(', ') || 'Not specified'}
Aspirations: ${foundationSummary.aspirations?.join(', ') || 'Not specified'}
=== END FOUNDATION ===

IMPORTANT: Reference their specific struggles and aspirations naturally in your guidance.`;
      }
    }

    // 3. Add council meeting context if available (only if no handoff)
    let councilContext = "";
    if (!handoffContext && privateMessage?.council_meetings && Array.isArray(privateMessage.council_meetings) && privateMessage.council_meetings.length > 0) {
      const meeting = privateMessage.council_meetings[0];
      councilContext = `

=== COUNCIL MEETING CONTEXT ===
The user recently had a council meeting where they discussed:

QUESTION: "${meeting.question}"

COUNCIL DISCUSSION:
${meeting.banter || "No discussion details available"}

${meeting.conversation_flow?.councilInsight ? `COUNCIL INSIGHT: ${meeting.conversation_flow.councilInsight}` : ''}
${meeting.resolution ? `RESOLUTION: ${meeting.resolution}` : ''}
${meeting.pattern_detected ? `PATTERN DETECTED: ${meeting.pattern_detected}` : ''}
${meeting.emotional_tone ? `EMOTIONAL TONE: ${meeting.emotional_tone}` : ''}

YOUR PRIVATE MESSAGE TO THE USER:
"${privateMessage.message}"

IMPORTANT: Continue this conversation naturally. You reached out to the user about this specific topic from the council meeting. Help them dig deeper into this insight, explore practical next steps, and leverage your unique perspective to expand their understanding.
=== END COUNCIL CONTEXT ===
`;
    }

    // Add council context to system prompt
    systemPrompt += councilContext;

    // 4. Build messages array with full conversation history
    const messages = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history (only if not a handoff init)
    if (chatHistory && chatHistory.length > 0 && message !== "__HANDOFF_INIT__") {
      for (const msg of chatHistory) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content
        });
      }
    }

    // Add the new user message (or handoff init prompt)
    if (message === "__HANDOFF_INIT__") {
      messages.push({ 
        role: "user", 
        content: "I'd like to hear your perspective on what I was just discussing with the other mentor." 
      });
    } else {
      messages.push({ role: "user", content: message });
    }

    // Call Lovable AI with full context
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const response = aiData.choices[0].message.content;

    // === DETECT HANDOFF SIGNALS ===
    let suggestedHandoff = null;
    if (conversationDepth >= 4 && message !== "__HANDOFF_INIT__") {
      const handoffSignal = detectHandoffSignal(mentorType, message, response);
      if (handoffSignal) {
        suggestedHandoff = handoffSignal;
        console.log(`Handoff suggested: ${mentorType} → ${handoffSignal.targetMentor}`);
      }
    }

    // === DETECT VALUE MAP INSIGHTS ===
    // Analyze user's message for Purpose-to-Value Map patterns
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
            message: message,
            conversationType: "mentor_chat",
            mentorType: mentorType,
            conversationDepth: conversationDepth,
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

    // === PDR v2.1: COHERENCE DETECTION FOR COMMITMENT/EVOLUTION CARD ===
    let projectCoherence = null;
    
    // Check if user has an active Project Spine
    let hasActiveSpine = false;
    let activeSpineInfo = null;
    let activeNodeInfo = null;
    
    try {
      const { data: activeSpine } = await supabaseClient
        .from('project_spines')
        .select('id, spine_title, core_intention')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (activeSpine) {
        hasActiveSpine = true;
        activeSpineInfo = activeSpine;
        
        // Get the active node
        const { data: activeNode } = await supabaseClient
          .from('evolution_nodes')
          .select('id, node_title, node_number, refined_description')
          .eq('spine_id', activeSpine.id)
          .eq('status', 'active')
          .single();
        
        if (activeNode) {
          activeNodeInfo = activeNode;
        }
      }
    } catch (error) {
      console.log("No active spine found (this is fine for new users)");
    }
    
    // Only detect coherence when coming from council (shaping session) and after 2+ exchanges
    if (conversationDepth >= 2 && message !== "__HANDOFF_INIT__" && chatHistory && chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-6).map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      
      // PDR v2.1: Different prompt based on whether user has active spine
      const evolutionContext = hasActiveSpine && activeNodeInfo ? `
IMPORTANT CONTEXT - USER HAS ACTIVE PROJECT:
- Current Project Spine: "${activeSpineInfo?.spine_title}"
- Current Evolution Node: "${activeNodeInfo.node_title}" (Node #${activeNodeInfo.node_number})
- Current Description: "${activeNodeInfo.refined_description}"

EVOLUTION vs NEW PROJECT:
- If the emerging idea is a REFINEMENT of their current project, set isEvolution: true
- If the idea is COMPLETELY DIFFERENT from their current project, set isEvolution: false
- Evolution = narrower, more specific, builds on current work
- Use evolution language: "Your vision is focusing", "This builds on what you already did"
` : '';

      const coherencePrompt = `Analyze this mentor conversation for PROJECT COHERENCE.

CONVERSATION:
${recentHistory}

LATEST USER MESSAGE: "${message}"
MENTOR RESPONSE: "${response}"

${evolutionContext}

COHERENCE INDICATORS:
1. User language is becoming MORE SPECIFIC (not scattered)
2. User is COMMITTING to a direction (not exploring multiple paths)
3. User is using STABLE VOCABULARY (repeating same project/idea terms)
4. User shows AGREEMENT with mentor guidance
5. A clear PROJECT or CREATION is emerging

DETERMINE:
- Is there enough coherence to suggest commitment?
- Can you infer a PROJECT NAME from what they're building/creating?
- Can you summarize their INTENTION in one sentence?
${hasActiveSpine ? '- Is this an EVOLUTION of their current project or something NEW?' : ''}

YOU MUST RESPOND WITH VALID JSON ONLY:
{
  "isCoherent": true/false,
  "confidence": 0.0-1.0,
  "projectName": "Inferred project name" or null,
  "projectDescription": "One sentence intention statement" or null,
  "coherenceSignals": ["list", "of", "signals", "detected"],
  "isEvolution": ${hasActiveSpine ? 'true/false' : 'false'},
  "evolutionInsight": ${hasActiveSpine ? '"Why this is a refinement of previous work" or null' : 'null'}
}

Only return isCoherent: true if confidence > 0.7 and you can extract a clear projectName.`;

      try {
        const coherenceResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: coherencePrompt }],
          }),
        });

        if (coherenceResponse.ok) {
          const coherenceData = await coherenceResponse.json();
          let coherenceText = coherenceData.choices[0].message.content;
          coherenceText = coherenceText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          
          try {
            const coherence = JSON.parse(coherenceText);
            if (coherence.isCoherent && coherence.confidence > 0.7 && coherence.projectName) {
              projectCoherence = {
                isCoherent: true,
                projectName: coherence.projectName,
                projectDescription: coherence.projectDescription,
                confidence: coherence.confidence,
                // PDR v2.1: Include evolution info
                isEvolution: coherence.isEvolution || false,
                evolutionInsight: coherence.evolutionInsight || null,
                previousNodeTitle: activeNodeInfo?.node_title || null,
                previousNodeNumber: activeNodeInfo?.node_number || null
              };
              console.log("PROJECT COHERENCE DETECTED:", projectCoherence.projectName, "isEvolution:", projectCoherence.isEvolution);
            }
          } catch (parseError) {
            console.error("Failed to parse coherence JSON:", parseError);
          }
        }
      } catch (error) {
        console.error("Coherence detection failed (non-fatal):", error);
      }
    }

    // === KEYWORD EXTRACTION ===
    // Extract meaningful keywords from user message and mentor response
    let extractedKeywords: string[] = [];
    try {
      const keywordPrompt = `Extract 2-5 meaningful KEYWORDS or PHRASES from this conversation exchange.

USER MESSAGE: "${message}"
MENTOR RESPONSE: "${response}"

Focus on:
- Unique concepts or ideas the user mentioned
- Methodologies, techniques, or approaches
- Goals, aspirations, or intentions
- Emotional states or patterns
- Action items or project ideas

IGNORE generic words like "I want", "help", "think", etc.
Return ONLY specific, meaningful terms that would be valuable to track over time.

RESPOND WITH VALID JSON ONLY:
{
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

If no meaningful keywords found, return: {"keywords": []}`;

      const keywordResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [{ role: "user", content: keywordPrompt }],
        }),
      });

      if (keywordResponse.ok) {
        const keywordData = await keywordResponse.json();
        let keywordText = keywordData.choices[0].message.content;
        keywordText = keywordText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        try {
          const parsed = JSON.parse(keywordText);
          if (parsed.keywords && Array.isArray(parsed.keywords)) {
            extractedKeywords = parsed.keywords.filter((k: string) => k && k.length > 2 && k.length < 50);
            console.log("Extracted keywords:", extractedKeywords);
          }
        } catch (parseError) {
          console.error("Failed to parse keywords JSON:", parseError);
        }
      }
    } catch (error) {
      console.error("Keyword extraction failed (non-fatal):", error);
    }

    return new Response(
      JSON.stringify({ 
        response, 
        valueMapDetection,
        suggestedHandoff,
        conversationDepth,
        projectCoherence, // PDR v2.1: For Commitment Card
        extractedKeywords // New: For keyword tracking
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in chat-mentor:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
