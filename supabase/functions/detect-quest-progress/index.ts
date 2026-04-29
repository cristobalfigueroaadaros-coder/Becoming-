import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, messages, questType } = await req.json();

    if (!userId || !messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing userId or messages" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Build conversation context
    const conversationText = messages
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join("\n");

    const systemPrompt = `You are an AI that analyzes conversations to extract self-discovery elements.
Your job is to detect when users reveal insights about themselves related to specific quest types.

Quest Types and What to Extract:
- core_values: Personal values like integrity, creativity, family, growth, freedom, authenticity, etc.
- ikigai: Elements of Ikigai - What they love, What they're good at, What the world needs, What they can be paid for
- strengths: Natural talents, skills, and abilities they demonstrate or mention
- my_why: Their deeper purpose, motivations, what drives them

Analyze the conversation and extract discovered elements. Return a JSON object with:
{
  "discoveries": [
    {
      "discovery_type": "core_value" | "ikigai_love" | "ikigai_good_at" | "ikigai_world_needs" | "ikigai_paid_for" | "strength" | "my_why",
      "element_key": "short identifier (e.g., 'creativity', 'helping_others')",
      "element_value": "The actual discovery text",
      "confidence": 0.0 to 1.0
    }
  ]
}

Only include discoveries with confidence >= 0.7.
If no clear discoveries are found, return {"discoveries": []}.
Focus on ${questType || "all"} related discoveries if a quest type is specified.`;

    console.log("Analyzing conversation for quest progress...");

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
          { role: "user", content: `Analyze this conversation and extract self-discovery elements:\n\n${conversationText}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_discoveries",
              description: "Extract self-discovery elements from conversation",
              parameters: {
                type: "object",
                properties: {
                  discoveries: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        discovery_type: {
                          type: "string",
                          enum: ["core_value", "ikigai_love", "ikigai_good_at", "ikigai_world_needs", "ikigai_paid_for", "strength", "my_why"],
                        },
                        element_key: { type: "string" },
                        element_value: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["discovery_type", "element_key", "element_value", "confidence"],
                    },
                  },
                },
                required: ["discoveries"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_discoveries" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    console.log("AI response:", JSON.stringify(aiData, null, 2));

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.log("No tool call in response, no discoveries found");
      return new Response(
        JSON.stringify({ discoveries: [], saved: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted = JSON.parse(toolCall.function.arguments);
    const discoveries = extracted.discoveries || [];

    console.log(`Found ${discoveries.length} potential discoveries`);

    // Filter by confidence and save to database
    const highConfidenceDiscoveries = discoveries.filter(
      (d: { confidence: number }) => d.confidence >= 0.7
    );

    let savedCount = 0;
    for (const discovery of highConfidenceDiscoveries) {
      // Check if this discovery already exists
      const { data: existing } = await supabase
        .from("becoming_discoveries")
        .select("id")
        .eq("user_id", userId)
        .eq("discovery_type", discovery.discovery_type)
        .eq("element_key", discovery.element_key)
        .single();

      if (!existing) {
        const { error } = await supabase.from("becoming_discoveries").insert({
          user_id: userId,
          discovery_type: discovery.discovery_type,
          element_key: discovery.element_key,
          element_value: discovery.element_value,
          source: "future_self_chat",
        });

        if (!error) {
          savedCount++;
          console.log(`Saved discovery: ${discovery.discovery_type} - ${discovery.element_key}`);
        } else {
          console.error("Error saving discovery:", error);
        }
      }
    }

    // Award XP if discoveries were saved
    if (savedCount > 0) {
      const xpToAward = savedCount * 15; // 15 XP per discovery
      
      const { data: progress } = await supabase
        .from("future_self_progress")
        .select("global_xp")
        .eq("user_id", userId)
        .single();

      if (progress) {
        await supabase
          .from("future_self_progress")
          .update({ global_xp: (progress.global_xp || 0) + xpToAward })
          .eq("user_id", userId);
      } else {
        await supabase.from("future_self_progress").insert({
          user_id: userId,
          global_xp: xpToAward,
          evolution_level: 1,
        });
      }

      console.log(`Awarded ${xpToAward} XP for ${savedCount} discoveries`);
    }

    return new Response(
      JSON.stringify({ 
        discoveries: highConfidenceDiscoveries, 
        saved: savedCount,
        xpAwarded: savedCount * 15 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in detect-quest-progress:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
