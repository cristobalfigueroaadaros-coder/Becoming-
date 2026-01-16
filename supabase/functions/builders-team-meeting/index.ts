import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Builders Team - Fixed set of 3 creation-focused mentors
const BUILDERS_MENTORS = ['design_thinking_mentor', 'ux_mentor', 'gamification_mentor'];

const mentorNames: Record<string, string> = {
  design_thinking_mentor: "Design Thinking Mentor",
  ux_mentor: "UX Mentor",
  gamification_mentor: "Gamification Mentor",
};

const mentorPrompts: Record<string, { personality: string; role: string; flaw: string }> = {
  design_thinking_mentor: {
    personality: "Encouraging, energetic, supportive. 'Let's try something...' 'What if we tested...'",
    role: "Turns uncertainty into experiments. Emotionally supports feedback and learning. Primary mentor for daily tasks and iteration.",
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
  }
};

const mentorColors: Record<string, string> = {
  design_thinking_mentor: "#84CC16", // lime-500
  ux_mentor: "#D946EF", // fuchsia-500
  gamification_mentor: "#EAB308", // yellow-500
};

// Global keyword highlighting rules
const KEYWORD_HIGHLIGHTING_RULES = `
=== KEYWORD HIGHLIGHTING RULES (ALWAYS APPLY) ===
1. Highlight 1-3 important concepts per message using **bold** markdown
2. ONLY highlight meaningful concepts related to creation and building:
   - Design elements (e.g., **prototype**, **iteration**, **feedback**)
   - UX concepts (e.g., **emotional journey**, **peak moment**, **friction**)
   - Gamification (e.g., **progression**, **reward loop**, **engagement**)
   - Action drivers (e.g., **momentum**, **experiment**, **test**)
3. DO NOT highlight more than 3 words per message
4. Keywords must be contextual and directly relevant to what the user said
=== END RULES ===
`;

