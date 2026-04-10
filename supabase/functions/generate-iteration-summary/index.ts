import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { projectId, iterationNumber } = await req.json();
    if (!projectId || !iterationNumber) throw new Error("Missing projectId or iterationNumber");

    // Fetch project info
    const { data: project } = await supabaseClient
      .from("integrator_projects")
      .select("project_title, project_description")
      .eq("id", projectId)
      .single();

    // Fetch all phase content for this iteration
    const { data: phaseContent } = await supabaseClient
      .from("design_thinking_content")
      .select("phase, content, reflection_response")
      .eq("project_id", projectId)
      .eq("iteration_number", iterationNumber);

    // Fetch task feedback (test phase data)
    const { data: feedback } = await supabaseClient
      .from("task_feedback")
      .select("insight_text, win_text, integrator_daily_steps!inner(project_id, step_title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const projectFeedback = feedback?.filter(
      (f: any) => f.integrator_daily_steps?.project_id === projectId
    ) ?? [];

    // Build context for AI
    const phaseMap: Record<string, any> = {};
    phaseContent?.forEach((row: any) => {
      phaseMap[row.phase] = {
        notes: (row.content as any[]) || [],
        reflection: row.reflection_response || null,
      };
    });

    const phaseOrder = ["define", "ideate", "prototype", "test", "empathize", "iterate"];
    const phaseLabels: Record<string, string> = {
      define: "Problem defined",
      ideate: "Ideas explored",
      prototype: "Built/tested",
      test: "What was learned",
      empathize: "People insights",
      iterate: "Applied learning",
    };

    let phaseContext = "";
    for (const phase of phaseOrder) {
      const data = phaseMap[phase];
      if (!data) continue;
      const notes = data.notes?.map((n: any) => n.text).filter(Boolean).join("; ");
      const reflection = data.reflection;
      if (notes || reflection) {
        phaseContext += `\n${phaseLabels[phase]}:`;
        if (notes) phaseContext += ` ${notes}`;
        if (reflection) phaseContext += ` | Reflection: ${reflection}`;
      }
    }

    if (projectFeedback.length > 0) {
      phaseContext += "\nTest learnings: " + projectFeedback
        .map((f: any) => f.insight_text || f.win_text)
        .filter(Boolean)
        .join("; ");
    }

    const projectName = project?.project_title ?? "the project";

    const prompt = `You are summarizing one iteration of a Design Thinking cycle for a creator.

Project: "${projectName}"
Iteration: ${iterationNumber}

What happened in this iteration:
${phaseContext || "The creator worked through their design thinking cycle."}

Write a 2-3 sentence narrative summary of this iteration — what was discovered, built, tested, and how it was applied.
Write in past tense, third person ("They discovered...", "The team learned...").
Be specific to the content provided. Focus on the insight arc: problem → idea → action → learning → iteration.
Do NOT use bullet points. Return only the summary text, no headers or extra formatting.`;

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error: ${err}`);
    }

    const data = await response.json();
    const summary = data.content?.[0]?.text?.trim() ?? null;

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-iteration-summary error:", error);
    return new Response(
      JSON.stringify({ error: String(error), summary: null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
