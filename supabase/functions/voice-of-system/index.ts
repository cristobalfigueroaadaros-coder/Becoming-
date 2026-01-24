import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Blocker types and their associated targets
const BLOCKER_TYPES = [
  {
    type: 'lack_of_clarity',
    signals: ['unclear', 'confused', "don't know", 'not sure what', 'what should i', 'which direction', 'no idea'],
    targets: ['strategist_mentor', 'problem_mentor'],
    mentorPrompt: 'Help them clarify what they\'re actually trying to solve'
  },
  {
    type: 'problem_confusion',
    signals: ["don't know what the problem is", 'confused about the problem', 'too many issues', "can't articulate", 'what am i even solving'],
    targets: ['problem_mentor', 'strategist_mentor'],
    mentorPrompt: 'Help them break down and articulate the actual problem they face'
  },
  {
    type: 'emotional_resistance',
    signals: ['afraid', 'scared', 'anxious', 'overwhelmed', 'stuck', 'paralyzed', 'can\'t move', 'blocked'],
    targets: ['heart_mentor', 'release_mentor'],
    mentorPrompt: 'Acknowledge their feelings, help them process the emotion before action'
  },
  {
    type: 'emotional_release_needed',
    signals: ['heavy', "can't let go", 'holding', 'stuck feeling', 'carrying', 'weight', 'burden', "can't move past", 'looping'],
    targets: ['release_mentor', 'heart_mentor'],
    mentorPrompt: 'Guide them through letting go without trying to fix or reframe'
  },
  {
    type: 'inner_pattern_recognition',
    signals: ['pattern', 'keep doing', 'always', 'repeating', 'why do I', "can't stop", 'same thing', 'again and again'],
    targets: ['inner_clarity_mentor', 'heart_mentor'],
    mentorPrompt: 'Help them see the inner pattern that drives this behavior'
  },
  {
    type: 'missing_feedback',
    signals: ["don't know if", 'is this right', 'should I', 'validation', 'feedback', 'not sure if good'],
    targets: ['business_mentor', 'strategist_mentor'],
    mentorPrompt: 'Guide them to get concrete feedback on their work'
  },
  {
    type: 'direction_uncertainty',
    signals: ['right path', 'direction', 'purpose', 'meaning', 'why am i', 'lost', 'disconnected'],
    targets: ['future_self', 'alignment_mentor'],
    mentorPrompt: 'Reconnect them to their deeper purpose and direction'
  },
  {
    type: 'avoidance_overwhelm',
    signals: ['too much', 'paralyzed', "can't start", 'procrastinating', 'avoiding', 'putting off', 'overwhelmed'],
    targets: ['discipline_mentor', 'problem_mentor'],
    mentorPrompt: 'Break down the overwhelm into one tiny actionable step'
  },
  {
    type: 'execution_block',
    signals: ['how do i', "don't know how", 'implementation', 'build', 'create', 'make', 'execute'],
    targets: ['creative_visionary', 'discipline_mentor'],
    mentorPrompt: 'Move them from thinking to doing with a concrete experiment'
  }
];

