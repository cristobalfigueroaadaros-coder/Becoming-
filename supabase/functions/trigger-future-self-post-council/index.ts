import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { meetingId } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Strategic silence: wait 45 seconds before sending Future Self message
    console.log("Waiting 45 seconds before triggering Future Self...");
    await new Promise(resolve => setTimeout(resolve, 45000));

    // Get the council meeting details
    const { data: meeting } = await supabaseClient
      .from("council_meetings")
      .select("*")
      .eq("id", meetingId)
      .single();

    if (!meeting) {
      console.log("Meeting not found");
      return new Response(
        JSON.stringify({ error: "Meeting not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the most recent energetic snapshot
    const { data: recentSnapshot } = await supabaseClient
      .from("energetic_snapshots")
      .select("*")
      .eq("user_id", user.id)
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Build energetic snapshot with council context
    const energeticSnapshot = {
      energy_level: recentSnapshot?.energy_level || 7,
      clarity_level: recentSnapshot?.clarity_level || 7,
      expansion_level: recentSnapshot?.expansion_level || 7,
      coherence_level: recentSnapshot?.coherence_level || 8,
      emotional_state: meeting.emotional_tone || "contemplative",
      activity_context: "post_council_reflection"
    };

    // Call the future-self-guidance function
    const guidanceResponse = await supabaseClient.functions.invoke('future-self-guidance', {
      body: {
        triggerReason: `post_council: "${meeting.question}"`,
        energeticSnapshot
      }
    });

    if (guidanceResponse.error) {
      console.error("Future Self guidance error:", guidanceResponse.error);
      throw guidanceResponse.error;
    }

    console.log("Future Self message triggered successfully after council meeting");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Future Self triggered after council meeting",
        guidance: guidanceResponse.data
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Post-council trigger error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
