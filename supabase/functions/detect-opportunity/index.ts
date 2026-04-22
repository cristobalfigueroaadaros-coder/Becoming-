import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, validateAuth, checkRateLimit, rateLimitResponse, authErrorResponse } from "../_shared/security.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth — user_id comes from JWT, never from request body
  const auth = await validateAuth(req);
  if (auth.error) return authErrorResponse(corsHeaders);

  const { userId } = auth;

  // Rate limit
  const rl = await checkRateLimit(userId, "detect-opportunity");
  if (!rl.allowed) return rateLimitResponse(corsHeaders, rl.retryAfterMs);

  try {
    // Optional project context for Creation Lab mode
    let projectContext: { name: string; description?: string; phase?: string } | null = null;
    try {
      const body = await req.json();
      if (body?.projectContext?.name) {
        projectContext = {
          name: String(body.projectContext.name).slice(0, 120),
          description: body.projectContext.description ? String(body.projectContext.description).slice(0, 300) : undefined,
          phase: body.projectContext.phase ? String(body.projectContext.phase).slice(0, 30) : undefined,
        };
      }
    } catch (_) { /* no body is fine */ }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch user dots
    const { data: dots } = await supabase
      .from("atlas_dots")
      .select("id, title, short_description, cluster_id, dot_category, signal_sources")
      .eq("user_id", userId);

    // Atlas mode: require 10 dots. Creation Lab mode (project context present): require 5.
    const minDots = projectContext ? 5 : 10;
    if (!dots || dots.length < minDots) {
      return new Response(JSON.stringify({ opportunity: null, reason: "not_enough_dots" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch mini-dots
    const { data: miniDots } = await supabase
      .from("atlas_mini_dots")
      .select("parent_dot_id, content")
      .eq("user_id", userId);

    // In Atlas mode, require at least 1 mini-dot. In Creation Lab mode, skip this gate.
    if (!projectContext && (!miniDots || miniDots.length < 1)) {
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

    // Build context for AI — cap to avoid huge prompts
    const safeDots = dots.slice(0, 50);
    const dotSummaries = safeDots.map((d: any) => {
      const cluster = clusterMap[d.cluster_id];
      const clusterName = cluster?.name || "Unknown";
      const relatedMiniDots = (miniDots || [])
        .filter((md: any) => md.parent_dot_id === d.id)
        .map((md: any) => String(md.content ?? "").slice(0, 80));
      return `[${clusterName}] ${d.title}${d.short_description ? `: ${String(d.short_description).slice(0, 100)}` : ""}${relatedMiniDots.length > 0 ? ` (deeper: ${relatedMiniDots.join("; ")})` : ""}`;
    });

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // System prompt changes based on whether a project context was supplied
    const systemPrompt = projectContext
      ? `You are a creative iteration engine for a purpose and creation platform.

The user has been exploring their identity through atlas dots (personal discoveries).
They have created a project and want unexpected new angles and combinations.

Your job: find ONE powerful way their identity patterns can expand, pivot, or enrich their current project.
Generate iterations they haven't considered. Connect dots across clusters to suggest surprising directions for the project.

Rules:
- Ground everything in their actual data — use their real dot titles
- Connect their identity patterns specifically to their project
- The three ideas should feel like real possible next directions for this specific project
- Never be generic or repeat what is obvious from the project description
- Warm, direct, specific tone
- Output EXACTLY this JSON structure, nothing else

Format:
{
  "setup": "2-3 short sentences connecting their patterns to the project (use their actual dot titles and project name)",
  "question": "What if you combined [their talent/insight] with [project name] to...",
  "ideas": [
    { "type": "obvious", "text": "A natural next step that uses their patterns in the project" },
    { "type": "interesting", "text": "An unexpected angle combining their identity with the project" },
    { "type": "out_of_the_box", "text": "A bold iteration or pivot that could transform the project" }
  ],
  "mentor_stage": "discover|grow|build",
  "mentor_type": "creative_visionary|strategist|business_mentor"
}

mentor_stage: match the project phase if given, otherwise use "build"
mentor_type: "business_mentor" if monetization angle, "strategist" if direction, "creative_visionary" if exploration`
      : `You are an opportunity detection engine for a personal discovery system.

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

    const userMessage = projectContext
      ? `Project name: ${projectContext.name}${projectContext.description ? `\nProject description: ${projectContext.description}` : ""}${projectContext.phase ? `\nCurrent phase: ${projectContext.phase}` : ""}\n\nUser's identity discoveries:\n\n${dotSummaries.join("\n")}\n\nFind one powerful new angle or iteration for this project.`
      : `Here are the user's discoveries:\n\n${dotSummaries.join("\n")}\n\nFind one meaningful opportunity.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.75,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const raw = aiData.choices?.[0]?.message?.content || "";

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
    console.error("Error in detect-opportunity:", error instanceof Error ? error.message : "unknown");
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
