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
    const { mentorResponse, mentorName } = await req.json();
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

    // Call AI to extract task using tool calling
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a task extraction assistant. Extract ONE actionable task from the mentor's advice."
          },
          {
            role: "user",
            content: `Extract one clear actionable task from this mentor response:\n\n${mentorResponse}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_task",
              description: "Extract one actionable task from mentor advice",
              parameters: {
                type: "object",
                properties: {
                  task_title: {
                    type: "string",
                    description: "A short, clear title for the task (max 10 words)"
                  },
                  task_description: {
                    type: "string",
                    description: "A detailed description of what needs to be done"
                  }
                },
                required: ["task_title", "task_description"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_task" } }
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI gateway error:", aiResponse.status);
      throw new Error("Failed to extract task");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No task extracted");
    }

    const taskData = JSON.parse(toolCall.function.arguments);

    // Save task to database
    const { data: task, error: insertError } = await supabaseClient
      .from("tasks")
      .insert({
        user_id: user.id,
        mentor_name: mentorName,
        task_title: taskData.task_title,
        task_description: taskData.task_description,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ task }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in extract-task:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
