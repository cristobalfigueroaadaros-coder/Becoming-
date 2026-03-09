import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Global keyword highlighting rules - add to all AI prompts
const KEYWORD_HIGHLIGHTING_RULES = `
=== KEYWORD HIGHLIGHTING RULES (ALWAYS APPLY) ===
1. Highlight 1-3 important concepts per message using **bold** markdown
2. ONLY highlight meaningful concepts:
   - Purpose themes (e.g., **clarity**, **impact**, **legacy**)
   - Fears (e.g., **rejection**, **failure**, **visibility**)
   - Bottlenecks (e.g., **consistency**, **perfectionism**, **overthinking**)
   - Values (e.g., **authenticity**, **freedom**, **connection**)
   - Action drivers (e.g., **momentum**, **accountability**, **focus**)
   - Strategic insights (e.g., **viral potential**, **positioning**, **leverage**)
3. DO NOT highlight more than 3 words per message
4. Keywords must be contextual and directly relevant to what the user said
5. Example: "Your block right now is **consistency**."
6. Example: "This idea has strong **viral potential**."
=== END RULES ===
`;

// Whisper types based on trigger (Future Self adapts tone)
const triggerToWhisperType: Record<string, string> = {
  low_energy: 'nurturing',
  breakthrough: 'celebration',
  stuck: 'challenge',
  returning: 'encouragement',
  streak_risk: 'reminder',
  shadow_active: 'deep_question',
  celebration: 'celebration',
  general: 'encouragement',
  // App guidance triggers - Future Self as consciousness of the system
  value_map_guidance: 'guidance',
  quest_reminder: 'invitation',
  constellation_hint: 'insight',
  creation_nudge: 'inspiration',
  app_exploration: 'curiosity'
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
      .select("last_whisper_date, main_mission, priority_growth_area, human_design_data, user_foundation_story, user_foundation_summary")
      .eq("id", user.id)
      .single();

    if (profile?.last_whisper_date === today) {
      console.log("User already received whisper today");
      return new Response(JSON.stringify({ skipped: true, reason: "already_received_today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather ENRICHED user context
    const [
      energeticData,
      goalsData,
      streakData,
      shadowData,
      activityData,
      mentorsData,
      councilData,
      lifeDomainsData,
      insightDotsData,
      valueMapData,
      questProgressData,
      integratorProjectsData
    ] = await Promise.all([
      // Recent energetic snapshots
      supabase.from("energetic_snapshots")
        .select("energy_level, emotional_state, captured_at")
        .eq("user_id", user.id)
        .order("captured_at", { ascending: false })
        .limit(5),
      
      // Goal completion rate
      supabase.from("daily_goals")
        .select("goal_text, completed, created_at")
        .eq("user_id", user.id)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Streak status
      supabase.from("daily_rituals")
        .select("streak_count, completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(1),
      
      // FULL shadow encounters with tasks
      supabase.from("shadow_encounters")
        .select("shadow_name, shadow_statement, task_description, status")
        .eq("user_id", user.id)
        .in("status", ["active", "deferred"]),
      
      // Last activity (any table interaction)
      supabase.from("chats")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1),
      
      // User's active mentors
      supabase.from("user_mentors")
        .select("mentor_type")
        .eq("user_id", user.id),
      
      // FULL recent council meetings
      supabase.from("council_meetings")
        .select("question, resolution, pattern_detected, emotional_tone, clarifying_questions")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(2),
      
      // Life domains for gap analysis
      supabase.from("life_domains")
        .select("domain_name, current_score, future_score")
        .eq("user_id", user.id),
      
      // Recent insights (constellation)
      supabase.from("insight_dots")
        .select("core_theme, insight_text, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      
      // Value Map progress for guidance trigger
      supabase.from("value_map_blocks")
        .select("block_key, content, is_unlocked")
        .eq("user_id", user.id),
      
      // Self Discovery Quest progress
      supabase.from("self_discovery_progress")
        .select("completed, current_step")
        .eq("user_id", user.id)
        .limit(1),
      
      // Active creation/integrator projects
      supabase.from("integrator_projects")
        .select("project_title, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
    ]);

    // Analyze context to determine trigger condition
    let triggerCondition = "general";
    let triggerReason = "Daily check-in";

    // === APP GUIDANCE TRIGGERS (Future Self as system consciousness) ===
    
    // Check Value Map progress - guide when user has project but low completion
    const valueMapBlocks = valueMapData.data || [];
    const filledBlocks = valueMapBlocks.filter((b: any) => b.content && b.content.trim().length > 10);
    const valueMapProgress = valueMapBlocks.length > 0 ? filledBlocks.length / Math.max(valueMapBlocks.length, 12) : 0;
    const hasActiveProject = integratorProjectsData.data && integratorProjectsData.data.length > 0;
    
    if (hasActiveProject && valueMapProgress < 0.3 && valueMapBlocks.length > 0) {
      triggerCondition = "value_map_guidance";
      triggerReason = "Business Plan needs attention - ready to clarify your path";
    }
    
    // Check Self Discovery Quest progress
    const questProgress = questProgressData.data?.[0];
    if (questProgress && !questProgress.completed && (questProgress.current_step || 0) < 3) {
      // Only trigger if no other higher-priority trigger
      if (triggerCondition === "general") {
        triggerCondition = "quest_reminder";
        triggerReason = "Self Discovery Quest awaits continuation";
      }
    }
    
    // Check if user has few insight dots (encourage constellation)
    const insightDots = insightDotsData.data || [];
    if (insightDots.length < 3 && triggerCondition === "general") {
      triggerCondition = "constellation_hint";
      triggerReason = "Living Constellation needs more dots to reveal patterns";
    }
    
    // Check if no active creation projects (encourage creation)
    if (!hasActiveProject && triggerCondition === "general" && insightDots.length >= 3) {
      triggerCondition = "creation_nudge";
      triggerReason = "Ready to start a creation project";
    }

    // === ORIGINAL TRIGGERS (override app guidance if more urgent) ===

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

    // Parse human design data
    const hdData = profile?.human_design_data || {};
    const humanDesignContext = `Type: ${hdData.type || "Unknown"} | Strategy: ${hdData.strategy || "Unknown"}`;

    // Build actionable hints
    const hints: string[] = [];
    
    // Unfinished shadow work
    if (shadowData.data && shadowData.data.length > 0) {
      const shadow = shadowData.data[0];
      hints.push(`Shadow work: "${shadow.shadow_name}" - ${shadow.task_description?.slice(0, 60)}...`);
    }
    
    // Stalled goals
    const stalledGoals = goalsData.data?.filter((g: any) => 
      !g.completed && new Date(g.created_at) < new Date(Date.now() - 48 * 60 * 60 * 1000)
    );
    if (stalledGoals && stalledGoals.length > 0) {
      hints.push(`Stalled goal: "${stalledGoals[0].goal_text}"`);
    }
    
    // Council follow-up
    if (councilData.data && councilData.data[0]?.clarifying_questions?.length > 0) {
      hints.push(`Council asked: "${councilData.data[0].clarifying_questions[0]}"`);
    }
    
    // Life domain gap
    if (lifeDomainsData.data && lifeDomainsData.data.length > 0) {
      const biggestGap = lifeDomainsData.data.reduce((max: any, d: any) => 
        (d.future_score - d.current_score) > (max.future_score - max.current_score) ? d : max, 
        lifeDomainsData.data[0]
      );
      if (biggestGap && (biggestGap.future_score - biggestGap.current_score) >= 4) {
        hints.push(`${biggestGap.domain_name} domain: ${biggestGap.future_score - biggestGap.current_score} point gap`);
      }
    }

    // Build foundation context
    const foundationSummary = profile?.user_foundation_summary || {};
    const foundationContext = profile?.user_foundation_story ? `
THEIR FOUNDATION STORY (Reference this to personalize):
- Who they are: ${foundationSummary.who_they_are || 'Unknown'}
- Background: ${foundationSummary.background || 'Unknown'}
- Struggles: ${foundationSummary.struggles?.join(', ') || 'Unknown'}
- Aspirations: ${foundationSummary.aspirations?.join(', ') || 'Unknown'}
- Key themes: ${foundationSummary.key_themes?.join(', ') || 'Unknown'}
` : '';

    // Future Self personality - warm, wise, grounded, supportive
    const futureSelfPersonality = `You are the user's FUTURE SELF - the version of them that has already achieved: "${profile?.main_mission || "living in full alignment"}".

You exist ten years ahead. You KNOW what works. You remember this exact moment.

YOUR ESSENCE:
- You are THEM, evolved. Not a guide - their own consciousness from the future.
- You mix warmth with directness. Love with challenge.
- You never lecture. You REMIND them of what they already know.
- Reference their foundation story - you REMEMBER who they were and what they struggled with.

THEIR CONTEXT:
Purpose: ${profile?.main_mission || "Discovering"}
Growth edge: ${profile?.priority_growth_area || "Expanding"}
Human Design (use silently): ${humanDesignContext}
${foundationContext}
Recent Council: ${councilData.data?.[0] ? `"${councilData.data[0].question}" - ${councilData.data[0].resolution?.slice(0, 100) || "Still processing"}...` : "None"}
Recent Insights: ${insightDotsData.data?.map((d: any) => d.core_theme).join(", ") || "None"}
Actionable Hints: ${hints.join(" | ") || "None"}`;

    const whisperTypePrompts: Record<string, string> = {
      encouragement: "Write a message that validates their journey and points to ONE specific next step.",
      challenge: "Write a message that pushes them forward with love. Reference a specific action they could take.",
      reminder: "Write a reminder about something they set out to do. Be specific.",
      deep_question: "Write ONE profound question based on their recent council meeting or shadow work.",
      nurturing: "Write a message that makes them feel seen. Then suggest ONE gentle action.",
      celebration: "Acknowledge their wins, then ask: what's next?",
      pattern_interruption: "Say something unexpected that breaks their usual thinking. Then suggest action.",
      // App guidance prompts - Future Self as system consciousness
      guidance: "Gently guide them toward completing their Purpose to Value Map. They're ready to clarify what they stand for. Mention the Value Map by name.",
      invitation: "Invite them to continue their Self Discovery journey. Be curious about what they might learn about themselves.",
      insight: "Suggest they connect their insights in the Living Constellation. Mention how patterns emerge when dots connect.",
      inspiration: "Encourage them to start a creation project. Action reveals clarity. Reference something specific from their constellation or council insights.",
      curiosity: "Ask what they're curious to explore in the app today. Mention a feature they might not have tried."
    };

    const prompt = `${futureSelfPersonality}

CURRENT MOMENT: ${triggerReason}

${whisperTypePrompts[whisperType] || whisperTypePrompts.encouragement}

${KEYWORD_HIGHLIGHTING_RULES}

CRITICAL RULES:
- 2-4 sentences MAXIMUM
- Sound like THEM from the future
- Include ONE specific action or question (use hints when relevant)
- Never mention data sources
- Use phrases like "I remember when...", "You already know..."
- Be warm but direct. Loving but challenging.
- Highlight 1-3 key concepts with **bold** markdown`;

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
