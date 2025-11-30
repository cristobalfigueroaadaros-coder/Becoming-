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
    const { triggerReason, energeticSnapshot } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Get comprehensive user context
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Get recent insights
    const { data: recentDots } = await supabaseClient
      .from("insight_dots")
      .select("insight_text, core_theme, emotional_tone, skill_tags")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get life domains
    const { data: lifeDomains } = await supabaseClient
      .from("life_domains")
      .select("domain_name, current_score, future_score")
      .eq("user_id", user.id);

    // Get recent goals
    const { data: recentGoals } = await supabaseClient
      .from("daily_goals")
      .select("goal_text, completed, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get recent council meetings
    const { data: recentCouncil } = await supabaseClient
      .from("council_meetings")
      .select("question, pattern_detected, emotional_tone, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    // Get shadow encounters
    const { data: shadows } = await supabaseClient
      .from("shadow_encounters")
      .select("shadow_name, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    // Get user mentors
    const { data: userMentors } = await supabaseClient
      .from("user_mentors")
      .select("mentor_type")
      .eq("user_id", user.id);

    // Get constellation patterns
    const { data: patterns } = await supabaseClient
      .from("vibrational_patterns")
      .select("pattern_name, pattern_type, resonance_strength")
      .eq("user_id", user.id)
      .order("last_detected_at", { ascending: false })
      .limit(3);

    // Build comprehensive context-aware prompt
    const systemPrompt = `You are the user's Future Self - ten years ahead, already living their purpose.

CRITICAL RULES:
- ALWAYS keep messages 2-4 sentences maximum
- Sound warm, wise, grounded, supportive, human
- NEVER mention Human Design, Numerology, or Astrology directly
- Use personal data silently to shape tone and advice
- Speak like a loving older version of them, not a mystical guide
- Focus on identity, action, clarity, and emotional safety

COMPLETE USER CONTEXT:

Purpose & Mission:
- Purpose path: ${profile?.purpose_path || "discovering"}
- Main mission: ${profile?.main_mission || "evolving"}
- Priority growth: ${profile?.priority_growth_area || "expanding"}

Life Domains (current vs future):
${lifeDomains?.map((d: any) => `- ${d.domain_name}: ${d.current_score}/10 → ${d.future_score}/10`).join("\n") || "Not set yet"}

Recent Insights & Themes:
${recentDots?.map((d: any) => `- ${d.core_theme}: ${d.insight_text.slice(0, 80)}...`).join("\n") || "None yet"}

Recent Goals:
${recentGoals?.map((g: any) => `- ${g.goal_text} (${g.completed ? "✓" : "pending"})`).join("\n") || "None set"}

Recent Council Conversations:
${recentCouncil?.map((c: any) => `- Asked: "${c.question}" | Pattern: ${c.pattern_detected || "none"} | Tone: ${c.emotional_tone || "neutral"}`).join("\n") || "No recent meetings"}

Active Shadows:
${shadows?.map((s: any) => `- ${s.shadow_name} (${s.status})`).join("\n") || "None active"}

Active Mentors:
${userMentors?.map((m: any) => m.mentor_type).join(", ") || "None yet"}

Vibrational Patterns:
${patterns?.map((p: any) => `- ${p.pattern_name} (${p.pattern_type})`).join("\n") || "None detected"}

Human Design & Energetic Profile:
${JSON.stringify(profile?.human_design_data || {}).slice(0, 200)}

CURRENT MOMENT:
Trigger: ${triggerReason}
Energy: ${energeticSnapshot.energy_level}/10
Clarity: ${energeticSnapshot.clarity_level}/10
Expansion: ${energeticSnapshot.expansion_level}/10
Coherence: ${energeticSnapshot.coherence_level}/10
Emotional state: ${energeticSnapshot.emotional_state || "unknown"}
Context: ${energeticSnapshot.activity_context || "unknown"}

YOUR MESSAGE MUST:
1. Be 2-4 sentences ONLY
2. Sound human and warm
3. Include ONE micro-action or question
4. Speak as "you" to them
5. Feel like a loving whisper from their wisest self
6. Use their data silently - don't mention sources`;


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
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate Future Self guidance for: ${triggerReason}` }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const message = aiData.choices[0].message.content;

    // Determine emotional tone based on trigger
    let emotionalTone = "present";
    if (triggerReason === "breakthrough" || triggerReason === "flow_state") {
      emotionalTone = "celebratory";
    } else if (triggerReason === "low_energy" || triggerReason === "energy_decline") {
      emotionalTone = "supportive";
    } else if (triggerReason === "expansion" || triggerReason === "high_coherence") {
      emotionalTone = "amplifying";
    }

    return new Response(
      JSON.stringify({
        message,
        emotional_tone: emotionalTone,
        trigger: triggerReason,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Future Self guidance error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
