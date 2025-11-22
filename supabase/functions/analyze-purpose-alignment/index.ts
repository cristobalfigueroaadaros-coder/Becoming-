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

    const { dots, userPurpose, userId } = await req.json();

    if (!userId || !userPurpose || !dots || dots.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Prepare dots summary for AI analysis
    const dotsSummary = dots.map((dot: any, idx: number) => 
      `${idx + 1}. [ID: ${dot.id}] Theme: ${dot.core_theme} | ${dot.insight_text.slice(0, 100)}...`
    ).join('\n');

    const analysisPrompt = `You are analyzing a user's constellation of life insights against their stated life purpose.

USER'S PURPOSE:
"${userPurpose}"

INSIGHTS TO ANALYZE (${dots.length} total):
${dotsSummary}

For each insight, determine its alignment strength with the user's purpose on a scale of 0-100:
- 0-30: Low alignment (tangential or unrelated)
- 31-60: Medium alignment (somewhat related)
- 61-100: High alignment (directly supports the purpose)

Return as JSON array with format: [{"id": "dot-id", "alignmentScore": 85, "reason": "brief explanation"}]

Be specific about HOW each insight connects to the purpose. Only return the JSON array, nothing else.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: analysisPrompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response");
    }
    
    const alignmentResults = JSON.parse(jsonMatch[0]);

    // Group dots by alignment level
    const highAlignment = alignmentResults.filter((r: any) => r.alignmentScore >= 61);
    const mediumAlignment = alignmentResults.filter((r: any) => r.alignmentScore >= 31 && r.alignmentScore < 61);
    const lowAlignment = alignmentResults.filter((r: any) => r.alignmentScore < 31);

    console.log(`Purpose alignment analysis: ${highAlignment.length} high, ${mediumAlignment.length} medium, ${lowAlignment.length} low`);

    return new Response(
      JSON.stringify({ 
        success: true,
        alignments: alignmentResults,
        summary: {
          high: highAlignment.length,
          medium: mediumAlignment.length,
          low: lowAlignment.length,
          total: alignmentResults.length
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-purpose-alignment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
