import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error("Not authenticated");
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if daily challenge already exists for today
    const { data: existingChallenge } = await supabaseClient
      .from("daily_challenge")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (existingChallenge) {
      return new Response(
        JSON.stringify({ challenge: existingChallenge }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gather context data
    const [currentChallengeResult, profileResult, domainsResult, recentDotsResult, recentTasksResult, shadowsResult] = await Promise.all([
      supabaseClient.from("current_challenge").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
      supabaseClient.from("profiles").select("main_mission, purpose_path, human_design_data").eq("id", user.id).single(),
      supabaseClient.from("life_domains").select("*").eq("user_id", user.id).order("current_score", { ascending: true }).limit(3),
      supabaseClient.from("insight_dots").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabaseClient.from("tasks").select("*").eq("user_id", user.id).eq("status", "completed").order("created_at", { ascending: false }).limit(5),
      supabaseClient.from("shadow_encounters").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3)
    ]);

    const currentChallenge = currentChallengeResult.data;
    const profile = profileResult.data;
    const domains = domainsResult.data || [];
    const recentDots = recentDotsResult.data || [];
    const recentTasks = recentTasksResult.data || [];
    const shadows = shadowsResult.data || [];

    // Build AI prompt
    let systemPrompt = `You are a purpose-aligned challenge generator. Create ONE specific, actionable daily challenge that helps the user move forward.

The challenge should be:
- Concrete and achievable in one day
- Directly connected to their stated purpose and current challenge
- Small enough to not overwhelm, significant enough to create progress
- Focused on action, not just thinking

Return a JSON object with:
{
  "title": "Clear, action-oriented title (max 60 chars)",
  "description": "Specific 2-3 sentence description of what to do and why it matters",
  "source_reason": "Brief explanation of why this challenge was chosen based on their context"
}`;

    let userPrompt = `Generate today's purpose-aligned challenge.

USER CONTEXT:`;

    if (currentChallenge) {
      userPrompt += `\n\nCURRENT CHALLENGE (HIGHEST PRIORITY):
Title: ${currentChallenge.challenge_title}
Description: ${currentChallenge.challenge_description}
Type: ${currentChallenge.challenge_type}
${currentChallenge.shadow_tag ? `Shadow Tag: ${currentChallenge.shadow_tag}` : ''}

IMPORTANT: Generate a challenge that helps them take one small step into or through this challenge.`;
    }

    if (profile?.main_mission) {
      userPrompt += `\n\nPURPOSE/MISSION: ${profile.main_mission}`;
    }

    if (profile?.purpose_path) {
      userPrompt += `\nPurpose Path: ${profile.purpose_path}`;
    }

    if (domains.length > 0) {
      userPrompt += `\n\nLOWEST SCORING LIFE DOMAINS (areas needing attention):`;
      domains.forEach(d => {
        userPrompt += `\n- ${d.domain_name}: Current score ${d.current_score}/10`;
      });
    }

    if (recentDots.length > 0) {
      userPrompt += `\n\nRECENT INSIGHTS & PATTERNS:`;
      recentDots.slice(0, 5).forEach(dot => {
        userPrompt += `\n- ${dot.core_theme}: ${dot.insight_text.substring(0, 100)}`;
      });
    }

    if (recentTasks.length > 0) {
      userPrompt += `\n\nRECENT COMPLETED TASKS (showing progress):`;
      recentTasks.slice(0, 3).forEach(task => {
        userPrompt += `\n- ${task.task_title}`;
      });
    }

    if (shadows.length > 0) {
      userPrompt += `\n\nRECENT SHADOW WORK:`;
      shadows.forEach(shadow => {
        userPrompt += `\n- ${shadow.shadow_name}: ${shadow.shadow_statement}`;
      });
    }

    // Call Lovable AI
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
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error("Failed to generate challenge");
    }

    const aiData = await aiResponse.json();
    const challengeData = JSON.parse(aiData.choices[0].message.content);

    // Create the daily challenge
    const { data: newChallenge, error: insertError } = await supabaseClient
      .from("daily_challenge")
      .insert({
        user_id: user.id,
        date: today,
        challenge_title: challengeData.title,
        challenge_description: challengeData.description,
        source_reason: challengeData.source_reason,
        status: "pending"
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ challenge: newChallenge }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating daily challenge:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});