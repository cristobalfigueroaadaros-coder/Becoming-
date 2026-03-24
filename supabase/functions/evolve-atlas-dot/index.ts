import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { newDot, allDots } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!newDot || !allDots || allDots.length < 2) {
      return new Response(JSON.stringify({ evolution: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check evolution conditions
    let evolutionType: string | null = null;
    let context = "";

    // 1. Upgrade: 4+ signals confirmed on this dot
    const signalSources = Array.isArray(newDot.signal_sources) ? newDot.signal_sources : [];
    if (signalSources.length >= 4) {
      evolutionType = "upgrade";
      context = `This dot "${newDot.title}" has ${signalSources.length} confirmed signals (${signalSources.join(", ")}). It's ready for an identity-level upgrade.`;
    }

    // 2. Expansion: reinforced 2+ times (high confidence)
    if (!evolutionType && (newDot.confidence_score || 0) >= 1.0) {
      evolutionType = "expansion";
      context = `This dot "${newDot.title}" has been reinforced multiple times (confidence: ${newDot.confidence_score}). Generate a more specific, evolved title.`;
    }

    // 3. Reframe: same cluster has a dot with different category
    if (!evolutionType) {
      const sameClusterDots = allDots.filter((d: any) =>
        d.cluster_id === newDot.cluster_id && d.id !== newDot.id
      );
      const differentCategory = sameClusterDots.find((d: any) =>
        d.dot_category !== newDot.dot_category
      );
      if (differentCategory) {
        evolutionType = "reframe";
        context = `In the same cluster, there's "${differentCategory.title}" (${differentCategory.dot_category}) and now "${newDot.title}" (${newDot.dot_category}). These show contrasting aspects. Generate an evolved title that captures the tension.`;
      }
    }

    // 4. Merge: 2+ dots across clusters share signals
    if (!evolutionType) {
      const newSignals = new Set(signalSources);
      if (newSignals.size > 0) {
        for (const otherDot of allDots) {
          if (otherDot.id === newDot.id || otherDot.cluster_id === newDot.cluster_id) continue;
          const otherSignals = Array.isArray(otherDot.signal_sources) ? otherDot.signal_sources : [];
          const shared = otherSignals.filter((s: string) => newSignals.has(s));
          if (shared.length >= 2) {
            evolutionType = "merge";
            context = `"${newDot.title}" and "${otherDot.title}" (different clusters) share signals: ${shared.join(", ")}. Generate a merged identity dot that captures what connects them.`;
            break;
          }
        }
      }
    }

    if (!evolutionType) {
      return new Response(JSON.stringify({ evolution: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are Atlas, a personal discovery engine. A user's dot is evolving. Generate an evolved title and description.

Evolution type: ${evolutionType}
- reframe: Capture the tension between contrasting discoveries in the same area.
- expansion: Make the title more specific and personal based on repeated confirmation.
- upgrade: Elevate to an identity-level statement ("I am someone who...").
- merge: Create a unified discovery from two cross-cluster dots.

Rules:
- 3-6 word title, echoing the user's language where possible.
- 1-2 sentence description explaining the evolution.
- Direct tone: "You do this.", "This is how you operate.", "You consistently..." — never "you seem to" or "this suggests".
- Must feel like a natural deepening, not a label change.`;

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
          { role: "user", content: context },
        ],
        tools: [{
          type: "function",
          function: {
            name: "evolve_dot",
            description: "Generate evolved dot title and description.",
            parameters: {
              type: "object",
              properties: {
                newTitle: { type: "string" },
                newDescription: { type: "string" },
                evolutionType: { type: "string", enum: ["reframe", "expansion", "upgrade", "merge"] },
              },
              required: ["newTitle", "newDescription", "evolutionType"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "evolve_dot" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ evolution: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ evolution: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      evolution: {
        dotId: newDot.id,
        previousTitle: newDot.title,
        previousDescription: newDot.short_description,
        ...result,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evolve-atlas-dot error:", e);
    return new Response(JSON.stringify({ evolution: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
