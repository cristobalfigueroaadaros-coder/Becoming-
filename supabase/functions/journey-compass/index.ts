import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cris's Map reference — the "destination shape" of a complete founder journey.
// Used by the AI to identify what's missing in the user's current Atlas.
const CRIS_MAP_REFERENCE = `
A complete Founder's Atlas has presence across 15 clusters:
IDENTITY ROOTS: life-events, passions, skills, aha-moments, natural-talents, childhood-signals
ACTION & WORLD: experiments, inspirations (people-i-admire), external-reflections, personal-frustrations
IMPACT & VISION: who-i-serve, how-i-create-impact, vision-for-a-better-world, values, ideal-life

High-leverage gold connections form between:
- personal-frustrations <-> vision-for-a-better-world (problem -> solution)
- aha-moments <-> who-i-serve (insight -> audience)
- experiments <-> life-events (action -> formative moments)
- childhood-signals <-> natural-talents (origin -> gift)
- skills + passions -> how-i-create-impact (capability -> contribution)
`.trim();

const MENTOR_DISPLAY_NAMES: Record<string, string> = {
  discipline_mentor: "The Discipline Mentor",
  strategist_mentor: "The Strategist",
  business_mentor: "The Business Mentor",
  creative_visionary: "The Creative Visionary",
  heart_mentor: "The Heart Mentor",
  alignment_mentor: "The Alignment Mentor",
  future_self: "Your Future Self",
  problem_mentor: "The Problem Mentor",
  inner_clarity_mentor: "The Inner Clarity Mentor",
  release_mentor: "The Release Mentor",
};

