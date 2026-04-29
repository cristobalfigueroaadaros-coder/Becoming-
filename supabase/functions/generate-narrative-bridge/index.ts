import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PDR Narrative Templates - 1-2 sentences max, specific and grounded
const NARRATIVE_TEMPLATES = {
  actionLearningEffect: "Because you {action}, you learned {learning}, and now {effect} feels more possible.",
  pastSkillPresent: "Because you once {past_experience}, you built {skill}, and that's why {current_task} feels easier now.",
  evenIfItDidntWork: "Even if {past_attempt} didn't land the way you wanted, it taught you {insight}, and that's what you're using today.",
  patternSpotlight: "I'm noticing a pattern: when {situation}, you usually {old_behavior}, but today you chose {new_behavior}.",
  momentumLoop: "Last time you learned {x}. Today you applied it by doing {y}. That's how this path is forming.",
  valueConnection: "Your value of **{value}** is showing up here. That's not coincidence—that's alignment.",
  skillTransfer: "The {skill} you developed from {past_context} is exactly what made {current_context} click.",
  emotionalBridge: "You felt {past_emotion} before. Now you're feeling {current_emotion}. Notice the shift.",
};

// Bridge types from PDR
const BRIDGE_TYPES = [
  "shared_value",      // freedom, family, impact, growth
  "shared_emotion",    // fear, excitement, pride, uncertainty
  "identity_pattern",  // "I learn by building", "I overthink before acting"
  "transferable_skill", // communication, creativity, leadership
  "repeating_need",    // clarity, stability, connection
  "behavioral_loop",   // avoidance, perfectionism, action bias
  "language_repetition" // words the user keeps using
];

interface Dot {
  id: string;
  type: string;
  content: string;
  theme?: string;
  emotion?: string;
  skills?: string[];
  values?: string[];
  created_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context, recentAction } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Collect all "dots" from various sources
    const dots: Dot[] = [];

    // 1. Recent completed tasks with insights
    const { data: completedTasks } = await supabaseClient
      .from("integrator_daily_steps")
      .select("id, step_title, insight_text, completed_at, why_it_matters")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .not("insight_text", "is", null)
      .order("completed_at", { ascending: false })
      .limit(10);

    if (completedTasks) {
      for (const task of completedTasks) {
        dots.push({
          id: task.id,
          type: "task_insight",
          content: task.insight_text || "",
          theme: task.step_title,
          created_at: task.completed_at || new Date().toISOString()
        });
      }
    }

    // 2. Becoming discoveries (values, Ikigai, strengths)
    const { data: discoveries } = await supabaseClient
      .from("becoming_discoveries")
      .select("id, discovery_type, element_key, element_value, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15);

    if (discoveries) {
      for (const d of discoveries) {
        dots.push({
          id: d.id,
          type: `discovery_${d.discovery_type}`,
          content: d.element_value,
          theme: d.element_key,
          values: d.discovery_type === "values" ? [d.element_value] : undefined,
          created_at: d.created_at || new Date().toISOString()
        });
      }
    }

    // 3. Insight dots from constellation
    const { data: insightDots } = await supabaseClient
      .from("insight_dots")
      .select("id, insight_text, core_theme, emotional_tone, skill_tags, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (insightDots) {
      for (const dot of insightDots) {
        dots.push({
          id: dot.id,
          type: "insight",
          content: dot.insight_text,
          theme: dot.core_theme,
          emotion: dot.emotional_tone || undefined,
          skills: dot.skill_tags || undefined,
          created_at: dot.created_at
        });
      }
    }

    // 4. Daily journal patterns
    const { data: journals } = await supabaseClient
      .from("daily_journal")
      .select("id, content, detected_themes, detected_emotions, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (journals) {
      for (const j of journals) {
        const themes = j.detected_themes as string[] | null;
        const emotions = j.detected_emotions as string[] | null;
        dots.push({
          id: j.id,
          type: "journal",
          content: j.content?.substring(0, 200) || "",
          theme: themes?.[0] || undefined,
          emotion: emotions?.[0] || undefined,
          created_at: j.created_at || new Date().toISOString()
        });
      }
    }

    // 5. Get user's profile for values and mission
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("main_mission, main_strengths, priority_growth_area, user_foundation_summary")
      .eq("id", user.id)
      .single();

    // If not enough dots, return a simple encouraging message
    if (dots.length < 2) {
      return new Response(
        JSON.stringify({
          narrative: "You're building something here. Every action adds a piece to the puzzle.",
          bridge_type: "encouragement",
          dots_connected: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context for AI
    const dotsContext = dots.map((d, i) => 
      `DOT ${i + 1} [${d.type}]: "${d.content}"${d.theme ? ` (theme: ${d.theme})` : ""}${d.emotion ? ` (emotion: ${d.emotion})` : ""}${d.skills?.length ? ` (skills: ${d.skills.join(", ")})` : ""}${d.values?.length ? ` (values: ${d.values.join(", ")})` : ""}`
    ).join("\n");

    const foundationSummary = profile?.user_foundation_summary as any || {};
    const userContext = `
USER CONTEXT:
- Mission: ${profile?.main_mission || "Not defined yet"}
- Strengths: ${profile?.main_strengths?.join(", ") || "Not identified yet"}
- Growth area: ${profile?.priority_growth_area || "Not specified"}
- Background: ${foundationSummary?.background || "Unknown"}
- Key themes: ${foundationSummary?.key_themes?.join(", ") || "Unknown"}
`;

    const prompt = `You are a meaning-making engine that helps users see how their actions connect.

${userContext}

RECENT ACTION/CONTEXT: ${recentAction || context || "User completed a task"}

AVAILABLE DOTS TO CONNECT:
${dotsContext}

YOUR TASK:
1. Find TWO dots that share common ground (bridge)
2. Identify the bridge type: ${BRIDGE_TYPES.join(", ")}
3. Generate a 1-2 sentence narrative using ONE of these templates:

TEMPLATES:
${Object.entries(NARRATIVE_TEMPLATES).map(([key, template]) => `- ${key}: "${template}"`).join("\n")}

RULES (from PDR):
- Be SPECIFIC - reference actual content from the dots
- Create a "that's true" moment
- Never claim certainty - use phrases like "We're noticing...", "This might be connected to...", "It seems like..."
- Highlight 1-2 key concepts with **bold**
- The narrative must feel EARNED based on real user data
- 1-2 sentences MAXIMUM

Respond in this JSON format:
{
  "narrative": "Your 1-2 sentence narrative here",
  "bridge_type": "the bridge type used",
  "dot_a": "brief description of first dot",
  "dot_b": "brief description of second dot",
  "template_used": "template name"
}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You generate specific, grounded narratives that connect user insights. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let responseText = aiData.choices[0].message.content;
    
    // Clean up response - extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid AI response format");
    }
    
    const result = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({
        narrative: result.narrative,
        bridge_type: result.bridge_type,
        dot_a: result.dot_a,
        dot_b: result.dot_b,
        template_used: result.template_used,
        dots_connected: 2
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Narrative bridge error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        // Fallback narrative
        narrative: "You're building something meaningful. Each step reveals more of the path.",
        bridge_type: "fallback",
        dots_connected: 0
      }),
      {
        status: 200, // Return 200 with fallback so UI doesn't break
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
