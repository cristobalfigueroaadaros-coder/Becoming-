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

    // Get task details for energetic dot creation
    const { data: task } = await supabaseClient
      .from("tasks")
      .select("task_title, task_description")
      .eq("id", taskId)
      .single();

    // Create energetic snapshot for task completion
    const energeticSnapshot = {
      user_id: user.id,
      snapshot_type: "task_completion",
      related_task_id: taskId,
      energy_level: isShadowTask ? 8 : 7, // Higher energy for shadow work
      clarity_level: 7,
      expansion_level: isShadowTask ? 9 : 6,
      alignment_feeling: 8,
      coherence_level: 7,
      emotional_state: isShadowTask ? "empowered" : "accomplished",
      overall_frequency: "high",
      activity_context: `Completed task: ${task?.task_title || 'Task'}`,
      somatic_data: {
        completion_type: isShadowTask ? "shadow_integration" : "task_completion",
        mentor: mentorName,
      }
    };

    await supabaseClient
      .from("energetic_snapshots")
      .insert(energeticSnapshot);

    // Create energetic insight dot for task completion
    const flowDetected = isShadowTask; // Shadow tasks indicate deeper flow
    const resonanceLevel = isShadowTask ? 9 : 7;
    
    await supabaseClient
      .from("insight_dots")
      .insert({
        user_id: user.id,
        source_type: isShadowTask ? "shadow_task_completion" : "task_completion",
        source_id: taskId,
        source_mentor: mentorName,
        insight_text: `Completed: ${task?.task_title || 'Task'}. ${task?.task_description || ''}`,
        core_theme: isShadowTask ? "Shadow Integration" : "Action & Progress",
        emotional_tone: isShadowTask ? "transformative" : "accomplished",
        energetic_frequency: isShadowTask ? "expansion" : "momentum",
        flow_state_detected: flowDetected,
        resonance_level: resonanceLevel,
        intuition_signal: isShadowTask,
        somatic_notes: isShadowTask ? "Felt courage and expansion through facing shadow" : "Felt momentum and alignment through action",
        coherence_indicators: {
          completion_energy: isShadowTask ? "high" : "medium-high",
          alignment_with_purpose: true,
          embodiment_level: isShadowTask ? "deep" : "moderate"
        },
        vibrational_context: {
          moment_type: "completion",
          shadow_integration: isShadowTask,
          xp_earned: xpReward,
          mentor_guidance: mentorName
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        xp_earned: xpReward, 
        mentor_xp_earned: mentorXpReward,
        energetic_dot_created: true,
        flow_detected: flowDetected
      }),
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