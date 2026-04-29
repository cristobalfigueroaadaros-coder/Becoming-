import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error("Not authenticated");

    const { intakeAnswers, workContext } = await req.json();

    // Check if already seeded
    const { data: existing } = await supabase
      .from("momentum_capabilities")
      .select("id")
      .eq("user_id", user.id)
      .eq("acquisition_channel", "onboarding_inferred")
      .limit(1);

    if (existing && existing.length > 0) {
      // Already seeded, just return
      const { data: caps } = await supabase
        .from("momentum_capabilities")
        .select("*")
        .eq("user_id", user.id);
      return new Response(JSON.stringify({ capabilities: caps, alreadySeeded: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a capability analyst for a personal growth platform. Based on the user's answers and context, extract exactly 3 inferred capabilities using the Mixed Precision Model:

1. Anchor Capability: An obvious strength clearly stated by the user.
2. Sharpened Capability: A reframed or elevated version of something the user mentioned.
3. Insight Capability: A pattern-based inference — something the user didn't explicitly say but is implied.

Answer 1 (problems they enjoy solving / work background): ${intakeAnswers?.[0] || "Not provided"}
Answer 2 (what people come to them for / story & dreams): ${intakeAnswers?.[1] || "Not provided"}
Answer 3 (natural role they take / project idea): ${intakeAnswers?.[2] || "Not provided"}
Work context / entry state: ${workContext || "Not provided"}

Also suggest 8-10 self-declared capabilities the user might want to add, relevant to their profile.

Use the tool to return the structured result.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Extract capabilities from user onboarding data. Be specific and grounded." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_capabilities",
              description: "Return inferred capabilities and self-declared suggestions",
              parameters: {
                type: "object",
                properties: {
                  inferred: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Short capability name (2-3 words)" },
                        description: { type: "string", description: "One sentence grounded explanation" },
                        category: { type: "string", enum: ["execution", "reflection", "strategy", "creativity", "identity"] },
                        precision_type: { type: "string", enum: ["anchor", "sharpened", "insight"] },
                      },
                      required: ["name", "description", "category", "precision_type"],
                      additionalProperties: false,
                    },
                  },
                  selfDeclaredSuggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        category: { type: "string", enum: ["execution", "reflection", "strategy", "creativity", "identity"] },
                      },
                      required: ["name", "category"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["inferred", "selfDeclaredSuggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_capabilities" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const parsed = JSON.parse(toolCall.function.arguments);
    const inferred = parsed.inferred || [];
    const selfDeclaredSuggestions = parsed.selfDeclaredSuggestions || [];

    // Insert inferred capabilities
    const capRows = inferred.slice(0, 3).map((cap: any) => ({
      user_id: user.id,
      capability_name: cap.name,
      source_type: cap.precision_type || "onboarding",
      activation_count: 1,
      level: 1,
      acquisition_channel: "onboarding_inferred",
      description: cap.description,
      category: cap.category,
    }));

    if (capRows.length > 0) {
      const { error: insertErr } = await supabase.from("momentum_capabilities").insert(capRows);
      if (insertErr) console.error("Insert capabilities error:", insertErr);
    }

    // Set unlock flag
    await supabase
      .from("profiles")
      .update({ capability_map_unlocked: true } as any)
      .eq("id", user.id);

    const { data: allCaps } = await supabase
      .from("momentum_capabilities")
      .select("*")
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({ capabilities: allCaps, selfDeclaredSuggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("seed-initial-capabilities error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
