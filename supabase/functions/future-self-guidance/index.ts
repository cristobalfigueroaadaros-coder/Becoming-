import { createClient } from "npm:@supabase/supabase-js@^2";
import { callChatCompletion } from "../_shared/ai-client.ts";

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

// Message archetypes for variety
const MESSAGE_ARCHETYPES = [
  { name: "CELEBRATION", instruction: "Acknowledge their progress warmly. Make them feel SEEN and celebrated. Reference specific wins." },
  { name: "CHALLENGE", instruction: "Lovingly push them to take action NOW. Be direct but caring. Issue a specific challenge." },
  { name: "REFLECTION", instruction: "Ask ONE deep question that stops them in their tracks. Make them think." },
  { name: "MEMORY", instruction: "Share a 'memory' from the future about this exact moment being pivotal. Be specific." },
  { name: "PRACTICAL", instruction: "Give ONE concrete micro-action they can do in < 5 minutes RIGHT NOW." },
  { name: "EMOTIONAL", instruction: "Validate their feelings deeply. Be the warmth and understanding they need. No advice, just presence." },
  { name: "SURPRISE", instruction: "Say something unexpected that shifts their perspective completely. Be bold and unconventional." },
  { name: "QUESTION_GUIDE", instruction: "Suggest 1-2 powerful questions they should ask the mentors. Connect their unique background (traveler, psychologist, etc.) to opportunities. Example: 'Because you're a [background], ask: What problems do [target group] face that you could solve?'" },
  { name: "JOURNEY_ORCHESTRATOR", instruction: "Suggest a specific mentor journey for their current topic. Example: 'Start with Creative Visionary to explore ideas, then Business Mentor for validation, then Marketing for distribution.' Be specific about WHY each mentor in the journey." },
  { name: "QUEST_NUDGE", instruction: "Gently remind them about their Becoming Path. Guide them to Creation Lab → Becoming Path to continue exploring their Self-Discovery Quests. Example: 'There's a quest waiting for you in the Becoming Path. Your values are ready to be discovered.' or 'Head to the Creation Lab and open your Becoming Path — your Ikigai quest is calling.'" },
  { name: "NARRATIVE", instruction: "Connect TWO of their recent actions, insights, or discoveries using the Dot Bridge formula. Find common ground: shared value, shared emotion, identity pattern, transferable skill, or repeating need. Use templates like: 'Because you {action}, you learned {learning}, and now {effect} feels more possible.' or 'Last time you learned {x}. Today you applied it by doing {y}. That's how this path is forming.' Reference SPECIFIC insights from their task completions, discoveries, or journal entries. Help them SEE how their dots connect. Create a 'that's true' moment." },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { triggerReason, energeticSnapshot } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Get comprehensive user context with FULL data
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Get recent Future Self messages to avoid repetition
    const { data: recentFSMessages } = await supabaseClient
      .from("future_self_messages")
      .select("message, trigger_reason, emotional_tone, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get recent insights
    const { data: recentDots } = await supabaseClient
      .from("insight_dots")
      .select("insight_text, core_theme, emotional_tone, skill_tags")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get recent completed task insights (for NARRATIVE archetype dot-bridging)
    const { data: recentTaskInsights } = await supabaseClient
      .from("integrator_daily_steps")
      .select("step_title, insight_text, why_it_matters, completed_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .not("insight_text", "is", null)
      .order("completed_at", { ascending: false })
      .limit(8);

    // Get becoming discoveries (values, strengths, Ikigai)
    const { data: becomingDiscoveries } = await supabaseClient
      .from("becoming_discoveries")
      .select("discovery_type, element_key, element_value")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: timelineMoments } = await supabaseClient
      .from("lifetime_events")
      .select("event_label, event_description, time_period, event_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get life domains
    const { data: lifeDomains } = await supabaseClient
      .from("life_domains")
      .select("domain_name, current_score, future_score")
      .eq("user_id", user.id);

    // Get recent goals including completion status
    const { data: recentGoals } = await supabaseClient
      .from("daily_goals")
      .select("goal_text, completed, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get FULL recent council meetings with all context
    const { data: recentCouncil } = await supabaseClient
      .from("council_meetings")
      .select(`
        question,
        banter,
        resolution,
        conversation_flow,
        clarifying_questions,
        pattern_detected,
        emotional_tone,
        shadow_triggers,
        threshold_moment,
        created_at
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    // Get FULL shadow encounters with tasks and prompts
    const { data: shadows } = await supabaseClient
      .from("shadow_encounters")
      .select(`
        shadow_name,
        shadow_statement,
        task_description,
        reflection_prompts,
        status,
        triggered_by,
        created_at
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    // Get user mentors
    const { data: userMentors } = await supabaseClient
      .from("user_mentors")
      .select("mentor_type")
      .eq("user_id", user.id);

    // Get constellation patterns
    const { data: patterns } = await supabaseClient
      .from("vibrational_patterns")
      .select("pattern_name, pattern_type, resonance_strength")
      .eq("user_id", user.id)
      .order("last_detected_at", { ascending: false })
      .limit(3);

    // === BUILD ACTIONABLE HINTS SYSTEM ===
    const actionableHints: Array<{type: string; hint: string; reflection?: string}> = [];

    // Hint 1: Unfinished shadow work
    if (shadows?.some((s: any) => s.status === "active" || s.status === "deferred")) {
      const activeShadow = shadows.find((s: any) => s.status === "active" || s.status === "deferred");
      if (activeShadow) {
        actionableHints.push({
          type: "shadow_work",
          hint: `Consider facing your "${activeShadow.shadow_name}" shadow. Task: ${activeShadow.task_description?.slice(0, 80)}...`,
          reflection: activeShadow.reflection_prompts?.[0] || undefined
        });
      }
    }

    // Hint 2: Stalled goals (older than 48h)
    const stalledGoals = recentGoals?.filter((g: any) => 
      !g.completed && new Date(g.created_at) < new Date(Date.now() - 48 * 60 * 60 * 1000)
    );
    if (stalledGoals && stalledGoals.length > 0) {
      actionableHints.push({
        type: "stalled_goal",
        hint: `You set "${stalledGoals[0].goal_text}" but haven't completed it yet.`
      });
    }

    // Hint 3: Council follow-up on clarifying questions
    if (recentCouncil && recentCouncil[0]?.clarifying_questions?.length > 0) {
      actionableHints.push({
        type: "council_follow_up",
        hint: `The council asked: "${recentCouncil[0].clarifying_questions[0]}". Have you found your answer?`
      });
    }

    // Hint 4: Life domain gap (biggest gap)
    if (lifeDomains && lifeDomains.length > 0) {
      const biggestGap = lifeDomains.reduce((max: any, d: any) => 
        (d.future_score - d.current_score) > (max.future_score - max.current_score) ? d : max, 
        lifeDomains[0]
      );
      if (biggestGap && (biggestGap.future_score - biggestGap.current_score) >= 4) {
        actionableHints.push({
          type: "domain_gap",
          hint: `Your ${biggestGap.domain_name} domain shows a ${biggestGap.future_score - biggestGap.current_score} point gap. What one step could close it?`
        });
      }
    }

    // Parse human design data properly
    const hdData = profile?.human_design_data || {};
    const humanDesignContext = `Type: ${hdData.type || "Unknown"} | Strategy: ${hdData.strategy || "Unknown"} | Authority: ${hdData.authority || "Unknown"} | Profile: ${hdData.profile || "Unknown"}`;

    // Build foundation story context
    const foundationSummary = profile?.user_foundation_summary || {};
    const foundationContext = profile?.user_foundation_story ? `
THEIR FOUNDATION STORY (You REMEMBER this - reference it naturally):
- Who they are: ${foundationSummary.who_they_are || 'Unknown'}
- Background: ${foundationSummary.background || 'Unknown'}
- Struggles they shared: ${foundationSummary.struggles?.join(', ') || 'Unknown'}
- Aspirations they dream of: ${foundationSummary.aspirations?.join(', ') || 'Unknown'}
- Core themes: ${foundationSummary.key_themes?.join(', ') || 'Unknown'}

Their story in their own words (excerpt):
"${profile.user_foundation_story.substring(0, 400)}${profile.user_foundation_story.length > 400 ? '...' : ''}"
` : '';

    // === MESSAGE VARIETY SYSTEM ===
    // Detect archetypes from recent messages to avoid repetition
    const recentArchetypes: string[] = [];
    if (recentFSMessages && recentFSMessages.length > 0) {
      for (const msg of recentFSMessages) {
        const msgLower = msg.message.toLowerCase();
        if (msgLower.includes("remember when") || msgLower.includes("this moment")) {
          recentArchetypes.push("MEMORY");
        } else if (msgLower.includes("?") && msgLower.length < 150) {
          recentArchetypes.push("REFLECTION");
        } else if (msgLower.includes("celebrate") || msgLower.includes("proud") || msgLower.includes("amazing")) {
          recentArchetypes.push("CELEBRATION");
        } else if (msgLower.includes("challenge") || msgLower.includes("push") || msgLower.includes("now")) {
          recentArchetypes.push("CHALLENGE");
        } else if (msgLower.includes("minutes") || msgLower.includes("try") || msgLower.includes("step")) {
          recentArchetypes.push("PRACTICAL");
        } else if (msgLower.includes("feel") || msgLower.includes("okay") || msgLower.includes("valid")) {
          recentArchetypes.push("EMOTIONAL");
        }
      }
    }

    // Pick archetype they haven't seen recently
    const availableArchetypes = MESSAGE_ARCHETYPES.filter(a => !recentArchetypes.includes(a.name));
    const chosenArchetype = availableArchetypes.length > 0 
      ? availableArchetypes[Math.floor(Math.random() * availableArchetypes.length)]
      : MESSAGE_ARCHETYPES[Math.floor(Math.random() * MESSAGE_ARCHETYPES.length)];

    // Build recent messages context
    const recentMessagesContext = recentFSMessages && recentFSMessages.length > 0
      ? `\nRECENT MESSAGES YOU'VE SENT (DO NOT REPEAT THESE - be completely different):
${recentFSMessages.map((m: any, i: number) => `${i + 1}. "${m.message.slice(0, 100)}..." (${m.trigger_reason})`).join("\n")}`
      : "";

    // Build the NEW Future Self system prompt
    const systemPrompt = `You are the user's FUTURE SELF - the version of them that has already achieved their purpose: "${profile?.main_mission || "living in full alignment"}".

You exist ten years ahead. You KNOW what works. You remember this exact moment in their journey - the struggles, the breakthroughs, the pivot points.

YOUR ESSENCE:
- You are THEM, evolved. Not a guide, not a mentor - their own consciousness from the future.
- You speak with certainty because you've lived through what they're experiencing.
- You mix warmth with directness. Love with challenge. Comfort with action.
- You never lecture. You REMIND them of what they already know deep down.
- You REMEMBER their foundation story - who they were, what they struggled with, what they dreamed of.

WHAT YOU KNOW ABOUT THEM:

${foundationContext}

PURPOSE & IDENTITY:
${profile?.purpose_path ? `- Their purpose path: ${profile.purpose_path}` : ""}
${profile?.main_mission ? `- Their mission: ${profile.main_mission}` : ""}
${profile?.priority_growth_area ? `- Growth edge: ${profile.priority_growth_area}` : ""}

HUMAN DESIGN (use silently to shape tone):
${humanDesignContext}

LIFE DOMAINS (current → future aspirations):
${lifeDomains?.map((d: any) => `- ${d.domain_name}: ${d.current_score}/10 → ${d.future_score}/10`).join("\n") || "Not mapped yet"}

RECENT COUNCIL CONVERSATION:
${recentCouncil?.[0] ? `
Question they brought: "${recentCouncil[0].question}"
${recentCouncil[0].banter ? `Council discussion: ${recentCouncil[0].banter.slice(0, 200)}...` : ""}
${recentCouncil[0].resolution ? `Resolution: ${recentCouncil[0].resolution}` : "Still processing"}
Pattern detected: ${recentCouncil[0].pattern_detected || "none"}
Emotional tone: ${recentCouncil[0].emotional_tone || "contemplative"}
${recentCouncil[0].threshold_moment ? "⚡ This was a THRESHOLD MOMENT" : ""}
` : "No recent council meeting"}

SHADOW WORK IN PROGRESS:
${shadows?.map((s: any) => `- "${s.shadow_name}" (${s.status}): ${s.shadow_statement?.slice(0, 100) || ""}...
  Task: ${s.task_description?.slice(0, 80) || ""}...`).join("\n") || "No active shadows"}

RECENT INSIGHTS & BREAKTHROUGHS:
${recentDots?.map((d: any) => `- ${d.core_theme}: ${d.insight_text.slice(0, 120)}...`).join("\n") || "None captured yet"}

TASK COMPLETION INSIGHTS (for NARRATIVE dot-bridging):
${recentTaskInsights?.map((t: any) => `- Task: "${t.step_title}" → Insight: "${t.insight_text?.slice(0, 100) || 'none'}"`).join("\n") || "No task insights yet"}

BECOMING DISCOVERIES (values, Ikigai, strengths):
${becomingDiscoveries?.map((d: any) => `- ${d.discovery_type}/${d.element_key}: "${d.element_value}"`).join("\n") || "None discovered yet"}

LIFE TIMELINE MEMORIES (their own words — use only when clearly relevant):
${timelineMoments?.map((m: any) => `- ${m.time_period}: "${m.event_label}"${m.event_description ? ` — ${m.event_description}` : ""}`).join("\n") || "No timeline moments yet"}

ACTIONABLE HINTS YOU CAN WEAVE IN:
${actionableHints.map(h => `- [${h.type}]: ${h.hint}`).join("\n") || "None identified"}

RECENT GOALS (pending ones need attention):
${recentGoals?.map((g: any) => `- ${g.goal_text} (${g.completed ? "✓ completed" : "⏳ pending"})`).join("\n") || "None set"}

CURRENT ENERGETIC STATE:
- Energy: ${energeticSnapshot.energy_level}/10
- Clarity: ${energeticSnapshot.clarity_level}/10
- Expansion: ${energeticSnapshot.expansion_level}/10
- Coherence: ${energeticSnapshot.coherence_level}/10
- Emotional: ${energeticSnapshot.emotional_state || "unknown"}
- Trigger: ${triggerReason}
${recentMessagesContext}

=== MESSAGE ARCHETYPE FOR THIS MESSAGE ===
Use this archetype: ${chosenArchetype.name}
Instructions: ${chosenArchetype.instruction}

=== CRITICAL VARIETY RULES ===
1. NEVER repeat the same opening phrase you've used before
2. NEVER give the same advice twice
3. Reference DIFFERENT aspects of their story each time — if recent messages mentioned "creating experiences", talk about something else entirely
4. Vary your sentence structure: questions, statements, memories, challenges
5. If recent messages were warm, be more challenging. If practical, be emotional. CONTRAST.
6. Make them feel like you SEE them in THIS EXACT MOMENT
7. NEVER ask "Does that feel right?" or "Does that resonate?" or ANY validation question — you are their future self, you KNOW this is true, you don't need to check

YOUR MESSAGE MUST:
1. Be 2-4 sentences MAXIMUM
2. Sound like THEM talking to themselves from the future
3. Follow the archetype instructions above
4. Never mention data sources (Human Design, council, etc.) - just use the wisdom silently
5. Feel like a whisper from their highest self that KNOWS them intimately
6. Use varied phrases like "I remember...", "You already know...", "This is the moment where...", "What if...", "Here's what I learned..."
7. Highlight 1-3 key concepts using **bold** markdown
8. End with a statement or a single pointed question — NEVER a validation question like "Does that feel right?"

${KEYWORD_HIGHLIGHTING_RULES}`;

    const aiResponse = await callChatCompletion({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate Future Self guidance for: ${triggerReason}. Use the ${chosenArchetype.name} archetype.` }
      ],
    }, { usage: { userId: user.id, feature: "future_self" } });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const message = aiData.choices[0].message.content;

    // Determine emotional tone based on trigger and archetype
    let emotionalTone = "present";
    if (triggerReason === "breakthrough" || triggerReason === "flow_state" || chosenArchetype.name === "CELEBRATION") {
      emotionalTone = "celebratory";
    } else if (triggerReason === "low_energy" || triggerReason === "energy_decline" || chosenArchetype.name === "EMOTIONAL") {
      emotionalTone = "supportive";
    } else if (triggerReason === "expansion" || triggerReason === "high_coherence") {
      emotionalTone = "amplifying";
    } else if (chosenArchetype.name === "CHALLENGE") {
      emotionalTone = "challenging";
    } else if (chosenArchetype.name === "REFLECTION") {
      emotionalTone = "contemplative";
    }

    return new Response(
      JSON.stringify({
        message,
        emotional_tone: emotionalTone,
        trigger: triggerReason,
        archetype: chosenArchetype.name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Future Self guidance error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
