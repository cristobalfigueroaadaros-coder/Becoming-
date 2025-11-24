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
    const { taskId } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Get the completed task
    const { data: task, error: taskError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (taskError || !task) throw new Error("Task not found");

    // Generate reflection questions with three-layer guidance
    const reflectionPrompt = `A user just completed this task. Generate reflection questions with THREE-LAYER GUIDANCE (emotional + practical + energetic).

Task: ${task.task_title}
Description: ${task.task_description}
Mentor: ${task.mentor_name}

🔷 GENERATE 3 POWERFUL REFLECTION QUESTIONS:

Question 1 - EMOTIONAL LAYER (What did they discover about themselves?)
- Focus on emotional insight, self-awareness, truth revealed
- Example: "What did you learn about yourself that surprised you?"

Question 2 - PRACTICAL LAYER (What did they learn to apply?)
- Focus on actionable insight, skill, next step
- Example: "What will you do differently because of this experience?"

Question 3 - ENERGETIC LAYER (What did they feel?) ✨ NEW
- Focus on expansion/contraction, resonance, embodiment, energy shift
- Include somatic cues
- Example: "When did you feel most alive doing this? What does that tell you about your direction?"

RULES:
- Each question: 8-15 words max
- Make them personal, direct, insightful
- Use active, embodied language
- Include "notice," "feel," "sense" in energetic questions
- Create space for depth without overwhelming

Format as:
- [emotional question]
- [practical question]
- [energetic question]`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: reflectionPrompt }],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error("Failed to generate reflection questions");
    }

    const aiData = await aiResponse.json();
    const questionsText = aiData.choices[0].message.content;
    
    const reflectionQuestions = questionsText
      .split('\n')
      .filter((line: string) => line.trim().startsWith('-'))
      .map((line: string) => line.replace(/^-\s*/, '').trim());

    return new Response(
      JSON.stringify({ reflectionQuestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Task reflection error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});