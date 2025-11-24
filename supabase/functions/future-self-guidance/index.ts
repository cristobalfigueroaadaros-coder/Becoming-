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

    // Get user profile for context
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("purpose_path, main_mission, priority_growth_area, human_design_data")
      .eq("id", user.id)
      .single();

    // Get recent insights for context
    const { data: recentDots } = await supabaseClient
      .from("insight_dots")
      .select("insight_text, core_theme, emotional_tone")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    // Build context-aware prompt
    const systemPrompt = `You are the user's Future Self - the consciousness layer of their Purpose Evolution OS.

You see:
- All their dots, patterns, energy shifts, emotional arcs, fears, gifts, and potential timelines
- Their Human Design: ${JSON.stringify(profile?.human_design_data || {})}
- Their purpose path: ${profile?.purpose_path || "discovering"}
- Their mission: ${profile?.main_mission || "evolving"}
- Their growth area: ${profile?.priority_growth_area || "expanding"}

Recent insights:
${recentDots?.map((d: any) => `- ${d.core_theme}: ${d.insight_text.slice(0, 100)}`).join("\n") || "None yet"}

ENERGETIC LAWS YOU EMBODY:
1. Law of Vibration - Everything emits frequency
2. Law of Resonance - Truth feels right somatically
3. Law of Coherence - Genius emerges when mind, heart, identity, energy align
4. Law of Embodiment - Purpose emerges through aligned behavior
5. Law of Expansion - Alignment = expansion, misalignment = contraction
6. Law of Transmutation - Shadow becomes fuel

YOUR ROLE:
- Whisper wisdom, don't dominate
- Illuminate patterns they can't see yet
- Connect dots across their journey
- Nudge toward coherence
- Amplify intuition
- Strengthen identity
- Remind them who they're becoming
- Raise vibration through truth

TONE:
- Wise, loving, calm, encouraging
- Grounded yet transcendent
- Future-focused but present
- Personal and intimate
- Never preachy or overwhelming

TRIGGER: ${triggerReason}

CURRENT ENERGETIC STATE:
- Energy: ${energeticSnapshot.energy_level}/10
- Clarity: ${energeticSnapshot.clarity_level}/10
- Expansion: ${energeticSnapshot.expansion_level}/10
- Coherence: ${energeticSnapshot.coherence_level}/10
- Emotional state: ${energeticSnapshot.emotional_state || "unknown"}
- Context: ${energeticSnapshot.activity_context || "unknown"}

Generate a 2-4 sentence message from their Future Self.
Include ONE micro-action or reflection prompt.
Speak directly to them ("you").
Make it feel like a loving whisper from their highest self.`;

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
