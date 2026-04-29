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
      blockTypeGuidance = `Use 30-day execution blocks. The user is already building something real and needs to execute on a specific 30-day goal. Blocks should reflect the concrete work areas needed to hit their stated 30-day win — adapted to THEIR specific project and situation. Do not use generic templates. Make every block title specific to what they are actually building and what they said they want to achieve.`;
      defaultBlocks = `If the conversation doesn't clearly mention specific areas, use these as a starting framework (adapt EVERY title to the user's actual project — replace generic names with project-specific ones):
- Direct Sales (how to convert interested people into paying customers in the next 30 days)
- Content & Social (the content strategy to attract the right audience and build trust)
- Outreach & Partnerships (reaching influencers, institutions, or communities that already have the right audience)
- Customer Experience (making sure early customers are delighted and become advocates)
- Growth Levers (the 2-3 highest-impact moves specific to their product/market in the next 30 days)

IMPORTANT: Every block title must feel like it was written for this exact person and project. If they're selling a game to families, blocks should reference that. Replace "Direct Sales" with "Family Squad Sales" if more specific. Replace "Outreach & Partnerships" with "Parent Influencer Outreach" if that's what the conversation shows.`;
    } else if (entryState === "GROW") {
      blockTypeGuidance = `Use MVP and validation-cycle blocks. The user has an idea or early version and needs to test it, learn from real users, and iterate toward something people actually want. Blocks should guide the full cycle: build → test → learn → improve → monetize.`;
      defaultBlocks = `If the conversation doesn't clearly mention specific areas, use these as a starting framework (adapt every title to the user's actual project and context):
- MVP Design (the simplest version worth testing — what is the core of this, stripped to its minimum)
- Ideal User (who specifically is this for, what is their exact pain, what are they trying to become)
- Validation Experiments (what specific, small tests will prove or disprove this works in the real world)
- Real Feedback (what early users actually experienced and said — the honest truth)
- Iteration (what to keep, what to cut, what to change based on what you learned)
- Path to First Revenue (what would make someone pay for this right now — and what that tells you)

IMPORTANT: Adapt every title to the specific project. Make the blocks feel like they were written for this person's actual thing, not a startup checklist.`;
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

BLOCK 6: "System Design" — This is a SYSTEM, not a task list. Define: where the user starts (A), where they end up (B), what moves them through the journey, what each part of the system does, and how the pieces connect. Think of it as the architecture of the transformation — not a to-do list, a living structure.

BLOCK 7: "Evolved Project Output" — The refined, clearer, stronger version of the project after going through blocks 1-6.

Only Block 1 should have pre-filled activities. Others should have empty arrays (they'll be filled through mentor conversations).`;
      defaultBlocks = "";
    }

    const prompt = `Analyze this conversation and extract a project structure for "${projectName}".

CONVERSATION:
${conversationText.slice(0, 4000)}

RULES:
${entryState === "DISCOVER" || !entryState ? projectTypeInstruction : `
1. Extract the main BLOCKS that reflect the key areas of this specific project
2. For EVERY block, generate 2-3 suggested activities based on the conversation — use the user's own words and context wherever possible
3. Activities should feel like the obvious first moves for that block, not generic tasks
4. If the user mentioned specific things, use those EXACTLY — otherwise infer what makes sense for their project
5. Minimum 5 blocks, maximum 7
6. Each block title: 2-6 words, clear and specific to THIS project (not generic)
7. Activities: 3-7 words each, specific and immediately actionable
8. ${blockTypeGuidance}
${defaultBlocks ? `9. ${defaultBlocks}` : ""}
10. CRITICAL: Every block title AND every activity must feel like it was written for this specific project. Never use generic placeholder text.

Every block should have 2-3 activities. No empty arrays.`}

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
