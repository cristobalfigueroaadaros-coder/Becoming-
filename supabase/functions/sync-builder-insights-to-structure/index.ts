import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StructureNode {
  id: string;
  title: string;
  description?: string;
  status: "not_started" | "in_progress" | "strong" | "completed";
  importance: "low" | "medium" | "high";
  children: StructureNode[];
  notes?: string;
  source?: string;
  pending_review?: boolean;
  suggestedActivity?: string;
}

interface BuilderInsight {
  mentor: string;
  insight: string;
  context?: string;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { projectId, insights, intakeContext } = await req.json() as {
      projectId: string;
      insights: BuilderInsight[];
      intakeContext?: string;
    };

    if (!projectId || !Array.isArray(insights) || insights.length === 0) {
      return new Response(JSON.stringify({ error: "projectId and insights required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load project
    const { data: project, error: projErr } = await supabase
      .from("integrator_projects")
      .select("id, project_title, project_description, project_structure, user_id")
      .eq("id", projectId)
      .single();

    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (project.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const structure: StructureNode[] = Array.isArray(project.project_structure)
      ? project.project_structure as StructureNode[]
      : [];

    // If structure is empty, do nothing — sync only enriches existing structure.
    if (structure.length === 0) {
      return new Response(JSON.stringify({ ok: true, applied: 0, reason: "empty_structure" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt for AI classifier
    const blockSummary = structure.map((b, i) =>
      `Block ${i + 1} (id="${b.id}"): "${b.title}"${b.description ? ` — ${b.description}` : ""}\n  Activities: ${b.children.length === 0 ? "(none yet)" : b.children.map(c => `"${c.title}"`).join(", ")}`
    ).join("\n");

    const insightSummary = insights.map((ins, i) =>
      `Insight ${i + 1} (from ${ins.mentor}): ${ins.insight}`
    ).join("\n\n");

    const systemPrompt = `You are a project structure assistant. Given a project's current blocks/activities and recent Builder Team mentor insights, classify each insight into ONE of three actions:

- ENRICH: insight refines/clarifies an existing block's intent. Provide a short note (max 140 chars) appended to that block.
- ADD_ACTIVITY: insight is a concrete, doable action that fits an existing block. Provide a short activity title (max 60 chars).
- NEW_BLOCK: insight opens a clearly different work area not covered by any current block. Only use this when truly necessary.

Strict rules:
- Maximum 3 ADD_ACTIVITY suggestions total across all insights.
- Maximum 1 NEW_BLOCK suggestion total.
- Skip insights that are too vague, repetitive, or already covered.
- Prefer ENRICH over ADD_ACTIVITY when the insight is reflective rather than actionable.
- Use blockId from the provided list when targeting an existing block.`;

    const userPrompt = `Project: "${project.project_title}"
Description: ${project.project_description || "(none)"}
${intakeContext ? `\nUser's current focus:\n${intakeContext}\n` : ""}
Current structure:
${blockSummary}

Recent Builder Team insights:
${insightSummary}

Classify each insight (or skip).`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "apply_suggestions",
            description: "Apply classified suggestions to the project structure.",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string", enum: ["ENRICH", "ADD_ACTIVITY", "NEW_BLOCK", "SKIP"] },
                      blockId: { type: "string", description: "Target block id (for ENRICH or ADD_ACTIVITY)" },
                      title: { type: "string", description: "Title for ADD_ACTIVITY or NEW_BLOCK" },
                      note: { type: "string", description: "Short note for ENRICH (≤140 chars)" },
                      reason: { type: "string", description: "Why this classification (≤80 chars)" },
                    },
                    required: ["action"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["suggestions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "apply_suggestions" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI classification failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : { suggestions: [] };
    const suggestions: Array<{ action: string; blockId?: string; title?: string; note?: string; reason?: string }> =
      Array.isArray(args.suggestions) ? args.suggestions : [];

    // Enforce caps
    let activityCount = 0;
    let newBlockCount = 0;
    const updated: StructureNode[] = JSON.parse(JSON.stringify(structure));
    const applied: any[] = [];

    const findBlock = (id: string) => updated.find(b => b.id === id);

    for (const s of suggestions) {
      if (s.action === "ENRICH" && s.blockId && s.note) {
        const block = findBlock(s.blockId);
        if (block) {
          const existingNotes = block.notes || "";
          const sep = existingNotes ? "\n• " : "• ";
          block.notes = (existingNotes + sep + s.note).slice(0, 600);
          applied.push({ action: "ENRICH", blockId: s.blockId, note: s.note });
        }
      } else if (s.action === "ADD_ACTIVITY" && s.blockId && s.title && activityCount < 3) {
        const block = findBlock(s.blockId);
        if (block) {
          block.children.push({
            id: genId(),
            title: s.title,
            status: "not_started",
            importance: "medium",
            children: [],
            source: "builder_team",
            pending_review: true,
          });
          activityCount++;
          applied.push({ action: "ADD_ACTIVITY", blockId: s.blockId, title: s.title });
        }
      } else if (s.action === "NEW_BLOCK" && s.title && newBlockCount < 1) {
        updated.push({
          id: genId(),
          title: s.title,
          status: "not_started",
          importance: "medium",
          children: [],
          source: "builder_team",
          pending_review: true,
        });
        newBlockCount++;
        applied.push({ action: "NEW_BLOCK", title: s.title });
      }
    }

    if (applied.length > 0) {
      const { error: updErr } = await supabase
        .from("integrator_projects")
        .update({ project_structure: updated })
        .eq("id", projectId);

      if (updErr) {
        console.error("Failed to update project_structure:", updErr);
        return new Response(JSON.stringify({ error: "Failed to save structure" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, applied, count: applied.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-builder-insights-to-structure error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
