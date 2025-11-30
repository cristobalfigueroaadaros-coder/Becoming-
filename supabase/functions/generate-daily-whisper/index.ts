import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Whisper types based on trigger (Future Self adapts tone)
const triggerToWhisperType: Record<string, string> = {
  low_energy: 'nurturing',
  breakthrough: 'celebration',
  stuck: 'challenge',
  returning: 'encouragement',
  streak_risk: 'reminder',
  shadow_active: 'deep_question',
  celebration: 'celebration',
  general: 'encouragement'
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const today = new Date().toISOString().split('T')[0];

    // Check if user already received a whisper today
    const { data: profile } = await supabase
      .from("profiles")
      .select("last_whisper_date, main_mission, priority_growth_area")
      .eq("id", user.id)
      .single();

    if (profile?.last_whisper_date === today) {
      console.log("User already received whisper today");
      return new Response(JSON.stringify({ skipped: true, reason: "already_received_today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather user context
    const [
      energeticData,
      goalsData,
      streakData,
      shadowData,
      activityData,
      mentorsData
    ] = await Promise.all([
      // Recent energetic snapshots
      supabase.from("energetic_snapshots")
        .select("energy_level, emotional_state, captured_at")
        .eq("user_id", user.id)
        .order("captured_at", { ascending: false })
        .limit(5),
      
      // Goal completion rate
      supabase.from("daily_goals")
        .select("completed, created_at")
        .eq("user_id", user.id)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Streak status
      supabase.from("daily_rituals")
        .select("streak_count, completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(1),
      
      // Active shadow encounters
      supabase.from("shadow_encounters")
        .select("shadow_name, status")
        .eq("user_id", user.id)
        .eq("status", "active"),
      
      // Last activity (any table interaction)
      supabase.from("chats")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1),
      
      // User's active mentors
      supabase.from("user_mentors")
        .select("mentor_type")
        .eq("user_id", user.id)
    ]);

    // Analyze context to determine trigger condition
    let triggerCondition = "general";
    let triggerReason = "Daily check-in";

    // Check for low energy
    const energyValues = energeticData.data || [];
    const avgEnergy = energyValues.length > 0 
      ? energyValues.reduce((sum, s) => sum + (s.energy_level || 5), 0) / energyValues.length 
      : 5;
    if (avgEnergy < 4) {
      triggerCondition = "low_energy";
      triggerReason = "Recent energy levels below threshold";
    }

    // Check if stuck (no goal completions in 3+ days)
    const completedGoals = goalsData.data?.filter(g => g.completed) || [];
    const recentCompletions = completedGoals.filter(g => {
      const created = new Date(g.created_at);
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      return created > threeDaysAgo;
    });
    if (recentCompletions.length === 0 && (goalsData.data?.length || 0) > 0) {
      triggerCondition = "stuck";
      triggerReason = "No goal completions in recent days";
    }

    // Check for active shadow
    if (shadowData.data && shadowData.data.length > 0) {
      triggerCondition = "shadow_active";
      triggerReason = `Active shadow encounter: ${shadowData.data[0].shadow_name}`;
    }

    // Check streak risk
    const lastRitual = streakData.data?.[0];
    if (lastRitual) {
      const lastRitualDate = new Date(lastRitual.completed_at);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      if (lastRitualDate < yesterday && lastRitual.streak_count > 3) {
        triggerCondition = "streak_risk";
        triggerReason = `${lastRitual.streak_count}-day streak at risk`;
      }
    }

    // Check for returning user
    const lastActivity = activityData.data?.[0];
    if (lastActivity) {
      const daysSinceActivity = Math.floor(
        (Date.now() - new Date(lastActivity.created_at).getTime()) / (24 * 60 * 60 * 1000)
      );
      if (daysSinceActivity > 3) {
        triggerCondition = "returning";
        triggerReason = `Returning after ${daysSinceActivity} days`;
      }
    }

    // Private whispers are ALWAYS from Future Self
    const selectedMentor = "future_self";
    const whisperType = triggerToWhisperType[triggerCondition] || "encouragement";

    // Generate the whisper using AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Future Self personality - warm, wise, grounded, supportive
    const futureSelfPersonality = `You are the user's Future Self - their evolved version ten years ahead.
You speak with warmth, wisdom, and unconditional belief in them.
You are grounded, human, and emotionally intelligent.
You never sound robotic, abstract, or mystical.
You are their companion who knows their journey intimately.`;

    const whisperTypePrompts: Record<string, string> = {
      encouragement: "Write an encouraging, supportive message that validates their journey.",
      challenge: "Write a challenging message that pushes them to step up, but with love.",
      reminder: "Write a gentle reminder about something important they might be forgetting.",
      deep_question: "Write a profound question that invites deep self-reflection.",
      nurturing: "Write a nurturing, emotionally supportive message that makes them feel seen.",
      celebration: "Write a celebratory message acknowledging their progress and wins.",
      pattern_interruption: "Write something unexpected that breaks their usual thinking patterns."
    };

    const prompt = `${futureSelfPersonality}

Context: ${triggerReason}
User's purpose: ${profile?.main_mission || "Still discovering their mission"}
Growth focus: ${profile?.priority_growth_area || "Overall growth"}

${whisperTypePrompts[whisperType] || whisperTypePrompts.encouragement}

CRITICAL RULES:
- Write ONLY 2-4 sentences maximum
- Be warm, wise, grounded, and supportive
- Use "you" and speak directly to them
- Sound human, not robotic or abstract
- NO greeting, NO sign-off, NO mystical language
- Just the message itself`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are the user's Future Self - warm, wise, grounded, human. Keep messages 2-4 sentences. Never mystical or robotic." },
          { role: "user", content: prompt }
        ],
        max_tokens: 120
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", errorText);
      throw new Error("Failed to generate whisper");
    }

    const aiData = await aiResponse.json();
    const whisperMessage = aiData.choices?.[0]?.message?.content?.trim() || 
      "Remember, you are becoming who you're meant to be.";

    // Save the whisper
    const { data: whisper, error: whisperError } = await supabase
      .from("daily_whispers")
      .insert({
        user_id: user.id,
        mentor_type: selectedMentor,
        message: whisperMessage,
        whisper_type: whisperType,
        trigger_reason: triggerReason
      })
      .select()
      .single();

    if (whisperError) throw whisperError;

    // Update last_whisper_date
    await supabase
      .from("profiles")
      .update({ last_whisper_date: today })
      .eq("id", user.id);

    console.log(`Generated ${whisperType} whisper from Future Self for trigger: ${triggerCondition}`);

    return new Response(JSON.stringify({
      success: true,
      whisper: {
        id: whisper.id,
        mentor_type: selectedMentor,
        message: whisperMessage,
        whisper_type: whisperType,
        trigger_reason: triggerReason
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error generating whisper:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
