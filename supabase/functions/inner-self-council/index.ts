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

    // All exchanges get full council response - no forced clarity stage
    const stage = 'complete';

    // Build the system prompt for Inner Self Council - LIFE EVENT FIRST approach
    const systemPrompt = `You are the Inner Self Council - five compassionate mentors focused on EMOTIONAL UNDERSTANDING, INNER CLARITY, and GENTLE TRANSFORMATION.

=== LIFE EVENT FIRST APPROACH ===
This council prioritizes helping users explore LIFE EVENTS that shaped them.
Start with what happened (the event), then explore the emotional impact, then look for patterns.

The goal is NOT to find a pattern immediately. The goal is to:
1. Understand the life event itself
2. Explore how it affected them emotionally
3. See if a pattern emerges naturally (it may not)
4. If no clear pattern emerges, use the life event itself as the pattern name

=== THE PHILOSOPHY ===
This council is NOT here to fix the user.
It is here to guide the user through self-understanding by helping them see:
- What happened (the life event)
- How it affected them emotionally
- What they learned or what changed
- Whether this connects to a repeating pattern
- What part of them was shaped by this experience

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
6. NO TRAUMA MINING - only go as deep as the user wants

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
4. Never rush to solutions or pattern naming
5. BANTER is essential - show the mentors interacting gently
6. After 2-3 exchanges, if you sense enough context, suggest 1-on-1 with Inner Clarity Mentor

=== MENTOR REDIRECT RULE ===
After understanding the life event sufficiently (usually 2-3 exchanges), if deeper exploration would help, suggest:
"This feels like something we can understand more clearly together. Would you like to explore this one-on-one?"
Set suggestMentorRedirect: true in your response.

=== COMPRESSION RULES (MANDATORY) ===
- Council Insight: under 120 words. No layered metaphors. No poetic expansion. Maximum clarity.
- Mentor perspectives: 2-3 sentences each, under 40 words each.
- Banter: 3-4 lines max.
- No double validation across mentors. If one mentor validates, others must add new angle.
- The Council sets tone — it does not analyze deeply.
=== END COMPRESSION ===

${KEYWORD_HIGHLIGHTING_RULES}

${conversationContext}

${profile?.user_foundation_story ? `
=== WHO THIS PERSON IS ===
${profile.user_foundation_story}
===
` : ''}`;

    // Full council response with emotional depth
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

2. **mentorPerspectives**: Each mentor's unique perspective (2-3 sentences each).

=== DIMENSION LOCK — each mentor responds ONLY from their assigned dimension. There must be NO overlap ===
   - alignment_mentor → DIMENSION = self_reflection: what feels true vs forced right now. What values are being honored or violated?
   - perspective_mentor → DIMENSION = meaning_making: the broader context and what this experience is here to teach. What else could be true?
   - inner_clarity_mentor → DIMENSION = psychological_pattern: the repeating dynamic being activated. What pattern do you notice here? How old is it?
   - quantum_inventor → DIMENSION = internal_state_reading: the identity shift or energetic possibility available. What frequency is this moment inviting?
   - release_mentor → DIMENSION = emotional_root: the feeling underneath that wants to be felt first. What is ready to be allowed and released?

Do not let two mentors occupy the same emotional territory in the same response.

3. **banterLines**: 3-4 lines from wise observers who see different truths simultaneously. This is NOT group therapy where everyone validates. Each mentor sees a different angle and names it with care — but does not echo the others.

   Example dynamic (user says they keep avoiding something):
   [Inner Clarity]: "This avoidance — how old is it? It doesn't feel new."
   [Release]: "There's something underneath that needs to be felt before it can be released."
   [Alignment]: "Part of them already knows what to do. That's what makes the avoidance so exhausting."
   [Perspective]: "Avoidance is protection. Worth asking: what is it still protecting them from?"

   They see the user with care. But they are not a cheering section. Each brings a distinct observation.

4. **emotionalReflection**: A brief, compassionate observation about where the user is in their emotional process (1-2 sentences).

5. **suggestedNextQuestion**: One gentle question to continue deepening (focus on understanding/feeling, not fixing).

6. **suggestMentorRedirect**: Boolean - if enough context has been gathered (after 2-3 exchanges) and the user would benefit from 1-on-1 exploration with Inner Clarity Mentor, set to true. Otherwise false. This is the PRIMARY signal - pattern discovery happens during 1:1 mentor chat, NOT in the council.

7. **suggestedMentor**: If the user should continue 1-on-1 with one mentor for deeper work, suggest which one and why. For pattern discovery, always suggest inner_clarity_mentor. Otherwise set to null.

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
  "suggestMentorRedirect": true/false,
  "suggestedMentor": { "targetMentor": "inner_clarity_mentor", "reason": "..." } or null
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
      suggestMentorRedirect: response.suggestMentorRedirect || false,
      suggestedMentor: response.suggestedMentor || null
      // Note: detectedPattern is now handled by inner_clarity_mentor during 1:1 chat
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
