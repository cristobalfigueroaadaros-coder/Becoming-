import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callChatCompletion, hasAiProvider } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACKS: Record<string, string> = {
  DISCOVER:
    "You're in exploration mode.\nThere's creative energy here, but no clear direction yet.\nThat's not a weakness — it's raw potential.\nNow we're going to focus on finding something compelling enough to build toward.",
  GROW:
    "You've already been building.\nYou're not starting from zero — you're refining.\nNow we'll focus on strengthening your positioning.",
  BUILD:
    "You're already executing.\nThis is not about searching — it's about scaling.\nNow we'll focus on structured momentum.",
};

type SupabaseClient = ReturnType<typeof createClient>;

async function fetchProfile(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("entry_state, work_context, user_foundation_summary, action_patterns, birth_name")
    .eq("id", userId)
    .single();
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;
    console.log("User ID:", userId);

    // Fetch profile, retry once after 2s if foundation summary is missing
    let profile = await fetchProfile(supabase, userId);
    console.log("Profile found:", !!profile, "| foundation_summary:", !!profile?.user_foundation_summary, "| work_context:", !!profile?.work_context, "| name:", profile?.birth_name);

    if (profile && !profile.user_foundation_summary) {
      console.log("Foundation summary missing, retrying in 2s...");
      await new Promise(r => setTimeout(r, 2000));
      profile = await fetchProfile(supabase, userId);
      console.log("Retry result — foundation_summary:", !!profile?.user_foundation_summary);
    }

    const stage = profile?.entry_state || "DISCOVER";
    const name = profile?.birth_name || "there";

    // Parse foundation summary
    let foundation: Record<string, unknown> = {};
    try {
      foundation = typeof profile?.user_foundation_summary === "string"
        ? JSON.parse(profile.user_foundation_summary)
        : profile?.user_foundation_summary || {};
    } catch { /* ignore */ }

    if (!hasAiProvider()) {
      console.log("No AI provider configured, returning fallback");
      return new Response(
        JSON.stringify({ summary: FALLBACKS[stage] || FALLBACKS.DISCOVER, stage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are writing a personalized reflection for ${name} who just completed onboarding.

Their stage: ${stage}
Work context: ${profile?.work_context || "not provided"}
Foundation summary: ${JSON.stringify(foundation)}
Action patterns: ${profile?.action_patterns || "not provided"}

Rules:
- Write exactly 4-6 short lines, one per line
- Each line under 15 words
- Write in second person ("You're...")
- Reference at least one specific thing from their foundation summary or work context
- End with a forward-looking line about what happens next
- Never use exclamation marks or hype language
- Tone: intelligent, personal, grounded
- Do not add labels, numbers, or bullet points
- Just output the lines, nothing else`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const aiResp = await callChatCompletion(
        {
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
          stream: false,
        },
        { signal: controller.signal },
      );

      clearTimeout(timeout);

      if (!aiResp.ok) {
        console.error("AI gateway error:", aiResp.status);
        return new Response(
          JSON.stringify({ summary: FALLBACKS[stage] || FALLBACKS.DISCOVER, stage }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiData = await aiResp.json();
      const summary = aiData.choices?.[0]?.message?.content?.trim();
      console.log("AI summary generated, length:", summary?.length);

      return new Response(
        JSON.stringify({ summary: summary || FALLBACKS[stage] || FALLBACKS.DISCOVER, stage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (e) {
      clearTimeout(timeout);
      console.error("AI call failed/timed out:", e);
      return new Response(
        JSON.stringify({ summary: FALLBACKS[stage] || FALLBACKS.DISCOVER, stage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("Function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
