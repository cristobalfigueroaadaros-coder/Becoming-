const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch user dots
    const { data: dots } = await supabase
      .from("atlas_dots")
      .select("id, title, short_description, cluster_id, dot_category, signal_sources")
      .eq("user_id", userId);

    if (!dots || dots.length < 5) {
      return new Response(JSON.stringify({ opportunity: null, reason: "not_enough_dots" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch mini-dots
    const { data: miniDots } = await supabase
      .from("atlas_mini_dots")
      .select("parent_dot_id, content")
      .eq("user_id", userId);

    if (!miniDots || miniDots.length < 2) {
      return new Response(JSON.stringify({ opportunity: null, reason: "not_enough_depth" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch clusters for mapping
    const clusterIds = [...new Set(dots.map((d: any) => d.cluster_id).filter(Boolean))];
    const { data: clusters } = await supabase
      .from("atlas_clusters")
      .select("id, slug, name")
      .in("id", clusterIds);

    const clusterMap: Record<string, any> = {};
    (clusters || []).forEach((c: any) => {
      clusterMap[c.id] = c;
    });

    // Build context for AI
    const dotSummaries = dots.map((d: any) => {
      const cluster = clusterMap[d.cluster_id];
      const clusterName = cluster?.name || "Unknown";
      const relatedMiniDots = (miniDots || [])
        .filter((md: any) => md.parent_dot_id === d.id)
        .map((md: any) => md.content);
      return `[${clusterName}] ${d.title}${d.short_description ? `: ${d.short_description}` : ""}${relatedMiniDots.length > 0 ? ` (deeper: ${relatedMiniDots.join("; ")})` : ""}`;
    });

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an opportunity detection engine for a personal discovery system.

The user has been exploring their identity through dots (discoveries) and mini-dots (deeper insights).

Your job: find ONE meaningful cross-cluster opportunity the user hasn't seen yet.

Rules:
- Ground everything in their actual data
- Never be generic
- Use direct, warm tone
- Output EXACTLY this JSON structure, nothing else

Format:
{
  "setup": "2-3 short sentences connecting their patterns (use their actual dot titles)",
  "question": "Have you ever thought about...",
  "ideas": [
    { "type": "obvious", "text": "..." },
    { "type": "interesting", "text": "..." },
    { "type": "out_of_the_box", "text": "..." }
  ],
  "mentor_stage": "discover|grow|build",
  "mentor_type": "creative_visionary|strategist|business_mentor"
}

mentor_stage rules:
- "discover" if patterns are exploratory → route to creative_visionary
- "grow" if patterns show direction → route to strategist
- "build" if patterns show readiness for action → route to strategist (or business_mentor if monetization-ready)`;

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Here are the user's discoveries:\n\n${dotSummaries.join("\n")}\n\nFind one meaningful opportunity.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const raw = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ opportunity: null, reason: "parse_error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const opportunity = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ opportunity }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
