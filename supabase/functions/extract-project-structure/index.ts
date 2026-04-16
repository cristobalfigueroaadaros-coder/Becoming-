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
        JSON.stringify({ blocks: [], projectType: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine block type based on phase
    let blockTypeGuidance = "";
    let defaultBlocks = "";
    let projectTypeInstruction = "";

    if (entryState === "BUILD") {
      blockTypeGuidance = "Use execution/business-oriented blocks. The user is already selling or offering something and wants results in 90 days.";
      defaultBlocks = `If the conversation doesn't clearly mention specific blocks, use these as a starting framework (adapt titles to the user's context):
- 90-Day Goal (what they want to achieve)
- Strategy (how they'll get there)
- Offer & Value (what they're selling and why)
- Pricing (how much and why)
- Audience & Access (who and where)
- Action Plan (key next steps)
- Tracking & Adjustment (how to measure)`;
    } else if (entryState === "GROW") {
      blockTypeGuidance = "Use creation/validation-oriented blocks. The user has an idea or partial build and needs to test it with real people.";
      defaultBlocks = `If the conversation doesn't clearly mention specific blocks, use these as a starting framework (adapt titles to the user's context):
- MVP (simplest version to test)
- Ideal Clients (who needs this most)
- Testing Plan (how to validate)
- Feedback Capture (what people said)
- Iteration (what to improve)
- First Money (how to monetize)`;
    } else {
      // DISCOVER — 7-block Project Birth system
      blockTypeGuidance = `Use the DISCOVERY 7-BLOCK system. These blocks guide the user from concept to structured project.`;
      projectTypeInstruction = `
FIRST, classify the project type based on the conversation:
- "experience" — retreats, workshops, events, journeys, ceremonies
- "product" — physical goods, kits, boxes, tools, artifacts
- "digital" — apps, platforms, courses, digital tools, content systems
- "hybrid" — combines 2+ types (e.g., physical kit + digital app)

Then generate exactly 7 blocks adapted to this type:

BLOCK 1: "Project Vision" — What the project IS in simple terms. Activities: short description, clear purpose statement.

BLOCK 2: "Transformation" (SAME FOR ALL TYPES) — The human transformation (A → B).
Activities should cover:
- Before: how they feel, what they struggle with, what is missing
- During: what shifts internally
- After: how they feel, what changed, what they can now do

BLOCK 3: "Interaction Design" (ADAPTIVE BY TYPE)
- Experience: entry moment, key experience, peak moment
- Product: first use, core interaction, daily presence
- Digital: first touchpoint, main flow, key feature
- Hybrid: combine relevant aspects

BLOCK 4: "Expansion Layer" (ADAPTIVE BY TYPE)
- Experience: emotional residue, memory, symbolic element
- Product: daily presence, repeated use, ritual around it
- Digital: retention, return behavior, community aspect
- Hybrid: combine relevant aspects

BLOCK 5: "Ideal Customer" — Who is this for, what are they struggling with, why would they care, why would they pay?

BLOCK 6: "System Design" — The A→B journey: starting point, desired outcome, steps between, features that enable the journey.

BLOCK 7: "Evolved Project Output" — The refined, clearer, stronger version of the project after going through blocks 1-6.

Only Block 1 should have pre-filled activities. Others should have empty arrays (they'll be filled through mentor conversations).`;
      defaultBlocks = "";
    }

    const prompt = `Analyze this conversation and extract a project structure for "${projectName}".

CONVERSATION:
${conversationText.slice(0, 4000)}

RULES:
${entryState === "DISCOVER" || !entryState ? projectTypeInstruction : `
1. Extract the main BLOCKS (chapters, phases, areas) the user mentioned or that naturally emerge
2. For the FIRST block only, extract specific ACTIVITIES (sub-items, actions) mentioned by the user
3. Use the user's OWN WORDS whenever possible — do not invent new terminology
4. If the user mentioned specific parts/phases/chapters, use those EXACTLY
5. Minimum 3 blocks, maximum 7
6. Each block title: 2-5 words, clear and specific
7. Activities: 2-6 words each, specific and actionable
8. ${blockTypeGuidance}
${defaultBlocks ? `9. ${defaultBlocks}` : ""}

Only the FIRST block should have activities. Others must have empty arrays.`}

RESPOND WITH JSON ONLY:
{
  ${entryState === "DISCOVER" || !entryState ? '"projectType": "experience" | "product" | "digital" | "hybrid",' : ''}
  "blocks": [
    { "title": "First Block Title", "activities": ["activity 1", "activity 2", "activity 3"] },
    { "title": "Second Block", "activities": [] }
  ]
}

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
        JSON.stringify({ blocks: [], projectType: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || "";
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      const parsed = JSON.parse(text);
      return new Response(
        JSON.stringify({ 
          blocks: parsed.blocks || [],
          projectType: parsed.projectType || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("Failed to parse structure JSON:", e, "Raw:", text);
      return new Response(
        JSON.stringify({ blocks: [], projectType: null }),
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
