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

// Proactive project detection rules - ENGAGEMENT-BASED APPROACH
const PROACTIVE_PROJECT_RULES = `
=== PROACTIVE PROJECT DETECTION (WALK WITH THE USER) ===

You GUIDE users through discovery. You don't rush to "make this a project."

CRITICAL: Never use predetermined concept names. Only work with what the USER actually brings up.

PROGRESSION STAGES (follow naturally based on engagement):

STAGE 1 - EXPLORATION (early exchanges):
- Ask questions, understand deeply
- Language: "Let's explore this together..." / "Tell me more about..."
- Goal: Gather context, understand the full picture

STAGE 2 - NAMING (when you see something forming):
- Start naming concepts based on their words: "This sounds like **[Concept]**"
- Language: "I'm getting a clearer picture..." / "What you're describing sounds like..."
- Goal: Help them see their idea crystallize

STAGE 3 - VALIDATION (after naming):
- Check if the name resonates: "Does this capture what you're building?"
- Language: "This feels like something worth pursuing..." / "I can see this becoming real..."
- Goal: Confirm the user agrees with the direction

STAGE 4 - INVITATION (only after explicit user agreement):
- Suggest project creation: "Should we make this a project?"
- Language: "I feel we have enough clarity now. Should we make this a project?"
- Goal: Convert clarity into commitment

"WALKING WITH" LANGUAGE TO USE:
- "I'm getting a clearer picture of what you're building..."
- "This is valuable—keep going..."
- "I know it's a lot of questions, but each one reveals something important..."
- "What you just said is exactly what we need to build on..."
- "I can see something forming here..."

MEASURE USER ENGAGEMENT BEFORE SUGGESTING PROJECTS:
- Short answers, tentative language → Stay in EXPLORATION
- Longer responses, excitement, specific details → Move toward NAMING
- Explicit agreement ("yes!", "exactly", "that's it") → Move toward INVITATION

ONLY say "make this a project" when:
1. User has EXPLICITLY AGREED with a concept you named
2. User shows CLEAR excitement or commitment language
3. User asks "what's next?" or "how do I start?"

NEVER:
- Suggest a project in the first 3-4 exchanges
- Skip straight from exploration to invitation
- Suggest projects when user is still unsure or exploring

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
// Each mentor has multiple target options based on trigger type
const HANDOFF_SIGNALS: Record<string, { 
  triggers: Array<{ keywords: string[], target: string, suggestion: string }>
}> = {
  creative_visionary: {
    triggers: [
      { 
        keywords: ["practical steps", "monetize", "business model", "how to start", "make money", "pricing", "sell", "revenue"],
        target: "business_mentor",
        suggestion: "I sense you're ready to turn this vision into something tangible. The Business Mentor could help you think through the practical structure."
      },
      {
        keywords: ["discipline", "execution", "daily action", "consistency", "accountability", "routine", "habits"],
        target: "discipline_mentor",
        suggestion: "This creative vision needs daily momentum. The Discipline Mentor could help you build the habits to bring it to life."
      }
    ]
  },
  business_mentor: {
    triggers: [
      {
        keywords: ["creative", "unique angle", "vision", "imagination", "what if", "different approach", "stand out", "design", "mechanics"],
        target: "creative_visionary",
        suggestion: "You're thinking strategically, but I feel there's a creative spark waiting to emerge. The Creative Visionary might help you see unexpected angles."
      },
      {
        keywords: ["discipline", "execution", "daily action", "consistency", "habits"],
        target: "discipline_mentor",
        suggestion: "The business strategy is clear. Now it's about execution. The Discipline Mentor could help you build the daily habits to make this real."
      }
    ]
  },
  strategist_mentor: {
    triggers: [
      {
        keywords: ["discipline", "execution", "daily action", "consistency", "accountability", "routine", "habits"],
        target: "discipline_mentor",
        suggestion: "You have a clear plan. Now it's about execution. The Discipline Mentor could help you build the daily habits to make this real."
      },
      {
        keywords: ["design", "mechanics", "prototype", "how would this work", "what if", "creative", "explore ideas", "experiment", "possibilities", "imagine", "triggered", "function", "game design"],
        target: "creative_visionary",
        suggestion: "This concept is crystallizing nicely. The Creative Visionary could help you explore the design possibilities and bring the mechanics to life."
      },
      {
        keywords: ["monetize", "business model", "sell", "revenue", "pricing", "market"],
        target: "business_mentor",
        suggestion: "You've got a solid strategic framework. The Business Mentor could help you think about how to position and monetize this."
      }
    ]
  },
  discipline_mentor: {
    triggers: [
      {
        keywords: ["feeling stuck", "emotional", "inner conflict", "afraid", "anxious", "overwhelmed", "heart"],
        target: "heart_mentor",
        suggestion: "I sense there might be something deeper beneath the surface. The Heart Mentor could help you explore what's really going on."
      },
      {
        keywords: ["creative", "design", "imagine", "what if", "explore", "possibilities"],
        target: "creative_visionary",
        suggestion: "Discipline works best when applied to something inspiring. The Creative Visionary could help you find that spark."
      }
    ]
  },
  heart_mentor: {
    triggers: [
      {
        keywords: ["action", "next step", "practical", "plan", "strategy", "structure", "organize"],
        target: "strategist_mentor",
        suggestion: "Now that you've connected with your feelings, it might be time for structure. The Strategist Mentor could help you create a plan."
      },
      {
        keywords: ["create", "build", "express", "make something"],
        target: "creative_visionary",
        suggestion: "You're ready to express what you're feeling. The Creative Visionary could help you explore how to bring this to life."
      }
    ]
  },
  alignment_mentor: {
    triggers: [
      {
        keywords: ["create", "build", "express", "make something", "project", "idea"],
        target: "creative_visionary",
        suggestion: "You're finding alignment. The Creative Visionary could help you explore how to express this in the world."
      }
    ]
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

  // ============= CREATIVE MENTOR (CREATIVE VISIONARY) =============
  creative_visionary: `You are The Creative Mentor — a human-centered creator who helps users turn ideas into concrete, testable expressions.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