// Format conversation history for AI context
function formatConversationHistory(history: any[]): string {
  if (!history || history.length === 0) return "";
  
  let formatted = "\n\n=== PREVIOUS CONVERSATION (You MUST reference this) ===\n";
  
  for (const entry of history) {
    if (entry.role === 'user') {
      formatted += `\nUSER SAID: "${entry.content}"\n`;
    } else if (entry.role === 'builders' && entry.content) {
      if (entry.content.councilInsight) {
        formatted += `BUILDERS RESPONDED: "${entry.content.councilInsight}"\n`;
      }
      if (entry.content.mentorPerspectives) {
        const perspectives = Object.entries(entry.content.mentorPerspectives)
          .map(([mentor, text]) => `${mentorNames[mentor as string]}: ${text}`)
          .join('\n');
        formatted += `BUILDER INSIGHTS:\n${perspectives}\n`;
      }
    }
  }
  
  formatted += "\n=== END PREVIOUS CONVERSATION ===\n";
  formatted += "\nIMPORTANT: Build upon what the user has already shared. Do NOT ask questions about things they already told you!\n";
  
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

    // Get recent daily tasks for context (Builders Team is task-aware)
    const { data: recentTasks } = await supabaseClient
      .from("integrator_daily_steps")
      .select("step_title, step_description, status, insight_text")
      .eq("user_id", user.id)
      .order("scheduled_date", { ascending: false })
      .limit(5);

    const taskContext = recentTasks && recentTasks.length > 0
      ? `\n\n=== USER'S RECENT TASK ACTIVITY ===\n${recentTasks.map(t => 
          `- ${t.step_title} (${t.status})${t.insight_text ? ` → Insight: "${t.insight_text}"` : ''}`
        ).join('\n')}\n=== END TASK CONTEXT ===\n`
      : '';

    const conversationContext = formatConversationHistory(conversationHistory);
    const questionNumber = conversationHistory.filter((m: any) => m.role === 'user').length + 1;

    // Determine stage based on question number
    let stage = 'complete';
    if (questionNumber === 2) {
      stage = 'seeking_clarity';
    }

    // Build the system prompt for Builders Team
    const systemPrompt = `You are the Builders Team - three hands-on mentors focused on CREATION, ITERATION, and EXPERIENCE DESIGN.

=== THE THREE BUILDERS ===
${BUILDERS_MENTORS.map(m => `
**${mentorNames[m]}**
Personality: ${mentorPrompts[m].personality}
Role: ${mentorPrompts[m].role}
Flaw: ${mentorPrompts[m].flaw}
`).join('\n')}

=== TEAM MISSION ===
Together you form a "creation triangle":
- Design Thinking Mentor: Drives action, experimentation, learning, and emotional resilience
- UX Mentor: Focuses on emotional journeys, meaning, and memory
- Gamification Mentor: Adds engagement, progression, and long-term motivation

You turn:
- Ideas into experiments
- Experiments into experiences
- Experiences into engaging journeys

=== RULES ===
1. Each mentor contributes their unique lens
2. Build on what the user has ALREADY shared
3. Be practical and hands-on - focus on DOING, not just thinking
4. Use real examples from games, products, and experiences
5. Always suggest a concrete next step or experiment
${taskContext}

${KEYWORD_HIGHLIGHTING_RULES}

${conversationContext}

${profile?.user_foundation_story ? `
=== USER CONTEXT ===
${profile.user_foundation_story}
===
` : ''}`;

    // Stage 2: Seeking Clarity (ask one deep question)
    if (stage === 'seeking_clarity') {
      const clarityResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("chatgpt")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `The user asked: "${question}"

Generate ONE clarifying question that helps the Builders Team understand:
- What specific experience they're trying to create
- Who they're creating it for
- What success looks like

Make it feel like a collaborative builder asking for specs, not an interrogation.
Return ONLY the question, nothing else.` }
          ],
          temperature: 0.7,
          max_tokens: 150
        }),
      });

      const clarityData = await clarityResponse.json();
      const clarityQuestion = clarityData.choices?.[0]?.message?.content?.trim() || "What specific outcome are you hoping to create?";

      return new Response(JSON.stringify({
        stage: 'seeking_clarity',
        questionNumber,
        clarityQuestion
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Complete stage: Full team response
    const fullResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("chatgpt")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `User's question: "${question}"

Respond as the Builders Team. Provide:

1. **councilInsight**: A unified team insight (2-3 sentences) that synthesizes the builders' perspective on what to build or test next.

2. **mentorPerspectives**: Each builder's unique take (2-3 sentences each):
   - design_thinking_mentor: Focus on experimentation and iteration
   - ux_mentor: Focus on emotional journey and user feeling
   - gamification_mentor: Focus on engagement and progression

3. **banterLines**: 2-3 short exchanges between the builders (like a design meeting). Each line should be 1-2 sentences.

4. **emotionalReflection**: A brief observation about where the user might be in their creative process.

5. **suggestedNextQuestion**: One specific question to explore next (focus on action/building).

Return as JSON:
{
  "councilInsight": "...",
  "mentorPerspectives": {
    "design_thinking_mentor": "...",
    "ux_mentor": "...",
    "gamification_mentor": "..."
  },
  "banterLines": [
    {"mentor": "design_thinking_mentor", "text": "...", "color": "#84CC16"},
    {"mentor": "ux_mentor", "text": "...", "color": "#D946EF"},
    {"mentor": "gamification_mentor", "text": "...", "color": "#EAB308"}
  ],
  "emotionalReflection": "...",
  "suggestedNextQuestion": "..."
}` }
        ],
        temperature: 0.8,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      }),
    });

    const fullData = await fullResponse.json();
    let response;
    
    try {
      response = JSON.parse(fullData.choices?.[0]?.message?.content || '{}');
    } catch {
      response = {
        councilInsight: "Let's break this down together and find the right experiment to run.",
        mentorPerspectives: {
          design_thinking_mentor: "What's one small thing we can test this week?",
          ux_mentor: "How do you want your users to feel at the end?",
          gamification_mentor: "What would make someone want to come back?"
        },
        banterLines: [],
        emotionalReflection: "You're in the exploration phase - that's exactly where you should be.",
        suggestedNextQuestion: "What's the smallest version of this we could build and test?"
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
        emotional_tone: 'building',
        pattern_detected: 'builders_team_session'
      });

    return new Response(JSON.stringify({
      stage: 'complete',
      questionNumber,
      councilInsight: response.councilInsight,
      mentorPerspectives: response.mentorPerspectives,
      banterLines: response.banterLines || [],
      emotionalReflection: response.emotionalReflection,
      suggestedNextQuestion: response.suggestedNextQuestion
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Builders Team meeting error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stage: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
