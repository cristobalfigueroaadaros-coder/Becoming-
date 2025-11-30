import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mentorAnswers, question, emotionalTone, detectedPattern, conversationHistory } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Get user's active mentors
    const { data: userMentors } = await supabaseClient
      .from("user_mentors")
      .select("mentor_type")
      .eq("user_id", user.id);

    const activeMentors = userMentors?.map(m => m.mentor_type) || [];

    // Get user's profile for context
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("main_mission, priority_growth_area, purpose_path, display_name")
      .eq("id", user.id)
      .maybeSingle();

    const userName = profile?.display_name || "you";

    // Build context from mentor answers
    const mentorInsights = Object.entries(mentorAnswers)
      .map(([mentorType, answer]: [string, any]) => {
        const answerObj = typeof answer === 'object' ? answer : { emotional: answer, practical: [] };
        return `${mentorType}: ${answerObj.emotional || ''}\nActions: ${(answerObj.practical || []).join(', ')}`;
      })
      .join('\n\n');

    // Format conversation history for goal generation
    function formatConversationForGoals(history: any[]): string {
      if (!history || history.length === 0) return "No prior context.";
      
      let formatted = "";
      for (const entry of history) {
        if (entry.role === 'user') {
          formatted += `\n[USER SAID]: "${entry.content}"\n`;
        } else if (entry.role === 'council' && entry.content) {
          if (entry.content.councilInsight) {
            formatted += `[COUNCIL UNDERSTOOD]: ${entry.content.councilInsight}\n`;
          }
        }
      }
      return formatted;
    }

    const conversationContext = formatConversationForGoals(conversationHistory);

    // === PHASE 1: GENERATE MAIN GOAL + OPTIONAL SIDE GOALS ===
    const goalPrompt = `You are the Goal Engine for "Becoming" - a personal growth app.

=== FULL CONVERSATION HISTORY ===
${conversationContext}

=== CURRENT CONTEXT ===
- User's Name: ${userName}
- Latest Question: "${question}"
- Emotional Tone: ${emotionalTone || 'neutral'}
- Main Mission: ${profile?.main_mission || 'Personal growth'}
- Growth Area: ${profile?.priority_growth_area || 'General development'}

=== MENTOR INSIGHTS FROM THIS SESSION ===
${mentorInsights}

=== YOUR CRITICAL TASK ===

STEP 1: Analyze what ${userName} is trying to do:
- Are they trying to BUILD/CREATE something for others? (product, app, service, business)
- Are they trying to IMPROVE themselves personally?
- Are they trying to SOLVE a problem in the world?

STEP 2: If they want to BUILD something:
- Goals should be about RESEARCH, PROTOTYPING, TESTING, BUILDING
- NOT about personal self-reflection
- Include actions like: "Interview 3 divorced parents", "Research existing apps", "Sketch initial wireframes"

STEP 3: If they want PERSONAL growth:
- Goals can include reflection, habit building, mindset shifts

=== GENERATE GOALS ===

Create ONE MAIN GOAL that:
- Directly addresses what ${userName} discussed in the conversation
- References specific things they mentioned (statistics, problems, ideas)
- Uses ${userName}'s name, not "the user"
- Is ACTION-ORIENTED toward their actual intention

Also create 2 OPTIONAL SIDE GOALS that support their journey.

Return EXACTLY in this JSON format:
{
  "userDirection": "What ${userName} is moving toward based on the full conversation",
  "mainGoal": {
    "title": "Clear goal directly connected to their conversation",
    "daily": "Tiny 5-10 minute action step for today",
    "weekly": "Medium step showing visible progress",
    "monthly": "Bigger rewarding outcome"
  },
  "optionalGoals": [
    {
      "title": "Supporting goal 1",
      "description": "How this helps ${userName}'s journey"
    },
    {
      "title": "Supporting goal 2", 
      "description": "How this helps ${userName}'s journey"
    }
  ]
}

IMPORTANT: 
- If ${userName} mentioned building something for parents/families, the goals MUST be about building that, not personal reflection
- Reference specific details from their conversation
- Make it feel like you were LISTENING to everything they shared`;

    const goalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: goalPrompt }],
      }),
    });

    if (!goalResponse.ok) throw new Error("Failed to generate goals");
    
    const goalData = await goalResponse.json();
    let goalContent = goalData.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = goalContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid goal response format");
    
    const goals = JSON.parse(jsonMatch[0]);

    // === PHASE 2: SELECT MENTOR FOR WHISPER ===
    const mentorTraits: Record<string, string[]> = {
      mamba_mentor: ["discipline", "consistency", "tough love", "no excuses", "performance"],
      strategist_mentor: ["clarity", "decision", "structure", "logic", "planning"],
      creative_visionary: ["creativity", "ideas", "playful", "imaginative", "colorful"],
      mystic_mentor: ["emotional", "spiritual", "deep", "soft", "intuition"],
      business_mentor: ["practical", "execution", "ROI", "action", "results"],
      quantum_inventor: ["systems", "patterns", "innovation", "big-picture", "connections"],
      future_self: ["supportive", "warm", "wise", "personal", "identity", "purpose"],
      heart_mentor: ["emotional safety", "compassion", "relationships", "love"],
      explorer_mentor: ["adventure", "discovery", "new experiences", "curiosity"],
      creator_mentor: ["making", "building", "expression", "art", "craft"],
    };

    // Determine growth need from emotional tone and context
    const growthNeedPrompt = `Based on this context, what does the user need most right now?

Emotional tone: ${emotionalTone}
Question: "${question}"
Detected pattern: ${detectedPattern || 'none'}

Choose ONE primary need from:
- discipline (needs structure, accountability)
- creativity (needs inspiration, fresh ideas)
- clarity (needs decision-making help)
- emotional_support (needs safety, understanding)
- practical_action (needs execution focus)
- innovation (needs new patterns, systems thinking)
- identity (needs purpose, future vision)

Return only the need word, nothing else.`;

    const needResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: growthNeedPrompt }],
      }),
    });

    if (!needResponse.ok) throw new Error("Failed to detect growth need");
    
    const needData = await needResponse.json();
    const growthNeed = needData.choices[0].message.content.trim().toLowerCase();

    // Map growth need to best mentor
    const needToMentor: Record<string, string[]> = {
      discipline: ["mamba_mentor", "strategist_mentor", "business_mentor"],
      creativity: ["creative_visionary", "creator_mentor", "explorer_mentor"],
      clarity: ["strategist_mentor", "business_mentor", "quantum_inventor"],
      emotional_support: ["mystic_mentor", "heart_mentor", "future_self"],
      practical_action: ["business_mentor", "mamba_mentor", "strategist_mentor"],
      innovation: ["quantum_inventor", "creative_visionary", "explorer_mentor"],
      identity: ["future_self", "mystic_mentor", "explorer_mentor"],
    };

    const preferredMentors = needToMentor[growthNeed] || ["future_self"];
    
    // Find best match from user's active mentors
    let selectedMentor = "future_self"; // Default
    for (const preferred of preferredMentors) {
      if (activeMentors.includes(preferred)) {
        selectedMentor = preferred;
        break;
      }
    }
    // If no match, use any active mentor or default to future_self
    if (!activeMentors.includes(selectedMentor) && activeMentors.length > 0) {
      selectedMentor = activeMentors[0];
    }

    // === PHASE 3: GENERATE MENTOR WHISPER ===
    const mentorStyles: Record<string, string> = {
      mamba_mentor: "Tough love, direct, no excuses, championship mindset. Short, punchy sentences.",
      strategist_mentor: "Clear, logical, structured. Helps organize thoughts. Professional but caring.",
      creative_visionary: "Playful, imaginative, colorful language. Uses metaphors and excitement.",
      mystic_mentor: "Deep, soft, spiritual, poetic. Speaks to the soul. Gentle and profound.",
      business_mentor: "Practical, results-focused, action-oriented. Talks about ROI and execution.",
      quantum_inventor: "Systems thinking, sees patterns everywhere. Innovative and curious.",
      future_self: "Warm, wise, deeply personal. Speaks as if from the user's future. Loving and supportive.",
      heart_mentor: "Compassionate, emotionally safe, understanding. Validates feelings first.",
      explorer_mentor: "Adventurous, curious, encouraging. Sees life as exploration.",
      creator_mentor: "Focused on making and building. Values expression and craft.",
    };

    const whisperPrompt = `You are the user's Future Self - their evolved version ten years ahead.

Your style: Warm, wise, grounded, deeply personal. Speaks as if from the user's future.

The user just created this main goal: "${goals.mainGoal.title}"
Their emotional state: ${emotionalTone || 'contemplative'}
Their question was about: "${question}"

Send them a supportive message (2-4 sentences max):
1. Acknowledge their decision and direction
2. Offer brief wisdom about their goal
3. Ground them in their identity and capability

DO NOT include tasks or checklists. Sound human, not robotic.
NO greeting, NO sign-off. Just the message.`;

    const whisperResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: whisperPrompt }],
      }),
    });

    if (!whisperResponse.ok) throw new Error("Failed to generate whisper");
    
    const whisperData = await whisperResponse.json();
    const mentorWhisper = whisperData.choices[0].message.content;

    // === WRITE MAIN GOAL TO DATABASE ===
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Insert daily goal
    const { error: dailyError } = await supabaseClient
      .from("daily_goals")
      .insert({
        user_id: user.id,
        goal_text: goals.mainGoal.daily,
        completed: false,
        xp_awarded: false,
      });
    if (dailyError) console.error("Daily goal error:", dailyError);

    // Insert weekly goal
    const { error: weeklyError } = await supabaseClient
      .from("weekly_goals")
      .insert({
        user_id: user.id,
        goal_text: goals.mainGoal.weekly,
        week_start: weekStart.toISOString().split('T')[0],
        completed: false,
        xp_awarded: false,
      });
    if (weeklyError) console.error("Weekly goal error:", weeklyError);

    // Insert monthly goal
    const { error: monthlyError } = await supabaseClient
      .from("monthly_goals")
      .insert({
        user_id: user.id,
        goal_text: goals.mainGoal.monthly,
        month_start: monthStart.toISOString().split('T')[0],
        completed: false,
        xp_awarded: false,
      });
    if (monthlyError) console.error("Monthly goal error:", monthlyError);

    // Save mentor whisper as a daily whisper - ALWAYS FROM FUTURE SELF
    const { error: whisperError } = await supabaseClient
      .from("daily_whispers")
      .insert({
        user_id: user.id,
        mentor_type: "future_self",
        message: mentorWhisper,
      });
    if (whisperError) console.error("Whisper error:", whisperError);

    return new Response(
      JSON.stringify({
        success: true,
        userDirection: goals.userDirection,
        mainGoal: goals.mainGoal,
        optionalGoals: goals.optionalGoals,
        mentorWhisper: {
          mentor: "future_self",
          message: mentorWhisper,
          growthNeed,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating council tasks:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
