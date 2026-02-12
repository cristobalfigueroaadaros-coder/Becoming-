import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user },
    } = await anonClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { patternId, patternName, transmutationData, primaryEmotion } =
      await req.json();

    if (!patternId || !transmutationData) {
      return new Response(
        JSON.stringify({ error: "Missing patternId or transmutationData" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = Deno.env.get("chatgpt");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are analyzing a completed personal transmutation journey. Extract 1-4 "Superpowers" — positive skill labels that the person gained through this experience.

Pattern: "${patternName || "Unknown"}"
Primary Emotion: "${primaryEmotion || "Unknown"}"
Shadow/Pain: "${transmutationData.shadow || ""}"
The Shift: "${transmutationData.shift_moment || ""}"
Lesson Learned: "${transmutationData.lesson_learned || ""}"
Protective Purpose: "${transmutationData.protective_purpose || ""}"
Gold Insight: "${transmutationData.gold_insight || ""}"
Brave Step: "${transmutationData.brave_step || ""}"

Rules:
- Extract 1 to 4 superpowers maximum
- Each must be POSITIVE (a strength, not a weakness)
- Each must be DERIVED from this specific event (not generic)
- No duplicates
- Short labels (1-3 words each)
- Include an emoji icon for each
- Include a one-sentence description tied to the event

Examples of good superpowers: "Resilient", "Emotional Regulator", "Courageous Decision Maker", "Adaptive Leader", "Strategic Builder", "Positive Thinker"

Respond with a JSON array:
[{"name": "Superpower Name", "description": "One sentence about how this was gained", "icon": "🔥", "color": "amber"}]

Use these colors: amber, emerald, violet, blue, rose, indigo. Match the color to the superpower's theme.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    // Parse JSON from response
    let superpowers: Array<{
      name: string;
      description: string;
      icon: string;
      color: string;
    }> = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        superpowers = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error("Failed to parse superpowers:", content);
      superpowers = [
        {
          name: "Inner Warrior",
          description: "Gained strength through adversity",
          icon: "⚔️",
          color: "amber",
        },
      ];
    }

    // Limit to 4
    superpowers = superpowers.slice(0, 4);

    // Store in database
    const insertData = superpowers.map((sp) => ({
      user_id: user.id,
      pattern_id: patternId,
      name: sp.name,
      description: sp.description,
      icon: sp.icon || "⚡",
      color: sp.color || "amber",
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("superpowers")
      .insert(insertData)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save superpowers" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ superpowers: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