// Mentor display names for CTA labels
const mentorDisplayNames: Record<string, string> = {
  discipline_mentor: "The Discipline Mentor",
  strategist_mentor: "The Strategist",
  business_mentor: "The Business Mentor",
  creative_visionary: "The Creative Visionary",
  heart_mentor: "The Heart Mentor",
  alignment_mentor: "The Alignment Mentor",
  future_self: "Your Future Self",
  // Clarity & Understanding mentors
  problem_mentor: "The Problem Mentor",
  inner_clarity_mentor: "The Inner Clarity Mentor",
  release_mentor: "The Release Mentor",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userInput } = await req.json();
    if (!userInput || typeof userInput !== 'string') {
      return new Response(JSON.stringify({ success: false, error: "Please describe what you're experiencing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Voice of System analyzing input for user:", user.id);

    // Gather comprehensive user context in parallel
    const [
      profileResult,
      projectResult,
      recentStepsResult,
      recentInsightsResult,
      recentChatsResult,
      discoveriesResult,
      valueMapResult,
    ] = await Promise.all([
      supabaseClient.from("profiles").select("*").eq("id", user.id).single(),
      supabaseClient.from("integrator_projects").select("*").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabaseClient.from("integrator_daily_steps").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabaseClient.from("saved_insights").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      supabaseClient.from("chats").select("mentor_type, content, role, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabaseClient.from("becoming_discoveries").select("*").eq("user_id", user.id).limit(10),
      supabaseClient.from("value_map_blocks").select("*").eq("user_id", user.id),
    ]);

    const profile = profileResult.data;
    const activeProject = projectResult.data;
    const recentSteps = recentStepsResult.data || [];
    const recentInsights = recentInsightsResult.data || [];
    const recentChats = recentChatsResult.data || [];
    const discoveries = discoveriesResult.data || [];
    const valueMapBlocks = valueMapResult.data || [];

    // Calculate time since last meaningful action
    const lastCompletedStep = recentSteps.find((s: any) => s.status === 'completed');
    const daysSinceAction = lastCompletedStep 
      ? Math.floor((Date.now() - new Date(lastCompletedStep.completed_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Build rich context string
    const contextParts: string[] = [];
    
    if (profile?.display_name) {
      contextParts.push(`User: ${profile.display_name}`);
    }
    
    if (activeProject) {
      contextParts.push(`Active Project: "${activeProject.project_title}" - ${activeProject.project_description || 'No description'}`);
      contextParts.push(`Project Day: ${activeProject.current_day} of ${activeProject.timeframe_days}`);
      contextParts.push(`Current Phase: ${activeProject.current_phase}`);
    } else {
      contextParts.push("No active project currently.");
    }

    if (daysSinceAction !== null) {
      contextParts.push(`Days since last completed action: ${daysSinceAction}`);
    }

    const pendingSteps = recentSteps.filter((s: any) => s.status === 'pending');
    if (pendingSteps.length > 0) {
      contextParts.push(`Pending tasks: ${pendingSteps.slice(0, 3).map((s: any) => s.step_title).join(', ')}`);
    }

    if (recentInsights.length > 0) {
      contextParts.push(`Recent insights: ${recentInsights.slice(0, 2).map((i: any) => i.content?.substring(0, 50)).join(' | ')}`);
    }

    // Recent mentor conversations summary
    const mentorSummary = recentChats.slice(0, 10).map((c: any) => 
      `[${c.mentor_type}] ${c.role}: ${c.content?.substring(0, 60)}...`
    ).join('\n');
    if (mentorSummary) {
      contextParts.push(`Recent conversations:\n${mentorSummary}`);
    }

    // Becoming discoveries
    if (discoveries.length > 0) {
      const discoveryTypes = [...new Set(discoveries.map((d: any) => d.discovery_type))];
      contextParts.push(`Becoming discoveries in: ${discoveryTypes.join(', ')}`);
    }

    // Value map progress
    const unlockedBlocks = valueMapBlocks.filter((b: any) => b.is_unlocked);
    if (unlockedBlocks.length > 0) {
      contextParts.push(`Value Map unlocked: ${unlockedBlocks.map((b: any) => b.block_key).join(', ')}`);
    }

    const fullContext = contextParts.join('\n');

    // Use AI to analyze the situation
    const systemPrompt = `You are the Voice of the System - a context-aware guidance layer that helps users regain momentum.

You have COMPLETE knowledge of this user's journey:
${fullContext}

The user just expressed: "${userInput}"

YOUR TASK:
1. Identify their PRIMARY blocker from: ${BLOCKER_TYPES.map(b => b.type).join(', ')}
2. Determine the SINGLE most helpful next action (a specific mentor)
3. Generate a message that shows you KNOW their situation (reference their project, their progress, etc.)
4. Provide a clear explanation of why this action will help

CRITICAL RULES:
- You NEVER ask blind questions. You speak from "I know where you are."
- Reference specific details from their context (project name, days, phases, etc.)
- Be warm but direct - movement over perfection
- The handoff context should give the mentor everything they need to start proactively

RESPOND IN VALID JSON ONLY:
{
  "blockerType": "one of: lack_of_clarity, problem_confusion, emotional_resistance, emotional_release_needed, inner_pattern_recognition, missing_feedback, direction_uncertainty, avoidance_overwhelm, execution_block",
  "blockerMessage": "A 1-2 sentence acknowledgment that shows you understand exactly where they are",
  "targetType": "mentor",
  "targetId": "one of: discipline_mentor, strategist_mentor, business_mentor, creative_visionary, heart_mentor, alignment_mentor, future_self, problem_mentor, inner_clarity_mentor, release_mentor",
  "actionExplanation": "Why this specific mentor will help them move forward (1-2 sentences)",
  "ctaLabel": "Button text like 'Talk to [Mentor Name]'",
  "handoffContext": "Full context for the mentor: what the user is struggling with, what they need, how to approach them"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this and respond with JSON: "${userInput}"` }
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI Gateway error:", response.status, await response.text());
      throw new Error("Failed to analyze your situation");
    }

    const aiData = await response.json();
    let aiText = aiData.choices?.[0]?.message?.content || "";
    
    // Clean JSON from markdown if present
    aiText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let result;
    try {
      result = JSON.parse(aiText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiText);
      // Fallback to a safe default
      result = {
        blockerType: 'lack_of_clarity',
        blockerMessage: "I can see you're navigating some uncertainty right now. That's normal, and we can work through this together.",
        targetType: 'mentor',
        targetId: 'strategist_mentor',
        actionExplanation: "The Strategist can help you see the bigger picture and find your next step.",
        ctaLabel: "Talk to the Strategist",
        handoffContext: `User expressed: "${userInput}". They need help finding clarity and direction.`
      };
    }

    // Ensure CTA label uses proper mentor name
    if (result.targetId && mentorDisplayNames[result.targetId]) {
      if (!result.ctaLabel || !result.ctaLabel.includes(mentorDisplayNames[result.targetId])) {
        result.ctaLabel = `Talk to ${mentorDisplayNames[result.targetId]}`;
      }
    }

    console.log("Voice of System result:", result.blockerType, "->", result.targetId);

    return new Response(JSON.stringify({
      success: true,
      blockerType: result.blockerType,
      blockerMessage: result.blockerMessage,
      targetType: result.targetType || 'mentor',
      targetId: result.targetId,
      actionExplanation: result.actionExplanation,
      ctaLabel: result.ctaLabel,
      handoffContext: result.handoffContext,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Voice of System error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Something went wrong" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
