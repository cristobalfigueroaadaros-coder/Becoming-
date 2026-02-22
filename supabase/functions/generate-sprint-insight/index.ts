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
    const { weeklyData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a neutral performance observer for an entrepreneur. Based on their week's data, write exactly 1-2 sentences of diagnostic observation.

Be neutral, intelligent, specific. No praise, no shaming. Detect patterns and lightly flag friction areas.

Examples of good output:
- "You were consistent but hesitant mid-week."
- "Execution was strong, but task usefulness dropped."
- "You avoided two strategic tasks."
- "Your clarity increased across the week."

WEEKLY DATA:
- Tasks completed: ${weeklyData.tasksCompleted}/${weeklyData.tasksTotal} (${weeklyData.completionRate}%)
- Tasks skipped: ${weeklyData.tasksSkipped}
- Active days: ${weeklyData.activeDays}/7
- Reflection rate: ${weeklyData.reflectionRate}%
- Average usefulness: ${weeklyData.avgUsefulnessRating ?? "N/A"}/5
- Momentum score: ${weeklyData.momentumScore}/100
- Top wins: ${weeklyData.topWins?.join("; ") || "None"}
- Friction points: ${weeklyData.frictionPoints?.join("; ") || "None"}

Write ONLY the observation. No title, no bullet points.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 128,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const data = await aiResponse.json();
    const insight = data?.choices?.[0]?.message?.content || null;

    return new Response(
      JSON.stringify({ insight: insight?.trim() || null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("generate-sprint-insight error:", err);
    return new Response(
      JSON.stringify({ insight: null, error: err.message }),
      { status: err.name === "AbortError" ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
