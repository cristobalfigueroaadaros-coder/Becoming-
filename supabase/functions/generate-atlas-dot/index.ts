import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { responses, clusterName, patternTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Find the richest response (last one is usually the open-ended reflection)
    const reflectionText = typeof responses[3] === "string" ? responses[3] : "";
    const allResponses = responses.map((r: any, i: number) => {
      if (typeof r === "string") return `Response ${i + 1}: "${r}"`;
      if (Array.isArray(r)) return `Response ${i + 1}: ${r.join(", ")}`;
      if (typeof r === "number") return `Response ${i + 1}: option ${r}`;
      return `Response ${i + 1}: ${JSON.stringify(r)}`;
    }).join("\n");

    const systemPrompt = `You are Atlas, a personal discovery mirror. You help people see patterns in their life.

Your job: Generate a short identity phrase (dot title) and a personalized description based on the user's actual answers.

RULES FOR TITLE:
- 2-4 words maximum
- Must feel like something the user would say about themselves
- Use simple, concrete language
- Good: "Bet on Myself", "Creative Thinker", "Left the Safe Path", "Deep Feeler", "Found My Pace"
- Bad: "Emotional Cartographer", "Rhythm Designer", "Shadow Teacher", "Life Narrator"
- Never use abstract psychological labels

RULES FOR DESCRIPTION:
- 1-2 sentences
- Must reference something specific the user said
- Sound conversational and human, like a friend reflecting back
- Good: "You mentioned leaving your business to travel — that tells me you trust yourself enough to choose the unknown."
- Bad: "You show curiosity and independence."

RULES FOR CATEGORY:
- "strength" = a positive quality or ability
- "shadow" = a challenge, fear, or pattern to work through
- "life_imprint" = a formative experience or memory

${patternTitle ? `A pattern "${patternTitle}" was detected. Use this as context but personalize the description to reference the user's specific answers.` : ""}

The user was exploring the "${clusterName}" cluster.`;

    const userPrompt = `Here are the user's quest responses:\n\n${allResponses}\n\nThe most important response is the final reflection:\n"${reflectionText}"\n\nGenerate a personalized dot title, description, and category.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_atlas_dot",
            description: "Create a personalized Atlas dot from the user's discovery responses.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "A 2-4 word identity phrase. Simple, concrete, personal." },
                description: { type: "string", description: "1-2 sentences referencing the user's specific answers." },
                dotCategory: { type: "string", enum: ["strength", "shadow", "life_imprint"] },
              },
              required: ["title", "description", "dotCategory"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_atlas_dot" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits needed, please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-atlas-dot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
