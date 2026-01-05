import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Re-engagement message templates based on context
const REENGAGEMENT_TEMPLATES = {
  has_active_project: [
    "Your {projectName} is waiting for your next move. What's one small step you could take today?",
    "I've been thinking about your {projectName} project. Ready to make some progress?",
    "Day {daysSinceActive} without action on {projectName}. What's blocking you? Let's talk.",
  ],
  has_value_map_progress: [
    "Your Purpose Map is {progress}% complete. One more conversation could unlock new clarity.",
    "I noticed your Value Map has some gaps. Want to explore what's missing together?",
    "You've made good progress on your purpose. Let's keep the momentum going.",
  ],
  general: [
    "It's been a few days. Your future self is curious what's on your mind today.",
    "The mentors miss you! What's been happening since we last talked?",
    "Sometimes a fresh conversation unlocks something new. What's brewing?",
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hoursThreshold = 24, singleUserId } = await req.json().catch(() => ({}));
    
    // Use service role to check all users
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Calculate the cutoff time
    const cutoffTime = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000).toISOString();
    
    // Find inactive users - those who haven't chatted, done rituals, or had council meetings recently
    let usersToCheck: string[] = [];
    
    if (singleUserId) {
      // Check specific user (called from dashboard)
      usersToCheck = [singleUserId];
    } else {
      // Find all inactive users (for scheduled job)
      const { data: profiles } = await supabaseClient
        .from("profiles")
        .select("id")
        .not("id", "is", null);

      if (!profiles) {
        return new Response(
          JSON.stringify({ message: "No profiles found", notificationsSent: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      usersToCheck = profiles.map(p => p.id);
    }

    let notificationsSent = 0;

    for (const userId of usersToCheck) {
      // Check last activity
      const { data: lastChat } = await supabaseClient
        .from("chats")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: lastCouncil } = await supabaseClient
        .from("council_meetings")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: lastRitual } = await supabaseClient
        .from("daily_rituals")
        .select("completed_at")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Find the most recent activity
      const activities = [
        lastChat?.created_at,
        lastCouncil?.created_at,
        lastRitual?.completed_at,
      ].filter(Boolean).map(d => new Date(d!).getTime());

      const lastActivity = activities.length > 0 ? Math.max(...activities) : 0;
      const hoursSinceActivity = (Date.now() - lastActivity) / (1000 * 60 * 60);

      // Skip if user was active recently
      if (hoursSinceActivity < hoursThreshold) {
        continue;
      }

      // Check if we already sent a re-engagement notification recently (within 24h)
      const { data: recentNotification } = await supabaseClient
        .from("council_notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("notification_type", "reengagement")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1)
        .maybeSingle();

      if (recentNotification) {
        continue; // Already sent one today
      }

      // Get context for personalized message
      const { data: activeProject } = await supabaseClient
        .from("integrator_projects")
        .select("project_title, current_day")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      const { data: valueMapBlocks } = await supabaseClient
        .from("value_map_blocks")
        .select("is_unlocked")
        .eq("user_id", userId);

      const unlockedCount = valueMapBlocks?.filter(b => b.is_unlocked).length || 0;
      const totalBlocks = 13; // Total blocks in value map
      const progress = Math.round((unlockedCount / totalBlocks) * 100);

      // Choose appropriate message template
      let message: string;
      let title: string;

      if (activeProject) {
        const template = REENGAGEMENT_TEMPLATES.has_active_project[
          Math.floor(Math.random() * REENGAGEMENT_TEMPLATES.has_active_project.length)
        ];
        message = template
          .replace("{projectName}", activeProject.project_title)
          .replace("{daysSinceActive}", Math.floor(hoursSinceActivity / 24).toString());
        title = `Your project "${activeProject.project_title}" is waiting`;
      } else if (unlockedCount > 0 && progress < 100) {
        const template = REENGAGEMENT_TEMPLATES.has_value_map_progress[
          Math.floor(Math.random() * REENGAGEMENT_TEMPLATES.has_value_map_progress.length)
        ];
        message = template.replace("{progress}", progress.toString());
        title = "Continue your Purpose journey";
      } else {
        const template = REENGAGEMENT_TEMPLATES.general[
          Math.floor(Math.random() * REENGAGEMENT_TEMPLATES.general.length)
        ];
        message = template;
        title = "We've been thinking about you";
      }

      // Create the re-engagement notification
      await supabaseClient.from("council_notifications").insert({
        user_id: userId,
        notification_type: "reengagement",
        title: title,
        message: message,
        context_data: {
          hours_inactive: Math.round(hoursSinceActivity),
          has_active_project: !!activeProject,
          value_map_progress: progress,
        },
      });

      // Also send a whisper from Future Self
      await supabaseClient.from("daily_whispers").insert({
        user_id: userId,
        mentor_type: "future_self",
        message: message,
        whisper_type: "reengagement",
        trigger_reason: `User inactive for ${Math.round(hoursSinceActivity)} hours`,
      });

      notificationsSent++;
      console.log(`Re-engagement notification sent to user ${userId} (inactive ${Math.round(hoursSinceActivity)}h)`);
    }

    return new Response(
      JSON.stringify({ 
        message: `Checked ${usersToCheck.length} users, sent ${notificationsSent} notifications`,
        notificationsSent 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in check-user-inactivity:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
