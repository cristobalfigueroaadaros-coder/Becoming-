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
    const { taskId, mentorName, isShadowTask } = await req.json();
    const authHeader = req.headers.get("Authorization")!;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Determine XP reward
    const xpReward = isShadowTask ? 15 : 5;
    const mentorXpReward = 10;

    // Update future_self_progress
    const { data: progress } = await supabaseClient
      .from("future_self_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (progress) {
      const newXp = progress.global_xp + xpReward;
      let newLevel = progress.evolution_level;

      // Calculate evolution level based on XP thresholds
      if (newXp >= 1500) newLevel = 5;
      else if (newXp >= 700) newLevel = 4;
      else if (newXp >= 300) newLevel = 3;
      else if (newXp >= 100) newLevel = 2;
      else newLevel = 1;

      await supabaseClient
        .from("future_self_progress")
        .update({ global_xp: newXp, evolution_level: newLevel })
        .eq("user_id", user.id);
    }

    // Update mentor_progress
    const { data: mentorProg } = await supabaseClient
      .from("mentor_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("mentor_name", mentorName)
      .maybeSingle();

    if (mentorProg) {
      const newMentorXp = mentorProg.xp + mentorXpReward;
      let newMentorLevel = mentorProg.level;

      if (newMentorXp >= 150) newMentorLevel = 3;
      else if (newMentorXp >= 50) newMentorLevel = 2;
      else newMentorLevel = 1;

      await supabaseClient
        .from("mentor_progress")
        .update({ xp: newMentorXp, level: newMentorLevel })
        .eq("user_id", user.id)
        .eq("mentor_name", mentorName);
    } else {
      // Create mentor progress entry
      await supabaseClient
        .from("mentor_progress")
        .insert({
          user_id: user.id,
          mentor_name: mentorName,
          xp: mentorXpReward,
          level: 1,
        });
    }

    // Log to transformation timeline
    await supabaseClient
      .from("transformation_timeline")
      .insert({
        user_id: user.id,
        event_type: isShadowTask ? "shadow_integration" : "task_completed",
        event_data: {
          task_id: taskId,
          mentor_name: mentorName,
          xp_earned: xpReward,
        },
      });

    return new Response(
      JSON.stringify({ success: true, xp_earned: xpReward, mentor_xp_earned: mentorXpReward }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in complete-task:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});