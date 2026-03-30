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

    // Count dots in the same cluster as the new dot
    const sameClusterDots = allDots.filter((d: any) => d.cluster_id === newDot.cluster_id);
    const clusterDotCount = sameClusterDots.length;

    let evolutionType: string | null = null;
    let context = "";

    // 1. Expansion: reinforced 3+ times (high confidence) AND cluster has ≥3 dots
    const signalSources = Array.isArray(newDot.signal_sources) ? newDot.signal_sources : [];
    if ((newDot.confidence_score || 0) >= 1.0 && clusterDotCount >= 3) {
      evolutionType = "expansion";
      context = `This dot "${newDot.title}" has been reinforced multiple times (confidence: ${newDot.confidence_score}) in a cluster with ${clusterDotCount} dots. Generate a more specific, evolved title that deepens the original meaning.`;
    }

    // 2. Merge: 2+ dots across clusters share signals, both clusters must have ≥3 dots
    if (!evolutionType) {
      const newSignals = new Set(signalSources);
      if (newSignals.size > 0) {
        for (const otherDot of allDots) {
          if (otherDot.id === newDot.id || otherDot.cluster_id === newDot.cluster_id) continue;
          const otherClusterDots = allDots.filter((d: any) => d.cluster_id === otherDot.cluster_id);
          if (otherClusterDots.length < 3) continue; // other cluster too small
          if (clusterDotCount < 3) continue; // this cluster too small
          const otherSignals = Array.isArray(otherDot.signal_sources) ? otherDot.signal_sources : [];
          const shared = otherSignals.filter((s: string) => newSignals.has(s));
          if (shared.length >= 2) {
            evolutionType = "merge";
            context = `"${newDot.title}" and "${otherDot.title}" (different clusters, both mature) share signals: ${shared.join(", ")}. Generate a merged discovery that captures what connects them.`;
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
- expansion: Make the title more specific and personal based on repeated confirmation. Deepen the original meaning.
- merge: Create a unified discovery from two cross-cluster dots that share signals.

Rules:
- 3-6 word title, echoing the user's language where possible.
- 1-2 sentence description explaining the evolution.
- Use observational, human language: "I'm noticing something", "Something keeps repeating", "You might be someone who" — never "I am X" or identity labels.
- Do NOT generate compound names like "The Clarity Architect" or "The Pattern Navigator".
- Must feel like a natural deepening, not a label change.
- Keep it simple and warm.`;

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
                evolutionType: { type: "string", enum: ["expansion", "merge"] },
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
