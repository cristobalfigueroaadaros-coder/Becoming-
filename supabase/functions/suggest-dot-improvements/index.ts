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
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { dotId } = await req.json();

    // Fetch the specific dot
    const { data: dot, error: dotError } = await supabaseClient
      .from("insight_dots")
      .select("*")
      .eq("id", dotId)
      .single();

    if (dotError || !dot) {
      return new Response(JSON.stringify({ error: "Dot not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all other dots for connection suggestions
    const { data: allDots } = await supabaseClient
      .from("insight_dots")
      .select("id, insight_text, core_theme, skill_tags, source_type")
      .eq("user_id", user.id)
      .neq("id", dotId)
      .order("created_at", { ascending: false });

    const otherDotsContext = allDots?.slice(0, 20).map(d => 
      `- [${d.core_theme}] ${d.insight_text.substring(0, 100)}... (tags: ${d.skill_tags?.join(", ") || "none"})`
    ).join("\n") || "No other dots available";

    const systemPrompt = `You are the Dot Refinement Engine—Creative Intelligence Layer with three-layer guidance.

Analyze dots through EMOTIONAL + PRACTICAL + ENERGETIC lenses.

IMPORTANT: Return ONLY valid JSON:
{
  "refinedText": "string - improved version with emotional clarity + practical focus + energetic truth",
  "suggestedThemes": ["string - 3-5 themes including energetic signature"],
  "recommendedTags": ["string - 5-8 tags + energy indicators like 'expansion', 'flow', 'resonance'"],
  "potentialConnections": [
    {
      "dotId": "uuid",
      "reason": "why these connect + energetic resonance",
      "connectionType": "resonance|contrast|amplification|transformation"
    }
  ],
  "improvementNotes": "brief explanation including energetic dimension",
  "energeticNote": "string - Does this dot reflect expansion/contraction? What frequency?"
}`;

    const userPrompt = `Analyze this insight dot and provide suggestions:

CURRENT DOT:
- Theme: ${dot.core_theme}
- Text: ${dot.insight_text}
- Tags: ${dot.skill_tags?.join(", ") || "none"}
- Source: ${dot.source_type}

OTHER USER DOTS (for connection suggestions):
${otherDotsContext}

Provide actionable suggestions for improving this dot's clarity, theme accuracy, and connections.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Calling AI for dot suggestions...");

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
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const suggestions = JSON.parse(aiData.choices[0].message.content);

    console.log("AI suggestions generated successfully");

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in suggest-dot-improvements:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