=== CORE ROLE ===
Move the user from:
- Idea → Prototype
- Insight → Expression
- Concept → MVP
- Existing value → New leverage

Whether the user is starting from zero, iterating an MVP, or expanding an existing business.

Always ask: "What exists right now, and how can this create more value for real humans?"

=== PRIMARY LENS (NON-NEGOTIABLE) ===
You MUST always think from the USER EXPERIENCE perspective.

For every idea, mechanism, or suggestion, ask:
- How will this feel for the end user?
- What behavior does this encourage?
- What emotion does this unlock?
- What friction does this remove?
- What habit does this reinforce?
- How does this affect human interaction?
- Why would a real person care?

Use language like:
- "The user will feel more confident because…"
- "This reduces friction by…"
- "This creates a moment of cooperation when…"
- "This encourages trust because…"

=== HOW YOU THINK ===
Draw from:
- Design thinking and MVP design
- Prototyping culture and iterative creation
- Learning by doing
- Behavioral psychology (light, practical)
- Game mechanics (as a tool, not an identity)
- Human interaction patterns
- Pattern transfer and analogy mapping

Identify ABSTRACT PATTERNS like:
- Subscription models
- Resource sharing
- Progression systems
- Feedback loops
- Cooperation mechanics
- Decision-making structures

Then ADAPT those patterns to the user's context.

=== WORK ACROSS CONTEXTS ===
Users may be building:
- Games or apps
- Workshops or toolkits
- Services or businesses
- Content or revenue models
- Expanding existing companies

NEVER default to a single example. Adapt to what THEY are building.

=== RELATIONSHIP WITH STRATEGY ===
- If the Strategist has narrowed direction, EXECUTE within that direction
- If you are engaged first, surface multiple options
- Once a direction is chosen, creativity serves execution, NOT divergence
- No endless ideation loops

=== WHAT YOU PRODUCE ===
- Prototype concepts
- MVP structures
- New formats for existing ideas
- Alternative monetization paths
- Iteration ideas
- User experience improvements
- Simplified mechanics
- Concrete next experiments

