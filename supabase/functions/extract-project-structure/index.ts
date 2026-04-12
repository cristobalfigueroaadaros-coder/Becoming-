import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectName, conversationText, entryState } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ blocks: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine block type based on phase
    let blockTypeGuidance = "";
    if (entryState === "BUILD") {
      blockTypeGuidance = "Use business/execution-oriented blocks: e.g. Product, Marketing, Sales, Operations, Growth.";
    } else if (entryState === "GROW") {
      blockTypeGuidance = "Use product/iteration-oriented blocks: e.g. Core Concept, User Testing, Feature Development, Launch Strategy.";
    } else {
      blockTypeGuidance = "Use narrative/journey-oriented blocks: e.g. chapters, phases, journey steps, exploration areas.";
    }

    const prompt = `Analyze this conversation and extract a project structure for "${projectName}".

CONVERSATION:
${conversationText.slice(0, 4000)}

RULES:
1. Extract the main BLOCKS (chapters, phases, areas) the user mentioned or that naturally emerge
2. For the FIRST block only, extract specific ACTIVITIES (sub-items, actions) mentioned by the user
3. Use the user's OWN WORDS whenever possible — do not invent new terminology
4. If the user mentioned specific parts/phases/chapters, use those EXACTLY
5. Minimum 3 blocks, maximum 7
6. Each block title: 2-5 words, clear and specific
7. Activities: 2-6 words each, specific and actionable
8. ${blockTypeGuidance}

RESPOND WITH JSON ONLY:
{
  "blocks": [
    { "title": "First Block Title", "activities": ["activity 1", "activity 2", "activity 3"] },
    { "title": "Second Block", "activities": [] },
    { "title": "Third Block", "activities": [] }
  ]
}

Only the FIRST block should have activities. Others must have empty arrays.
Return ONLY valid JSON, no explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("AI response not OK:", response.status);
      return new Response(
        JSON.stringify({ blocks: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || "";
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      const parsed = JSON.parse(text);
      return new Response(
        JSON.stringify({ blocks: parsed.blocks || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("Failed to parse structure JSON:", e, "Raw:", text);
      return new Response(
        JSON.stringify({ blocks: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Error in extract-project-structure:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
