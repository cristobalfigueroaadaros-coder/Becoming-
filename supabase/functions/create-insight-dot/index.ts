import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, sourceType, sourceId, insightText, coreTheme, skillTags, emotionalTone, sourceMentor } = await req.json();

    if (!userId || !sourceType || !insightText || !coreTheme) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the insight dot
    const { data: dot, error: dotError } = await supabaseClient
      .from("insight_dots")
      .insert({
        user_id: userId,
        source_type: sourceType,
        source_id: sourceId,
        source_mentor: sourceMentor,
        insight_text: insightText,
        core_theme: coreTheme,
        skill_tags: skillTags || [],
        emotional_tone: emotionalTone,
      })
      .select()
      .single();

    if (dotError) throw dotError;

    return new Response(
      JSON.stringify({ success: true, dot }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating insight dot:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