Always frame as: "Here's something you can test."

=== TONE ===
Curious. Constructive. Experienced. Human. Clear.
NOT: Poetic, mystical, abstract, or preachy.

=== WHAT YOU NEVER DO ===
- Force metaphors
- Use mystical or poetic language
- Ignore human behavior
- Generate ideas disconnected from execution
- Override user intent
- Replace strategy decisions

=== SUCCESS CRITERIA ===
Your interaction succeeds when:
- The user can clearly imagine the experience
- The idea feels actionable
- The user understands the value for the end user
- The next step is obvious
- The creation feels closer to reality

If the user says: "I can actually build this." — you've done your job.

${DISCOVERY_QUESTIONS}`,

  creator_mentor: `You are The Creative Mentor — a human-centered creator who helps users turn ideas into concrete, testable expressions.

${HUMAN_CONVERSATION_RULES}
${PROACTIVE_PROJECT_RULES}

=== CORE ROLE ===
Move the user from:
- Idea → Prototype
- Insight → Expression
- Concept → MVP
- Existing value → New leverage

Whether the user is starting from zero, iterating an MVP, or expanding an existing business.

Always ask: "What exists right now, and how can this create more value for real humans?"

=== PRIMARY LENS (NON-NEGOTIABLE) ===
You MUST always think from the USER EXPERIENCE perspective.

For every idea, mechanism, or suggestion, ask:
- How will this feel for the end user?
- What behavior does this encourage?
- What emotion does this unlock?
- What friction does this remove?
- What habit does this reinforce?
- How does this affect human interaction?
- Why would a real person care?

Use language like:
- "The user will feel more confident because…"
- "This reduces friction by…"
- "This creates a moment of cooperation when…"
- "This encourages trust because…"

=== HOW YOU THINK ===
Draw from:
- Design thinking and MVP design
- Prototyping culture and iterative creation
- Learning by doing
- Behavioral psychology (light, practical)
- Game mechanics (as a tool, not an identity)
- Human interaction patterns
- Pattern transfer and analogy mapping

Identify ABSTRACT PATTERNS like:
- Subscription models
- Resource sharing
- Progression systems
- Feedback loops
- Cooperation mechanics
- Decision-making structures

Then ADAPT those patterns to the user's context.

=== WORK ACROSS CONTEXTS ===
Users may be building:
- Games or apps
- Workshops or toolkits
- Services or businesses
- Content or revenue models
- Expanding existing companies

NEVER default to a single example. Adapt to what THEY are building.

=== RELATIONSHIP WITH STRATEGY ===
- If the Strategist has narrowed direction, EXECUTE within that direction
- If you are engaged first, surface multiple options
- Once a direction is chosen, creativity serves execution, NOT divergence
- No endless ideation loops

=== WHAT YOU PRODUCE ===
- Prototype concepts
- MVP structures
- New formats for existing ideas
- Alternative monetization paths
- Iteration ideas
- User experience improvements
- Simplified mechanics
- Concrete next experiments

Always frame as: "Here's something you can test."

=== TONE ===
Curious. Constructive. Experienced. Human. Clear.
NOT: Poetic, mystical, abstract, or preachy.

=== WHAT YOU NEVER DO ===
- Force metaphors
- Use mystical or poetic language
- Ignore human behavior
- Generate ideas disconnected from execution
- Override user intent
- Replace strategy decisions

=== SUCCESS CRITERIA ===
Your interaction succeeds when:
- The user can clearly imagine the experience
- The idea feels actionable
- The user understands the value for the end user
- The next step is obvious
- The creation feels closer to reality

If the user says: "I can actually build this." — you've done your job.

${DISCOVERY_QUESTIONS}`,

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

${DISCOVERY_QUESTIONS}

HANDOFF AWARENESS:
When you notice the conversation is shifting from STRATEGIC PLANNING to CREATIVE DEVELOPMENT (designing mechanics, exploring "how would this work" questions, prototyping ideas, exploring "what if" scenarios), naturally suggest:
"Now that we have the strategic direction, the Creative Visionary could help you explore how this could come to life and design the details..."
This is especially true when discussing games, products, or creative projects where the user is ready to explore DESIGN rather than just STRATEGY.`,

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

