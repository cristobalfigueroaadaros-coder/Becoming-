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

    const { purposeHistory, currentPurpose } = await req.json();

    if (!purposeHistory || purposeHistory.length === 0) {
      return new Response(JSON.stringify({ error: "No purpose history provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format the purpose history for AI analysis
    const historyText = purposeHistory
      .map((entry: any, index: number) => {
        const date = new Date(entry.created_at).toLocaleDateString();
        return `${index + 1}. [${date}] ${entry.purpose_text}`;
      })
      .join("\n\n");

    const systemPrompt = `You are an expert life purpose analyst who identifies patterns, growth, and transformation in people's evolving sense of purpose. Analyze how someone's purpose has changed over time and provide meaningful insights.

IMPORTANT: Return ONLY valid JSON with this exact structure:
{
  "overallGrowth": "string - 2-3 sentences about their overall journey and growth",
  "keyThemes": ["string - 3-5 recurring themes across all versions"],
  "transformationStage": "string - one of: 'Early Discovery', 'Clarifying Focus', 'Deepening Commitment', 'Evolving Mastery', 'Radical Transformation'",
  "continuityScore": number - 0-100 representing how consistent core themes are,
  "nextSteps": ["string - 3-4 concrete actions based on their evolution pattern"]
}`;

    const userPrompt = `Analyze this person's purpose evolution:

Purpose History (chronological):
${historyText}

${currentPurpose ? `Current Purpose:\n${currentPurpose}\n\n` : ""}

Provide insights about:
1. How their purpose has evolved and what growth patterns you see
2. What core themes persist across different versions
3. What stage of transformation they're in
4. How consistent their direction has been (continuity score)
5. What concrete next steps would help them continue evolving`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Analyzing purpose evolution with AI...");

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
    const insights = JSON.parse(aiData.choices[0].message.content);

    console.log("Purpose evolution analysis complete");

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-purpose-evolution:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
