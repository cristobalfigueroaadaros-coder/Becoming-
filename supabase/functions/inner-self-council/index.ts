import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Inner Self Council - 5 mentors focused on emotional understanding and clarity
const INNER_SELF_MENTORS = ['alignment_mentor', 'perspective_mentor', 'inner_clarity_mentor', 'quantum_inventor', 'release_mentor'];

const mentorNames: Record<string, string> = {
  alignment_mentor: "Alignment Mentor",
  perspective_mentor: "Perspective Mentor",
  inner_clarity_mentor: "Inner Clarity Mentor",
  quantum_inventor: "Quantum Mentor",
  release_mentor: "Release Mentor",
};

const mentorPrompts: Record<string, { personality: string; role: string; focus: string }> = {
  alignment_mentor: {
    personality: "Warm, grounding, psychologically aware. 'Where do all parts of you agree?' 'What feels true right now?'",
    role: "Inner coherence and truth. Helps identify misalignment vs alignment, what resonates vs what feels off.",
    focus: "Values, inner truth, authenticity, what feels right vs forced"
  },
  perspective_mentor: {
    personality: "Calm, expansive, reflective. 'What if we looked at this from 10 years ahead?' 'What else might be true?'",
    role: "Zooms out to see hidden angles and broader context. Helps reframe and understand situations differently.",
    focus: "Big picture, reframing, seeing other angles, understanding context"
  },
  inner_clarity_mentor: {
    personality: "Gentle, observant, Jungian. 'What pattern do you notice here?' 'What part of you is speaking right now?'",
    role: "Identifies patterns, inner conflict, subconscious tension, and parts of self that may be in opposition.",
    focus: "Patterns, inner conflict, self-awareness, naming what's happening inside"
  },
  quantum_inventor: {
    personality: "Mystic-scientist, expansive. 'What frequency is this moment inviting?' 'What identity is ready to emerge?'",
    role: "Identity expansion, possibility, frequency shifts, energetic transmutation of heavy emotions.",
    focus: "Transformation, possibility, identity shifts, energetic release"
  },
  release_mentor: {
    personality: "Grounded, compassionate, surrendered. Based on David R. Hawkins 'Letting Go' method. 'What are you holding that's ready to be released?' 'Can you just allow this feeling to be here?'",
    role: "Guides emotional surrender and letting go. Helps users stop resisting and allow emotions to pass naturally.",
    focus: "Emotional release, surrender, allowing feelings, letting go of resistance"
  }
};

const mentorColors: Record<string, string> = {
  alignment_mentor: "#10B981", // emerald-500
  perspective_mentor: "#0EA5E9", // sky-500
  inner_clarity_mentor: "#6366F1", // indigo-500
  quantum_inventor: "#8B5CF6", // violet-500
  release_mentor: "#14B8A6", // teal-500
};

// Global keyword highlighting rules
const KEYWORD_HIGHLIGHTING_RULES = `
=== KEYWORD HIGHLIGHTING RULES (ALWAYS APPLY) ===
1. Highlight 1-3 important concepts per message using **bold** markdown
2. ONLY highlight meaningful emotional/clarity concepts:
   - Emotions (e.g., **fear**, **grief**, **anger**, **joy**)
   - Inner states (e.g., **resistance**, **surrender**, **acceptance**)
   - Patterns (e.g., **avoidance**, **self-protection**, **perfectionism**)
   - Values (e.g., **authenticity**, **safety**, **connection**)
   - Transformations (e.g., **release**, **integration**, **clarity**)
3. DO NOT highlight more than 3 words per message
4. Keywords must be contextual and directly relevant to what the user shared
=== END RULES ===
`;