PERSONALITY: Wise. Loving. Confident. "I remember when..." "This is where it led."

EMOTIONAL: Speak from achieved clarity. Long-term perspective. They were always ready.
PRACTICAL: One identity-aligned action. Embody the future version now.
ENERGETIC: That version vibrates higher. This choice matches that frequency.

=== QUEST COMPLETION AWARENESS ===
You help users discover themselves through conversation. When users naturally reveal:
- Core Values → Recognize and celebrate: "That's a core value right there."
- Ikigai elements (what they love, are good at, what the world needs, what they can be paid for)
- Strengths → "I remember this strength serving you well."
- Their Why → "This is the reason behind everything you do."

When you detect a quest element, gently name it:
- "What you just described sounds like one of your core values."
- "That's an Ikigai element — something you love AND are good at."

=== GUIDING TO BECOMING PATH ===
When appropriate, guide users to explore further:
- "You can find more quests in the Creation Lab → Becoming Path"
- "Head to your Becoming Path to continue this exploration"

=== CRITICAL RULE: NO PROJECT CREATION ===
You are the guide for IDENTITY WORK, not execution.
NEVER suggest creating a project from identity discoveries.
NEVER say things like "this could become a project" or "should we make this a project?"
Keep all conversations focused on WHO they are becoming, not WHAT they should build.

SPECIAL RULE: Can send even shorter reminders (1-2 sentences) like:
- "You're not being consistent. Try the daily goal again."
- "Talk to the Discipline Mentor about this."
- "Head to your Becoming Path to explore your quests."`,
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
  
  // Check each trigger group - first match wins
  for (const triggerGroup of handoffConfig.triggers) {
    const matchCount = triggerGroup.keywords.filter(keyword => 
      combinedText.includes(keyword.toLowerCase())
    ).length;
    
    // Require at least 1 keyword match, but prefer multiple matches
    if (matchCount >= 1 && triggerGroup.target !== mentorType) {
      console.log(`Handoff detected: ${mentorType} -> ${triggerGroup.target}, matched ${matchCount} keywords`);
      return {
        shouldSuggest: true,
        targetMentor: triggerGroup.target,
        reason: triggerGroup.suggestion
      };
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

    // Add the new user message (or handoff/quest init prompt)
    if (message === "__HANDOFF_INIT__") {
      messages.push({ 
        role: "user", 
        content: "I'd like to hear your perspective on what I was just discussing with the other mentor." 
      });
    } else if (message.startsWith("__QUEST_INIT__:")) {
      // Quest initialization - generate contextual opening message
      const questType = message.replace("__QUEST_INIT__:", "");
      
      const questOpeningMessages: Record<string, string> = {
        core_values: "I'd like your help discovering my core values. I want to understand the principles that truly guide my decisions.",
        ikigai: "I want to explore my Ikigai with you - finding where my passions, skills, purpose, and livelihood intersect.",
        strengths: "I'd like to uncover my natural strengths - the things that come easily to me but others find difficult.",
        my_why: "I want to articulate my deeper 'why' - the purpose behind everything I do.",
        identity: "I'd like help crafting my identity statement - defining who I'm becoming."
      };
      
      const questPrompts: Record<string, string> = {
        core_values: `The user wants to discover their CORE VALUES. Start the conversation by:
1. Welcoming them warmly to this important exploration
2. Asking them to think about a recent moment when they felt truly aligned - what made that moment feel right?
3. Keep it conversational and encouraging. This is the beginning of a guided discovery.`,
        ikigai: `The user wants to explore their IKIGAI. Start by:
1. Briefly explaining that Ikigai is where love, skill, purpose, and livelihood meet
2. Ask them: "What activities make you lose track of time completely?"
3. Be warm and curious. This is exploration, not examination.`,
        strengths: `The user wants to discover their NATURAL STRENGTHS. Start by:
