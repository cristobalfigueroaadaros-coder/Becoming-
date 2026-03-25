import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cluster slug → signal category mapping
const CLUSTER_SIGNAL_MAP: Record<string, string> = {
  "passions": "identity",
  "skills": "behavioral",
  "natural-talents": "identity",
  "values": "motivational",
  "childhood-signals": "identity",
  "life-events": "identity",
  "aha-moments": "identity",
  "experiments": "behavioral",
  "personal-frustrations": "behavioral",
  "vision-for-a-better-world": "motivational",
  "ideal-life": "motivational",
  "inspirations": "inspiration",
  "external-reflections": "identity",
  "golden-moments": "direction",
  "who-i-serve": "direction",
  "how-i-create-impact": "direction",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode = "extract" } = await req.json();

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Fetch user's Atlas dots — prioritize validated/original dots
    const { data: dots, error: dotsError } = await supabaseClient
      .from("atlas_dots")
      .select("*, atlas_clusters(slug, name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (dotsError) throw dotsError;

    if (!dots || dots.length === 0) {
      return new Response(
        JSON.stringify({ identitySignals: [], motivationalSignals: [], behavioralPatterns: [], directionSignals: [], inspirationSignals: [], signalDepth: "early" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter to user-confirmed dots
    const confirmedDots = dots.filter((d: any) =>
      d.user_validated === true || d.original_title != null
    );
    const dotsToUse = confirmedDots.length >= 2 ? confirmedDots : dots;

    // Group by signal category
    const grouped: Record<string, any[]> = { identity: [], motivational: [], behavioral: [], direction: [], inspiration: [] };
    for (const dot of dotsToUse) {
      const clusterSlug = (dot as any).atlas_clusters?.slug || "";
      const category = CLUSTER_SIGNAL_MAP[clusterSlug] || "identity";
      if (grouped[category]) {
        grouped[category].push(dot);
      }
    }

    // Prioritize gold moments and evolved dots
    const sortByPriority = (a: any, b: any) => {
      if (a.is_gold_moment && !b.is_gold_moment) return -1;
      if (!a.is_gold_moment && b.is_gold_moment) return 1;
      if ((a.evolution_stage || 1) > (b.evolution_stage || 1)) return -1;
      return 0;
    };
    for (const key of Object.keys(grouped)) {
      grouped[key].sort(sortByPriority);
    }

    // Build compressed dot summaries for AI
    const dotSummaries = dotsToUse.map((d: any) => {
      const name = d.original_title || d.title;
      const cluster = (d as any).atlas_clusters?.name || "Unknown";
      const category = d.dot_category || "strength";
      return `"${name}" (${cluster}, ${category}${d.is_gold_moment ? ", Gold Moment" : ""})`;
    }).join("\n");

    const signalDepth = dotsToUse.length >= 8 ? "rich" : dotsToUse.length >= 4 ? "growing" : "early";

    // Use AI to synthesize dot titles into signal labels
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const synthesisPrompt = `You are analyzing a person's Atlas dots — discoveries about their identity, motivations, and patterns.

Given these dots:
${dotSummaries}

Signal depth: ${signalDepth}

Extract compressed signal labels organized into categories. Each signal should be 2-5 words, derived from the dot names.

Rules:
- Identity Signals (max 5): core traits, talents, behavioral tendencies
- Motivational Signals (max 3): values, passions, what drives them
- Behavioral Patterns (max 2): how they operate, recurring behaviors
- Direction Signals (max 2): who they serve, how they create impact (only if relevant dots exist)
- Inspiration Signals (max 2): sources of inspiration (only if relevant dots exist)
- Use the person's own language from dot names
- Do NOT invent signals that aren't supported by the dots
- Each signal should be distinct — no synonyms`;

    const synthesisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: synthesisPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "extract_signals",
            description: "Extract structured identity signals from Atlas dots",
            parameters: {
              type: "object",
              properties: {
                identitySignals: { type: "array", items: { type: "string" }, description: "Core identity signals (max 5)" },
                motivationalSignals: { type: "array", items: { type: "string" }, description: "Motivational signals (max 3)" },
                behavioralPatterns: { type: "array", items: { type: "string" }, description: "Behavioral patterns (max 2)" },
                directionSignals: { type: "array", items: { type: "string" }, description: "Direction signals (max 2)" },
                inspirationSignals: { type: "array", items: { type: "string" }, description: "Inspiration signals (max 2)" },
              },
              required: ["identitySignals", "motivationalSignals", "behavioralPatterns"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_signals" } },
      }),
    });

    let signals = {
      identitySignals: [] as string[],
      motivationalSignals: [] as string[],
      behavioralPatterns: [] as string[],
      directionSignals: [] as string[],
      inspirationSignals: [] as string[],
    };

    if (synthesisResponse.ok) {
      const aiData = await synthesisResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        signals = { ...signals, ...parsed };
      }
    }

    // Mode: generateReflectionMessages — create WhatsApp-style Future Self messages
    if (mode === "generateReflectionMessages") {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      const name = (profile as any)?.display_name || "friend";

      const reflectionPrompt = `You are the Future Self — a wise, warm version of this person speaking from 10 years ahead.

The person's name is ${name}.

Based on their Atlas signals:
- Identity: ${signals.identitySignals.join(", ") || "still forming"}
- Motivations: ${signals.motivationalSignals.join(", ") || "still forming"}
- Patterns: ${signals.behavioralPatterns.join(", ") || "still forming"}
- Direction: ${signals.directionSignals.join(", ") || "not yet clear"}

Signal depth: ${signalDepth}

Generate 4-6 short reflection messages (WhatsApp-style, max 2 sentences each) that:
1. Start with casual recognition ("I've been watching what you share...")
2. Build toward specific observations using their signal labels
3. End with a synthesis that connects 2+ signals
4. Final message: "Does that feel right to you?"

Language rules:
- NEVER say: "Based on your Atlas data", "Your capabilities show", "The system detected"
- Say instead: "I've been watching what you share", "You seem to be someone who", "It feels like"
- ${signalDepth === "early" ? "Be tentative — use 'I'm starting to see', 'It seems like'" : signalDepth === "rich" ? "Be confident — use 'I can see clearly', 'You consistently'" : "Be growing — use 'I'm noticing', 'There's a pattern forming'"}
- Max 2 sentences per message
- Warm, human, specific`;

      const reflectionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: reflectionPrompt }],
          tools: [{
            type: "function",
            function: {
              name: "generate_reflection",
              description: "Generate reflection messages for the Future Self",
              parameters: {
                type: "object",
                properties: {
                  messages: {
                    type: "array",
                    items: { type: "string" },
                    description: "4-6 short reflection messages",
                  },
                },
                required: ["messages"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "generate_reflection" } },
        }),
      });

      let reflectionMessages: string[] = [];
      if (reflectionResponse.ok) {
        const refData = await reflectionResponse.json();
        const toolCall = refData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const parsed = JSON.parse(toolCall.function.arguments);
          reflectionMessages = parsed.messages || [];
        }
      }

      return new Response(
        JSON.stringify({
          ...signals,
          signalDepth,
          reflectionMessages,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ...signals, signalDepth }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("extract-atlas-signals error:", error);
    if (error.message?.includes("Rate limit") || error.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (error.status === 402) {
      return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
