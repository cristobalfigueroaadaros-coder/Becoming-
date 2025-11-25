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
    const { mentorAnswers, question, emotionalTone, detectedPattern } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // === STEP 1: SELECT ONE BEST ACTION ===
    const allPracticalSteps: string[] = [];
    
    for (const [mentorType, answer] of Object.entries(mentorAnswers)) {
      const mentorAnswer = answer as any;
      if (mentorAnswer.practicalAction) {
        const steps = Array.isArray(mentorAnswer.practicalAction) 
          ? mentorAnswer.practicalAction 
          : [mentorAnswer.practicalAction];
        allPracticalSteps.push(...steps.map((s: string) => `[${mentorType}] ${s}`));
      }
    }

    const selectionPrompt = `You are the Council coordinator. Select ONE best next action from these mentor suggestions.

SELECTION CRITERIA:
- Must be simple
- Must be concrete
- Must be doable today
- Must move the user toward their purpose/goal

User's question: "${question}"
Emotional state: ${emotionalTone}
${detectedPattern ? `Pattern: ${detectedPattern}` : ''}

MENTOR SUGGESTIONS:
${allPracticalSteps.join('\n')}

Return ONLY the selected action (without the mentor label), in one clear sentence.`;

    const selectionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: selectionPrompt }],
      }),
    });

    if (!selectionResponse.ok) throw new Error("Failed to select best action");
    
    const selectionData = await selectionResponse.json();
    const bestAction = selectionData.choices[0].message.content;

    // === STEP 2: GENERATE TASKS (Daily, Weekly, Monthly) ===
    const taskPrompt = `Based on this best action, generate 3 tasks:

BEST ACTION: ${bestAction}

User context:
- Question: "${question}"
- Emotional state: ${emotionalTone}

Generate:

1. DAILY TASK (5 minutes max):
A tiny, immediate micro-step that can be done today. Ultra-specific.

2. WEEKLY TASK:
A slightly bigger, meaningful step that builds on the daily task. Still concrete.

3. MONTHLY MILESTONE:
A clear direction linked to the vision. More strategic.

Format your response EXACTLY like this (include the labels):
DAILY: [your daily task]
WEEKLY: [your weekly task]
MONTHLY: [your monthly milestone]`;

    const taskResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: taskPrompt }],
      }),
    });

    if (!taskResponse.ok) throw new Error("Failed to generate tasks");
    
    const taskData = await taskResponse.json();
    const tasksText = taskData.choices[0].message.content;

    // Parse tasks
    const dailyMatch = tasksText.match(/DAILY:\s*(.+?)(?:\n|$)/i);
    const weeklyMatch = tasksText.match(/WEEKLY:\s*(.+?)(?:\n|$)/i);
    const monthlyMatch = tasksText.match(/MONTHLY:\s*(.+?)(?:\n|$)/i);

    const dailyTask = dailyMatch ? dailyMatch[1].trim() : "Take one small step toward your goal";
    const weeklyTask = weeklyMatch ? weeklyMatch[1].trim() : "Build on today's progress";
    const monthlyTask = monthlyMatch ? monthlyMatch[1].trim() : "Make meaningful progress on your vision";

    // === STEP 3: WRITE TO GOAL BOARD ===
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Insert daily goal
    const { error: dailyError } = await supabaseClient
      .from("daily_goals")
      .insert({
        user_id: user.id,
        goal_text: dailyTask,
        completed: false,
        xp_awarded: false,
      });

    if (dailyError) console.error("Daily goal error:", dailyError);

    // Insert weekly goal
    const { error: weeklyError } = await supabaseClient
      .from("weekly_goals")
      .insert({
        user_id: user.id,
        goal_text: weeklyTask,
        week_start: weekStart.toISOString().split('T')[0],
        completed: false,
        xp_awarded: false,
      });

    if (weeklyError) console.error("Weekly goal error:", weeklyError);

    // Insert monthly goal
    const { error: monthlyError } = await supabaseClient
      .from("monthly_goals")
      .insert({
        user_id: user.id,
        goal_text: monthlyTask,
        month_start: monthStart.toISOString().split('T')[0],
        completed: false,
        xp_awarded: false,
      });

    if (monthlyError) console.error("Monthly goal error:", monthlyError);

    return new Response(
      JSON.stringify({
        success: true,
        tasks: {
          daily: dailyTask,
          weekly: weeklyTask,
          monthly: monthlyTask,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating council tasks:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