const CLUSTER_DISPLAY_NAMES: Record<string, string> = {
  "life-events": "Life Events",
  "passions": "Passions",
  "skills": "Skills",
  "aha-moments": "Aha Moments",
  "natural-talents": "Natural Talents",
  "childhood-signals": "Childhood Signals",
  "experiments": "Experiments",
  "inspirations": "People I Admire",
  "external-reflections": "External Reflections",
  "personal-frustrations": "Personal Frustrations",
  "who-i-serve": "Who I Serve",
  "how-i-create-impact": "How I Create Impact",
  "vision-for-a-better-world": "Vision for a Better World",
  "values": "Values",
  "ideal-life": "Ideal Life",
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

    const body = await req.json().catch(() => ({}));
    const userInput: string | undefined = body.userInput;
    const mode: "ask" | "proactive" = body.mode === "ask" ? "ask" : "proactive";

    console.log(`[journey-compass] mode=${mode} user=${user.id} hasInput=${!!userInput}`);

    // ─── Aggregate user state in parallel ──────────────────────────────
    const [
      profileR,
      dotsR,
      activeProjectR,
      stepsR,
      chatsR,
      patternsR,
    ] = await Promise.all([
      supabaseClient.from("profiles").select("display_name, entry_state, console_intake_completed").eq("id", user.id).maybeSingle(),
      supabaseClient.from("atlas_dots").select("cluster_slug, created_at").eq("user_id", user.id),
      supabaseClient.from("integrator_projects").select("id, project_title, project_description, current_phase, current_day, timeframe_days, created_at, updated_at").eq("user_id", user.id).eq("status", "active").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabaseClient.from("integrator_daily_steps").select("step_title, status, completed_at, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(15),
      supabaseClient.from("chats").select("mentor_type, role, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(60),
      supabaseClient.from("inner_patterns").select("pattern_name, transmutation_data, created_at").eq("user_id", user.id).limit(8),
    ]);

    const profile = profileR.data;
    const dots = dotsR.data || [];
    const activeProject = activeProjectR.data;
    const steps = stepsR.data || [];
    const chats = chatsR.data || [];
    const patterns = patternsR.data || [];

    // Build cluster distribution
    const clusterCounts: Record<string, number> = {};
    for (const d of dots) {
      const slug = (d as any).cluster_slug as string;
      if (slug) clusterCounts[slug] = (clusterCounts[slug] || 0) + 1;
    }
    const allClusterSlugs = Object.keys(CLUSTER_DISPLAY_NAMES);
    const missingClusters = allClusterSlugs.filter(s => !clusterCounts[s]);
    const weakClusters = allClusterSlugs.filter(s => (clusterCounts[s] || 0) > 0 && (clusterCounts[s] || 0) < 2);
    const strongClusters = Object.entries(clusterCounts).filter(([, c]) => c >= 3).map(([s]) => s);

    // Mentor usage in last 14 days
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const mentorUsage: Record<string, number> = {};
    for (const c of chats) {
      if (c.role === "user" && new Date((c as any).created_at).getTime() > cutoff) {
        const m = (c as any).mentor_type;
        if (m) mentorUsage[m] = (mentorUsage[m] || 0) + 1;
      }
    }
    const allMentors = Object.keys(MENTOR_DISPLAY_NAMES);
    const unusedMentors = allMentors.filter(m => !mentorUsage[m]);

    // Project staleness
    let daysSinceProjectAction: number | null = null;
    if (activeProject) {
      const lastStep = steps.find((s: any) => s.status === "completed" && s.completed_at);
      if (lastStep) {
        daysSinceProjectAction = Math.floor((Date.now() - new Date((lastStep as any).completed_at).getTime()) / (1000 * 60 * 60 * 24));
      } else {
        daysSinceProjectAction = Math.floor((Date.now() - new Date(activeProject.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    const untransmutedPatterns = patterns.filter((p: any) => {
      const td = p.transmutation_data;
      return !td || !td.gold || (typeof td === "object" && Object.keys(td).length === 0);
    });

    // ─── Build context block for the AI ────────────────────────────────
    const contextLines: string[] = [];
    contextLines.push(`User: ${profile?.display_name || "Unknown"} | Phase: ${profile?.entry_state || "DISCOVER"}`);
    contextLines.push(`Atlas: ${dots.length} total dots`);
    contextLines.push(`  Strong clusters (3+): ${strongClusters.map(s => CLUSTER_DISPLAY_NAMES[s]).join(", ") || "none"}`);
    contextLines.push(`  Weak clusters (1 dot): ${weakClusters.map(s => CLUSTER_DISPLAY_NAMES[s]).join(", ") || "none"}`);
    contextLines.push(`  Missing clusters (0 dots): ${missingClusters.map(s => CLUSTER_DISPLAY_NAMES[s]).join(", ") || "none"}`);
    if (activeProject) {
      contextLines.push(`Active project: "${activeProject.project_title}" (${activeProject.project_description || "no desc"})`);
      contextLines.push(`  Phase: ${activeProject.current_phase} | Day ${activeProject.current_day}/${activeProject.timeframe_days}`);
      if (daysSinceProjectAction !== null) {
        contextLines.push(`  Days since last completed action: ${daysSinceProjectAction}`);
      }
    } else {
      contextLines.push(`No active project.`);
    }
    contextLines.push(`Mentor usage (14d): ${Object.entries(mentorUsage).map(([m, c]) => `${MENTOR_DISPLAY_NAMES[m] || m}=${c}`).join(", ") || "none"}`);
    contextLines.push(`Unused mentors: ${unusedMentors.map(m => MENTOR_DISPLAY_NAMES[m]).join(", ")}`);
    if (patterns.length > 0) {
      contextLines.push(`Inner patterns: ${patterns.length} total, ${untransmutedPatterns.length} untransmuted`);
      if (untransmutedPatterns.length > 0) {
        contextLines.push(`  Untransmuted: ${untransmutedPatterns.slice(0, 3).map((p: any) => p.pattern_name).join(", ")}`);
      }
    }

    const fullContext = contextLines.join("\n");

    // ─── AI prompt ─────────────────────────────────────────────────────
    const systemPrompt = `You are the Journey Compass — the user's living guide across the entire Bcoming app. You always know exactly where they are and what the single most leverage-producing next move is.

REFERENCE — what a complete founder journey looks like (use this to spot gaps):
${CRIS_MAP_REFERENCE}

THE USER'S CURRENT STATE:
${fullContext}

${userInput ? `THE USER JUST ASKED: "${userInput}"` : `MODE: Proactive — they opened the Compass without a question. Read their state and recommend the move that will create the most movement.`}

YOUR JOB:
Recommend ONE primary next move + 2 alternatives across DIFFERENT surfaces. Available surfaces:
- "atlas_quest"     — they should explore a specific cluster (use targetId = cluster slug, e.g. "childhood-signals"). Use this when a high-leverage cluster is missing or weak.
- "mentor"          — they should talk to a specific mentor (use targetId = mentor key like "heart_mentor"). Use this when they're stuck emotionally, strategically, or under-using a mentor whose perspective they need.
- "design_thinking" — they should advance their project's design thinking phase (targetId = phase: "empathize" | "define" | "ideate" | "prototype" | "test"). Use when project phase is stale.
- "project_block"   — they should focus on a project block/activity (targetId = "active"). Use when project exists but no activity in days.
- "transmutation"   — they should transmute an inner pattern (targetId = pattern name or "active"). Use when untransmuted patterns are interfering.
- "becoming"        — they should reflect in the Becoming Path (targetId = "becoming"). Use when identity work is needed before action.
- "creators"        — they should engage with the community (targetId = "creators"). Use when they have momentum to share.

RULES:
- Reference SPECIFIC details from their state (cluster name, project name, mentor name, days, etc.). Never give generic advice.
- The 3 suggestions MUST be on DIFFERENT surfaces (don't recommend 3 quests).
- Prioritize moves that unlock other parts of the system (e.g. an Atlas gap that would let mentors see them better).
- Tone: warm, direct, "I see where you are." Movement > perfection.
- ctaLabel format: "Explore [Cluster Name]" / "Talk to [Mentor]" / "Move to [Phase]" / "Open Project" / "Transmute [Pattern]" / "Reflect in Becoming" / "Visit Creators".`;

    // ─── Call Lovable AI with tool calling for structured output ────────
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
          { role: "user", content: userInput || "Read my state and tell me my next move." },
        ],
        tools: [{
          type: "function",
          function: {
            name: "emit_compass_guidance",
            description: "Emit the Journey Compass recommendation",
            parameters: {
              type: "object",
              properties: {
                stateSummary: { type: "string", description: "1-2 sentences naming where the user is right now, with specifics." },
                primarySuggestion: {
                  type: "object",
                  properties: {
                    surface: { type: "string", enum: ["atlas_quest", "mentor", "design_thinking", "project_block", "transmutation", "becoming", "creators"] },
                    targetId: { type: "string" },
                    title: { type: "string" },
                    why: { type: "string", description: "1-2 sentences referencing the user's actual data." },
                    leverageInsight: { type: "string", description: "What this unlocks elsewhere in the system." },
                    ctaLabel: { type: "string" },
                    handoffContext: { type: "string", description: "Context to pass to the target surface (e.g. mentor)." },
                  },
                  required: ["surface", "targetId", "title", "why", "leverageInsight", "ctaLabel", "handoffContext"],
                },
                alternativeSuggestions: {
                  type: "array",
                  minItems: 2,
                  maxItems: 2,
                  items: {
                    type: "object",
                    properties: {
                      surface: { type: "string", enum: ["atlas_quest", "mentor", "design_thinking", "project_block", "transmutation", "becoming", "creators"] },
                      targetId: { type: "string" },
                      title: { type: "string" },
                      why: { type: "string" },
                      ctaLabel: { type: "string" },
                    },
                    required: ["surface", "targetId", "title", "why", "ctaLabel"],
                  },
                },
              },
              required: ["stateSummary", "primarySuggestion", "alternativeSuggestions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "emit_compass_guidance" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[journey-compass] AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Rate limit reached. Try again in a minute." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "AI credits needed. Add funds in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured guidance");
    }

    let guidance;
    try {
      guidance = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("[journey-compass] Failed to parse tool args:", toolCall.function.arguments);
      throw new Error("Invalid AI response format");
    }

    console.log(`[journey-compass] surface=${guidance.primarySuggestion?.surface} target=${guidance.primarySuggestion?.targetId}`);

    return new Response(JSON.stringify({ success: true, ...guidance }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[journey-compass] error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});