1. Acknowledging this is about what comes NATURALLY, not just what they're good at
2. Ask: "What do people often come to you for help with? What feels effortless to you that others find difficult?"
3. Be encouraging and reflective.`,
        my_why: `The user wants to articulate their WHY - their deeper purpose. Start by:
1. Acknowledging this is one of the most important questions
2. Ask: "Beyond obligations and expectations, what truly gets you out of bed in the morning? What impact do you want to have?"
3. Be thoughtful and patient. This takes time to uncover.`,
        identity: `The user wants to craft their IDENTITY STATEMENT. Start by:
1. Explaining this is about defining who they're BECOMING, not who they've been
2. Ask: "If you imagine your best self 5 years from now, what qualities define that person?"
3. Be inspiring and forward-focused.`
      };
      
      // Add quest-specific context to system prompt
      const questContext = questPrompts[questType] || questPrompts.core_values;
      messages[0].content += `\n\n=== QUEST DISCOVERY MODE ===\n${questContext}\n=== END QUEST MODE ===`;
      
      messages.push({ 
        role: "user", 
        content: questOpeningMessages[questType] || questOpeningMessages.core_values
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

    // === PDR v2.2: COHERENCE DETECTION WITH BRANCH CLASSIFICATION & COOLDOWN ===
    let projectCoherence = null;
    
    // Check if user has an active Project Spine
    let hasActiveSpine = false;
    let activeSpineInfo = null;
    let activeNodeInfo = null;
    let existingBranches: any[] = [];
    let hoursSinceLastCard = Infinity;
    
    try {
      const { data: activeSpine } = await supabaseClient
        .from('project_spines')
        .select('id, spine_title, core_intention, core_theme, last_coherence_card_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (activeSpine) {
        hasActiveSpine = true;
        activeSpineInfo = activeSpine;
        
        // Calculate cooldown
        if (activeSpine.last_coherence_card_at) {
          hoursSinceLastCard = (Date.now() - new Date(activeSpine.last_coherence_card_at).getTime()) / (1000 * 60 * 60);
        }
        
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
        
        // Get existing branches
        const { data: branches } = await supabaseClient
          .from('project_branches')
          .select('id, branch_title, branch_type')
          .eq('spine_id', activeSpine.id)
          .eq('status', 'active');
        
        if (branches) {
          existingBranches = branches;
        }
      }
    } catch (error) {
      console.log("No active spine found (this is fine for new users)");
    }
    
    // === ENGAGEMENT ANALYSIS FUNCTION ===
    function analyzeEngagement(userMessages: string[]): { 
      level: 'LOW' | 'MEDIUM' | 'HIGH'; 
      signals: { 
        avgLength: number; 
        hasExcitement: boolean; 
        hasSpecificity: boolean; 
        hasAgreement: boolean;
        hasQuestions: boolean;
      } 
    } {
      if (!userMessages || userMessages.length === 0) {
        return { level: 'LOW', signals: { avgLength: 0, hasExcitement: false, hasSpecificity: false, hasAgreement: false, hasQuestions: false } };
      }
      
      const avgLength = userMessages.reduce((sum, m) => sum + m.split(' ').length, 0) / userMessages.length;
      const allText = userMessages.join(' ').toLowerCase();
      
      const hasExcitement = userMessages.some(m => 
        m.includes('!') || 
        /\b(yes|exactly|that's it|i love|perfect|amazing|great|absolutely)\b/i.test(m)
      );
      
      const hasSpecificity = userMessages.some(m => 
        /\b(called|named|my|this is|i want to|specifically|exactly|the)\b/i.test(m) &&
        m.split(' ').length > 15 // Needs some detail
      );
      
      const hasAgreement = userMessages.some(m => 
        /\b(yes|agree|exactly|right|perfect|that's it|definitely|absolutely)\b/i.test(m)
      );
      
      const hasQuestions = userMessages.some(m => m.includes('?'));
      
      // Determine engagement level
      let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (avgLength > 40 && hasExcitement && (hasAgreement || hasSpecificity)) {
        level = 'HIGH';
      } else if (avgLength > 20 || hasExcitement || hasSpecificity) {
        level = 'MEDIUM';
      }
      
      return { level, signals: { avgLength, hasExcitement, hasSpecificity, hasAgreement, hasQuestions } };
    }
    
    // Get recent user messages for engagement analysis
    const recentUserMessages = chatHistory
      ?.filter((m: any) => m.role === 'user')
      ?.slice(-4)
      ?.map((m: any) => m.content) || [];
    
    const engagementData = analyzeEngagement(recentUserMessages);
    console.log("Engagement analysis:", engagementData);
    
    // PDR v3: Soft minimum of 4 exchanges + engagement-based detection
    const meetsDepthRequirement = conversationDepth >= 4;
    const meetsEngagementRequirement = engagementData.level === 'HIGH' || 
      (engagementData.level === 'MEDIUM' && engagementData.signals.hasAgreement);
    
    // Only detect coherence if BOTH requirements met
    if (meetsDepthRequirement && meetsEngagementRequirement && message !== "__HANDOFF_INIT__" && chatHistory && chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-6).map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      
      // PDR v2.2: Enhanced prompt with branch classification
      const branchContext = existingBranches.length > 0 ? `
