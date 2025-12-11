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
    const { conversation, mentorType, userContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an AI that detects BREAKTHROUGH MOMENTS in mentor conversations.

A breakthrough is when a user crystallizes:
- A specific, named product/service idea (e.g., "Roots & Wings Re-Entry Kit")
- A clear business concept with target audience
- A concrete creative project with defined scope
- An actionable life change decision
- A synthesized insight combining their background + new perspective

NOT a breakthrough:
- Vague ideas ("maybe I could help people")
- General discussions without concrete outcomes
- Questions without answers
- Emotional processing without action

USER CONTEXT:
Mission: ${userContext?.mission || "Not specified"}
Background: ${JSON.stringify(userContext?.foundation || {})}

ANALYZE THIS CONVERSATION:
${conversation}

INSTRUCTIONS:
1. Look for specific, concrete, NAMED ideas that emerged
2. The breakthrough should be actionable - something they could actually build/do
3. It should connect their unique background/skills to a new opportunity
4. Must be specific enough to become a goal

RESPOND IN JSON FORMAT ONLY:
{
  "detected": true/false,
  "breakthrough": {
    "title": "Short, catchy name for the idea (max 50 chars)",
    "description": "1-2 sentence description of what this is",
    "next_step": "One concrete action they could take today"
  },
  "reasoning": "Why this qualifies as a breakthrough"
}

If no breakthrough detected, respond:
{
  "detected": false,
  "reasoning": "Why no breakthrough was detected"
}`;

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
          { role: "user", content: "Analyze the conversation for breakthroughs." }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices[0].message.content;

    // Clean up the response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      const result = JSON.parse(content);
      console.log("Breakthrough detection result:", result);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ detected: false, reasoning: "Failed to parse response" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Breakthrough detection error:", error);
    return new Response(
      JSON.stringify({ error: error.message, detected: false }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