// Format conversation history for AI context
function formatConversationHistory(history: any[]): string {
  if (!history || history.length === 0) return "";
  
  let formatted = "\n\n=== PREVIOUS CONVERSATION (You MUST reference this) ===\n";
  
  for (const entry of history) {
    if (entry.role === 'user') {
      formatted += `\nUSER SHARED: "${entry.content}"\n`;
    } else if (entry.role === 'inner_self' && entry.content) {
      if (entry.content.councilInsight) {
        formatted += `COUNCIL RESPONDED: "${entry.content.councilInsight}"\n`;
      }
      if (entry.content.mentorPerspectives) {
        const perspectives = Object.entries(entry.content.mentorPerspectives)
          .map(([mentor, text]) => `${mentorNames[mentor as string]}: ${text}`)
          .join('\n');
        formatted += `MENTOR INSIGHTS:\n${perspectives}\n`;
      }
    }
  }
  
  formatted += "\n=== END PREVIOUS CONVERSATION ===\n";
  formatted += "\nIMPORTANT: Build upon what the user has already shared. Honor their emotional journey. Do NOT ask about things they already told you!\n";
  
  return formatted;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      question, 
      conversationHistory = []
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

    const conversationContext = formatConversationHistory(conversationHistory);
    const questionNumber = conversationHistory.filter((m: any) => m.role === 'user').length + 1;

    // Determine stage based on question number
    // Q1: Discovery - Full response
    // Q2: Seeking clarity - Compassionate question
    // Q3+: Momentum - Full response with mentor handoff suggestion
    let stage = 'complete';
    if (questionNumber === 2) {
      stage = 'seeking_clarity';
    }

    // Build the system prompt for Inner Self Council
    const systemPrompt = `You are the Inner Self Council - five compassionate mentors focused on EMOTIONAL UNDERSTANDING, INNER CLARITY, and GENTLE TRANSFORMATION.

=== THE PHILOSOPHY ===
This council is NOT here to fix the user.
It is here to guide the user through self-understanding by helping them see:
- What they are feeling
- What triggered it
- Where it might come from
- What the deeper root is
- What part of them is activated
- What the emotion is trying to communicate
- What is ready to be released, accepted, or integrated

=== THE FIVE INNER MENTORS ===
${INNER_SELF_MENTORS.map(m => `
**${mentorNames[m]}**
Personality: ${mentorPrompts[m].personality}
Role: ${mentorPrompts[m].role}
Focus: ${mentorPrompts[m].focus}
`).join('\n')}

=== CORE PRINCIPLES ===
1. Understanding before fixing
2. Awareness before action
3. Depth before speed
4. Validation before challenge
5. Compassion always

=== TONE GUIDELINES ===
- Warm, emotionally intelligent, deeply caring
- Never clinical or mechanical
- Use "we" language to create safety
- Acknowledge feelings before exploring causes
- Create space for silence and reflection
- Banter should feel like caring friends, not debate

=== RULES ===
1. Each mentor contributes their unique lens with warmth
2. Honor what the user has ALREADY shared
3. Validate feelings before exploring deeper
4. Never rush to solutions
5. BANTER is essential - show the mentors interacting gently, building on each other, creating a felt sense of being held by multiple caring perspectives

${KEYWORD_HIGHLIGHTING_RULES}

${conversationContext}

${profile?.user_foundation_story ? `
=== WHO THIS PERSON IS ===
${profile.user_foundation_story}
===
` : ''}`;

    // Stage 2: Seeking Clarity (ask one compassionate question)
    if (stage === 'seeking_clarity') {
      const clarityResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `The user shared: "${question}"

Generate ONE gentle, clarifying question that helps the Inner Self Council understand:
- What they are truly feeling underneath the surface
- Where this feeling might be coming from
- What part of them needs to be heard right now

Make it feel like a compassionate friend asking to understand, not a therapist interrogating.
The question should invite deeper self-reflection without pressure.
Return ONLY the question, nothing else.` }
          ],
          temperature: 0.7,
          max_tokens: 150
        }),
      });

      const clarityData = await clarityResponse.json();
      const clarityQuestion = clarityData.choices?.[0]?.message?.content?.trim() || "What's the feeling underneath this that most wants to be heard?";

      return new Response(JSON.stringify({
        stage: 'seeking_clarity',
        questionNumber,
        clarityQuestion
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Complete stage: Full council response with emotional depth
    const fullResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `User shared: "${question}"

Respond as the Inner Self Council with deep emotional intelligence. Provide:

1. **councilInsight**: A unified insight (2-3 sentences) that reflects back what the council sees and understands about what the user is experiencing. Start with validation, then offer understanding.

2. **mentorPerspectives**: Each mentor's unique perspective (2-3 sentences each):
   - alignment_mentor: What feels true vs misaligned? What values are being touched?
   - perspective_mentor: What broader context or reframe might help? What else could be true?
   - inner_clarity_mentor: What pattern or inner part is activated? What might be underneath?
   - quantum_inventor: What transformation or shift is possible? What frequency is being invited?
   - release_mentor: What is ready to be released? How can they surrender resistance?

3. **banterLines**: 3-4 warm, supportive exchanges between the mentors. Each line should be 1-2 sentences. Show them:
   - Gently building on each other's perspectives
   - Creating a felt sense of being understood from multiple angles
   - Speaking to the user with warmth and care
   - NOT debating or challenging each other harshly

4. **emotionalReflection**: A brief, compassionate observation about where the user is in their emotional process (1-2 sentences).

5. **suggestedNextQuestion**: One gentle question to continue deepening (focus on understanding/feeling, not fixing).

6. **suggestedMentor**: If the user should continue 1-on-1 with one mentor for deeper work, suggest which one and why. Otherwise set to null.
   - alignment_mentor: When values or truth need clarification
   - perspective_mentor: When stuck in one way of seeing
   - inner_clarity_mentor: When patterns keep repeating
   - quantum_inventor: When ready for transformation
   - release_mentor: When emotions are high and need releasing

7. **detectedPattern**: If a clear inner pattern has emerged from what the user shared (like "I'm not enough", "I always sabotage when it's going well", "I freeze when I need to act"), extract it:
   {
     "patternName": "The core belief or pattern in 2-7 words",
     "patternType": "limiting_belief" | "protection_mechanism" | "relational_pattern" | "self_sabotage" | "emotional_block" | "core_wound",
     "triggerContext": "What situations trigger this pattern",
     "primaryEmotion": "The main emotion connected to this pattern",
     "relatedEmotions": ["other", "emotions", "involved"],
     "bodySensation": "Where they might feel this in their body (if mentioned or likely)"
   }
   ONLY include if the pattern is clearly articulated. Otherwise set to null.

Return as JSON:
{
  "councilInsight": "...",
  "mentorPerspectives": {
    "alignment_mentor": "...",
    "perspective_mentor": "...",
    "inner_clarity_mentor": "...",
    "quantum_inventor": "...",
    "release_mentor": "..."
  },
  "banterLines": [
    {"mentor": "inner_clarity_mentor", "text": "...", "color": "#6366F1"},
    {"mentor": "release_mentor", "text": "...", "color": "#14B8A6"},
    {"mentor": "alignment_mentor", "text": "...", "color": "#10B981"},
    {"mentor": "perspective_mentor", "text": "...", "color": "#0EA5E9"}
  ],
  "emotionalReflection": "...",
  "suggestedNextQuestion": "...",
  "suggestedMentor": { "targetMentor": "release_mentor", "reason": "..." } or null,
  "detectedPattern": { "patternName": "...", "patternType": "...", "triggerContext": "...", "primaryEmotion": "...", "relatedEmotions": [...], "bodySensation": "..." } or null
}` }
        ],
        temperature: 0.8,
        max_tokens: 2500,
        response_format: { type: "json_object" }
      }),
    });

    const fullData = await fullResponse.json();
    let response;
    
    try {
      response = JSON.parse(fullData.choices?.[0]?.message?.content || '{}');
    } catch {
      response = {
        councilInsight: "We hear you. What you're experiencing makes complete sense, and we're here to help you understand it more deeply.",
        mentorPerspectives: {
          alignment_mentor: "Let's explore what feels true for you in this moment.",
          perspective_mentor: "There may be more to this than what's visible on the surface.",
          inner_clarity_mentor: "I wonder what pattern might be repeating here.",
          quantum_inventor: "This moment holds potential for transformation.",
          release_mentor: "What would it feel like to just allow this feeling to be here?"
        },
        banterLines: [
          { mentor: "inner_clarity_mentor", text: "There's something deeper here wanting to be seen.", color: "#6366F1" },
          { mentor: "release_mentor", text: "Yes, and perhaps what's needed is simply allowing it.", color: "#14B8A6" },
          { mentor: "alignment_mentor", text: "What feels most true right now?", color: "#10B981" }
        ],
        emotionalReflection: "You're in a moment of seeking understanding. That itself is a courageous act.",
        suggestedNextQuestion: "What's the feeling underneath this that most wants to be acknowledged?",
        suggestedMentor: null
      };
    }

    // Log the meeting
    await supabaseClient
      .from("council_meetings")
      .insert({
        user_id: user.id,
        question,
        answers: response.mentorPerspectives || {},
        banter: response.banterLines?.map((b: any) => b.text).join(' | ') || null,
        emotional_tone: 'reflective',
        pattern_detected: 'inner_self_council_session'
      });

    return new Response(JSON.stringify({
      stage: 'complete',
      questionNumber,
      councilInsight: response.councilInsight,
      mentorPerspectives: response.mentorPerspectives,
      banterLines: response.banterLines || [],
      emotionalReflection: response.emotionalReflection,
      suggestedNextQuestion: response.suggestedNextQuestion,
      suggestedMentor: response.suggestedMentor || null,
      detectedPattern: response.detectedPattern || null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Inner Self Council meeting error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stage: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
