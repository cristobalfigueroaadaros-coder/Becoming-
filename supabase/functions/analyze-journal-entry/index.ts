import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { journalEntryId, content, userId } = await req.json();

    if (!journalEntryId || !content || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing journalEntryId, content, or userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const systemPrompt = `You are an AI that analyzes personal journal entries to detect emotions, patterns, and themes.
Your analysis helps personalize guidance for the user's self-discovery journey.

Analyze the journal entry and extract:
1. Emotions: The primary emotions expressed (joy, sadness, anxiety, hope, frustration, gratitude, etc.)
2. Patterns: Recurring behavioral or thought patterns (procrastination, self-doubt, overthinking, momentum, etc.)
3. Themes: Life themes mentioned (work, relationships, health, creativity, growth, purpose, etc.)

Return a JSON object with:
{
  "emotions": [
    { "emotion": "string", "intensity": "low" | "medium" | "high" }
  ],
  "patterns": [
    { "pattern": "string", "type": "positive" | "negative" | "neutral", "description": "brief explanation" }
  ],
  "themes": [
    { "theme": "string", "relevance": 0.0 to 1.0 }
  ],
  "overall_tone": "positive" | "negative" | "mixed" | "reflective" | "transformative"
}`;

    console.log("Analyzing journal entry...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this journal entry:\n\n${content}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_journal",
              description: "Analyze journal entry for emotions, patterns, and themes",
              parameters: {
                type: "object",
                properties: {
                  emotions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        emotion: { type: "string" },
                        intensity: { type: "string", enum: ["low", "medium", "high"] },
                      },
                      required: ["emotion", "intensity"],
                    },
                  },
                  patterns: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pattern: { type: "string" },
                        type: { type: "string", enum: ["positive", "negative", "neutral"] },
                        description: { type: "string" },
                      },
                      required: ["pattern", "type", "description"],
                    },
                  },
                  themes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        theme: { type: "string" },
                        relevance: { type: "number" },
                      },
                      required: ["theme", "relevance"],
                    },
                  },
                  overall_tone: {
                    type: "string",
                    enum: ["positive", "negative", "mixed", "reflective", "transformative"],
                  },
                },
                required: ["emotions", "patterns", "themes", "overall_tone"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_journal" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    console.log("AI response:", JSON.stringify(aiData, null, 2));

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.log("No tool call in response");
      return new Response(
        JSON.stringify({ error: "Failed to analyze journal entry" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log("Analysis result:", analysis);

    // Update the journal entry with detected analysis
    const { error: updateError } = await supabase
      .from("daily_journal")
      .update({
        detected_emotions: analysis.emotions,
        detected_patterns: analysis.patterns,
        detected_themes: analysis.themes,
      })
      .eq("id", journalEntryId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating journal entry:", updateError);
      throw updateError;
    }

    console.log("Updated journal entry with analysis");

    // Check for significant patterns that could trigger discoveries
    const significantPatterns = analysis.patterns.filter(
      (p: { type: string }) => p.type === "positive"
    );

    // If there are significant positive patterns, save as discoveries
    for (const pattern of significantPatterns) {
      const { data: existing } = await supabase
        .from("becoming_discoveries")
        .select("id")
        .eq("user_id", userId)
        .eq("discovery_type", "pattern")
        .eq("element_key", pattern.pattern.toLowerCase().replace(/\s+/g, "_"))
        .single();

      if (!existing) {
        await supabase.from("becoming_discoveries").insert({
          user_id: userId,
          discovery_type: "pattern",
          element_key: pattern.pattern.toLowerCase().replace(/\s+/g, "_"),
          element_value: pattern.description,
          source: "journal_analysis",
          source_message_id: journalEntryId,
        });
        console.log(`Saved pattern discovery: ${pattern.pattern}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        patternsSaved: significantPatterns.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in analyze-journal-entry:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
