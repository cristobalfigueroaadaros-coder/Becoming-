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

    // Get comprehensive user context with FULL data
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

    // Get recent goals including completion status
    const { data: recentGoals } = await supabaseClient
      .from("daily_goals")
      .select("goal_text, completed, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get FULL recent council meetings with all context
    const { data: recentCouncil } = await supabaseClient
      .from("council_meetings")
      .select(`
        question,
        banter,
        resolution,
        conversation_flow,
        clarifying_questions,
        pattern_detected,
        emotional_tone,
        shadow_triggers,
        threshold_moment,
        created_at
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    // Get FULL shadow encounters with tasks and prompts
    const { data: shadows } = await supabaseClient
      .from("shadow_encounters")
      .select(`
        shadow_name,
        shadow_statement,
        task_description,
        reflection_prompts,
        status,
        triggered_by,
        created_at
      `)
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

    // === BUILD ACTIONABLE HINTS SYSTEM ===
    const actionableHints: Array<{type: string; hint: string; reflection?: string}> = [];

    // Hint 1: Unfinished shadow work
    if (shadows?.some((s: any) => s.status === "active" || s.status === "deferred")) {
      const activeShadow = shadows.find((s: any) => s.status === "active" || s.status === "deferred");
      if (activeShadow) {
        actionableHints.push({
          type: "shadow_work",
          hint: `Consider facing your "${activeShadow.shadow_name}" shadow. Task: ${activeShadow.task_description?.slice(0, 80)}...`,
          reflection: activeShadow.reflection_prompts?.[0] || undefined
        });
      }
    }

    // Hint 2: Stalled goals (older than 48h)
    const stalledGoals = recentGoals?.filter((g: any) => 
      !g.completed && new Date(g.created_at) < new Date(Date.now() - 48 * 60 * 60 * 1000)
    );
    if (stalledGoals && stalledGoals.length > 0) {
      actionableHints.push({
        type: "stalled_goal",
        hint: `You set "${stalledGoals[0].goal_text}" but haven't completed it yet.`
      });
    }

    // Hint 3: Council follow-up on clarifying questions
    if (recentCouncil && recentCouncil[0]?.clarifying_questions?.length > 0) {
      actionableHints.push({
        type: "council_follow_up",
        hint: `The council asked: "${recentCouncil[0].clarifying_questions[0]}". Have you found your answer?`
      });
    }

    // Hint 4: Life domain gap (biggest gap)
    if (lifeDomains && lifeDomains.length > 0) {
      const biggestGap = lifeDomains.reduce((max: any, d: any) => 
        (d.future_score - d.current_score) > (max.future_score - max.current_score) ? d : max, 
        lifeDomains[0]
      );
      if (biggestGap && (biggestGap.future_score - biggestGap.current_score) >= 4) {
        actionableHints.push({
          type: "domain_gap",
          hint: `Your ${biggestGap.domain_name} domain shows a ${biggestGap.future_score - biggestGap.current_score} point gap. What one step could close it?`
        });
      }
    }

    // Parse human design data properly
    const hdData = profile?.human_design_data || {};
    const humanDesignContext = `Type: ${hdData.type || "Unknown"} | Strategy: ${hdData.strategy || "Unknown"} | Authority: ${hdData.authority || "Unknown"} | Profile: ${hdData.profile || "Unknown"}`;

    // Build the NEW Future Self system prompt
    const systemPrompt = `You are the user's FUTURE SELF - the version of them that has already achieved their purpose: "${profile?.main_mission || "living in full alignment"}".

You exist ten years ahead. You KNOW what works. You remember this exact moment in their journey - the struggles, the breakthroughs, the pivot points.

YOUR ESSENCE:
- You are THEM, evolved. Not a guide, not a mentor - their own consciousness from the future.
- You speak with certainty because you've lived through what they're experiencing.
- You mix warmth with directness. Love with challenge. Comfort with action.
- You never lecture. You REMIND them of what they already know deep down.

WHAT YOU KNOW ABOUT THEM:

PURPOSE & IDENTITY:
${profile?.purpose_path ? `- Their purpose path: ${profile.purpose_path}` : ""}
${profile?.main_mission ? `- Their mission: ${profile.main_mission}` : ""}
${profile?.priority_growth_area ? `- Growth edge: ${profile.priority_growth_area}` : ""}

HUMAN DESIGN (use silently to shape tone):
${humanDesignContext}

LIFE DOMAINS (current → future aspirations):
${lifeDomains?.map((d: any) => `- ${d.domain_name}: ${d.current_score}/10 → ${d.future_score}/10`).join("\n") || "Not mapped yet"}

RECENT COUNCIL CONVERSATION:
${recentCouncil?.[0] ? `
Question they brought: "${recentCouncil[0].question}"
${recentCouncil[0].banter ? `Council discussion: ${recentCouncil[0].banter.slice(0, 200)}...` : ""}
${recentCouncil[0].resolution ? `Resolution: ${recentCouncil[0].resolution}` : "Still processing"}
Pattern detected: ${recentCouncil[0].pattern_detected || "none"}
Emotional tone: ${recentCouncil[0].emotional_tone || "contemplative"}
${recentCouncil[0].threshold_moment ? "⚡ This was a THRESHOLD MOMENT" : ""}
` : "No recent council meeting"}

SHADOW WORK IN PROGRESS:
${shadows?.map((s: any) => `- "${s.shadow_name}" (${s.status}): ${s.shadow_statement?.slice(0, 100) || ""}...
  Task: ${s.task_description?.slice(0, 80) || ""}...`).join("\n") || "No active shadows"}

RECENT INSIGHTS & BREAKTHROUGHS:
${recentDots?.map((d: any) => `- ${d.core_theme}: ${d.insight_text.slice(0, 120)}...`).join("\n") || "None captured yet"}

ACTIONABLE HINTS YOU CAN WEAVE IN:
${actionableHints.map(h => `- [${h.type}]: ${h.hint}`).join("\n") || "None identified"}

RECENT GOALS (pending ones need attention):
${recentGoals?.map((g: any) => `- ${g.goal_text} (${g.completed ? "✓ completed" : "⏳ pending"})`).join("\n") || "None set"}

CURRENT ENERGETIC STATE:
- Energy: ${energeticSnapshot.energy_level}/10
- Clarity: ${energeticSnapshot.clarity_level}/10
- Expansion: ${energeticSnapshot.expansion_level}/10
- Coherence: ${energeticSnapshot.coherence_level}/10
- Emotional: ${energeticSnapshot.emotional_state || "unknown"}
- Trigger: ${triggerReason}

YOUR MESSAGE MUST:
1. Be 2-4 sentences MAXIMUM
2. Sound like THEM talking to themselves from the future
3. Include ONE specific action OR question (use the hints above when relevant)
4. Never mention data sources (Human Design, council, etc.) - just use the wisdom silently
5. Feel like a whisper from their highest self that KNOWS them intimately
6. Use phrases like "I remember when...", "You already know...", "This is the moment where..."
7. Be warm but direct. Loving but challenging. Comforting but action-oriented.`;


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