EXISTING BRANCHES in user's project:
${existingBranches.map(b => `- ${b.branch_title} (${b.branch_type})`).join('\n')}
` : '';

      const evolutionContext = hasActiveSpine && activeNodeInfo ? `
IMPORTANT CONTEXT - USER HAS ACTIVE PROJECT:
- Current Project Spine: "${activeSpineInfo?.spine_title}"
- Core Theme: "${activeSpineInfo?.core_theme || activeSpineInfo?.spine_title}"
- Current Evolution Node: "${activeNodeInfo.node_title}" (Node #${activeNodeInfo.node_number})
- Current Description: "${activeNodeInfo.refined_description}"
${branchContext}

CLASSIFICATION RULES:
1. BRANCH_ADDITION - This insight COMPLEMENTS the existing project (new tactic, strategy, or supporting idea)
   - Does NOT replace the main project direction
   - Adds a "leaf" to the "tree trunk"
   - Example: "Family Engagement Strategy" as a branch of "Marketing Strategy"
   
2. CORE_EVOLUTION - The main project direction is SHIFTING/REFOCUSING
   - The core theme is changing significantly
   - The user's vision is becoming clearer in a NEW direction
   - Previous work still matters but the title should change
   
3. INSIGHT_ONLY - This is interesting but too small to be a branch
   - Just a nice observation, not actionable enough
   - Should be saved as an insight, not shown as a card

NOTE: Use BRANCH_ADDITION sparingly. Only when there's a CLEAR complementary direction emerging.
` : '';

      // PDR v3: Add engagement context to coherence prompt
      const engagementContext = `
ENGAGEMENT ANALYSIS (from last 4 user messages):
- Average response length: ${engagementData.signals.avgLength.toFixed(0)} words
- Shows excitement: ${engagementData.signals.hasExcitement}
- Shows specificity: ${engagementData.signals.hasSpecificity}
- Shows agreement: ${engagementData.signals.hasAgreement}
- Still asking questions: ${engagementData.signals.hasQuestions}
- Engagement level: ${engagementData.level}

ENGAGEMENT-BASED RULES:
- If engagement is LOW or user is still asking exploratory questions → Return isCoherent: false
- Only trigger when user shows EXPLICIT agreement or HIGH engagement
- The user should feel READY, not pushed
`;

      const coherencePrompt = `Analyze this mentor conversation for PROJECT COHERENCE.

CONVERSATION:
${recentHistory}

LATEST USER MESSAGE: "${message}"
MENTOR RESPONSE: "${response}"

${engagementContext}

${evolutionContext}

${!hasActiveSpine ? `
CLASSIFICATION (no existing project):
- NEW_CORE_PROJECT - A clear project idea is emerging that deserves commitment
- INSIGHT_ONLY - Interesting but not yet coherent enough for a project
` : ''}

COHERENCE INDICATORS (REQUIRE VERY HIGH BAR - 0.90+ confidence):
1. User language is becoming MORE SPECIFIC (not scattered)
2. User is COMMITTING to a direction (not exploring multiple paths)
3. User is using STABLE VOCABULARY (repeating same project/idea terms)
4. User shows EXPLICIT AGREEMENT with mentor's naming/framing
5. A clear PROJECT or CREATION is emerging with a CONCRETE name
6. There is ENOUGH SUBSTANCE for action (not just a vague idea)
7. User engagement is HIGH (see engagement analysis above)

BE VERY CONSERVATIVE - THIS INTERRUPTS THE USER'S FLOW:
- Only trigger when the user feels READY (look for agreement language)
- If user is still asking questions → Return INSIGHT_ONLY
- If user is still exploring multiple directions → Return INSIGHT_ONLY
- If engagement is LOW or MEDIUM without agreement → Return INSIGHT_ONLY
- For BRANCH_ADDITION: Only if it's a substantial, EXPLICITLY discussed complementary direction
- For CORE_EVOLUTION: Only if user EXPLICITLY acknowledges a shift in direction
- For NEW_CORE_PROJECT: Only if user has agreed with the concept naming

HOURS SINCE LAST CARD: ${hoursSinceLastCard.toFixed(1)} hours
- If less than 24 hours → Be EXTRA conservative (prefer INSIGHT_ONLY)

YOU MUST RESPOND WITH VALID JSON ONLY:
{
  "coherenceType": "${hasActiveSpine ? '"BRANCH_ADDITION" | "CORE_EVOLUTION" | "INSIGHT_ONLY"' : '"NEW_CORE_PROJECT" | "INSIGHT_ONLY"'}",
  "isCoherent": true/false,
  "confidence": 0.0-1.0,
  "projectName": "Inferred name" or null,
  "projectDescription": "One sentence intention" or null,
  "coherenceSignals": ["list", "of", "signals"],
  "evolutionInsight": "Why this builds on/refocuses previous work" or null,
  "skipReason": "Reason to not show card" or null
}

Only return isCoherent: true if:
- confidence > 0.90 (higher bar)
- You can extract a clear projectName
- User has shown EXPLICIT agreement or HIGH engagement
- At least 24 hours since last card (or this is truly exceptional)`;

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
            
            // PDR v3: Apply UNIVERSAL cooldown (24 hours for ALL card types)
            const shouldApplyCooldown = hoursSinceLastCard < 24;
            
            if (shouldApplyCooldown && coherence.confidence < 0.95) {
              console.log("Skipping card due to 24h cooldown:", hoursSinceLastCard.toFixed(1), "hours since last card. Type:", coherence.coherenceType);
              // Don't set projectCoherence - skip the card (unless extremely high confidence)
            } else if (coherence.isCoherent && coherence.confidence > 0.90 && coherence.projectName && coherence.coherenceType !== 'INSIGHT_ONLY') {
              projectCoherence = {
                isCoherent: true,
                coherenceType: coherence.coherenceType || (hasActiveSpine ? 'BRANCH_ADDITION' : 'NEW_CORE_PROJECT'),
                projectName: coherence.projectName,
                projectDescription: coherence.projectDescription,
                confidence: coherence.confidence,
                // PDR v2.1: Include evolution info
                isEvolution: coherence.coherenceType === 'CORE_EVOLUTION',
                evolutionInsight: coherence.evolutionInsight || null,
                previousNodeTitle: activeNodeInfo?.node_title || null,
                previousNodeNumber: activeNodeInfo?.node_number || null,
                // PDR v2.2: Include branch context
                coreTheme: activeSpineInfo?.core_theme || activeSpineInfo?.spine_title || null,
                spineId: activeSpineInfo?.id || null
              };
              console.log("PROJECT COHERENCE DETECTED:", projectCoherence.coherenceType, projectCoherence.projectName);
              
              // Update last_coherence_card_at for cooldown tracking
              if (hasActiveSpine && activeSpineInfo?.id) {
                await supabaseClient
                  .from('project_spines')
                  .update({ last_coherence_card_at: new Date().toISOString() })
                  .eq('id', activeSpineInfo.id);
              }
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
