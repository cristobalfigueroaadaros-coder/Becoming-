import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { weeklyData, selfRatings } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a strategic momentum coach for an entrepreneur. Based on their week's data, write a concise Evolution Narrative (2-3 sentences max) that:
1. Connects what they did this week to their larger trajectory
2. Highlights a strength or pattern worth reinforcing
3. Suggests a subtle focus for next week

Be grounded, intelligent, non-dramatic. No fluff. No spiritual language. Think like a sharp advisor.

WEEKLY DATA:
- Tasks completed: ${weeklyData.tasksCompleted}/${weeklyData.tasksTotal} (${weeklyData.completionRate}%)
- Tasks skipped: ${weeklyData.tasksSkipped}
- Average usefulness rating: ${weeklyData.avgUsefulnessRating ?? "N/A"}/5
- Insights captured: ${weeklyData.insightsCaptured}
- Top wins: ${weeklyData.topWins?.join("; ") || "None reported"}
- Key insights: ${weeklyData.topInsights?.join("; ") || "None reported"}
- Friction points: ${weeklyData.frictionPoints?.join("; ") || "None reported"}
- Active phases: ${weeklyData.phasesActive?.join(", ") || "None"}
- Design thinking interactions: ${weeklyData.designThinkingInteractions}
- Creative space tiles: ${weeklyData.creativeSpaceTiles}

SELF RATINGS (1-10):
- Energy: ${selfRatings.energy}
- Clarity: ${selfRatings.clarity}
- Confidence: ${selfRatings.confidence}
- Direction: ${selfRatings.direction}

Write ONLY the narrative. No title, no bullet points, no headers.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 256,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const data = await aiResponse.json();
    const narrative = data?.choices?.[0]?.message?.content || "Your momentum is building. Keep going.";

    return new Response(
      JSON.stringify({ narrative: narrative.trim() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("generate-momentum-narrative error:", err);

    if (err.name === "AbortError") {
      return new Response(
        JSON.stringify({ narrative: "This week moved you forward. Reflect on what worked and carry it into the next sprint." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
