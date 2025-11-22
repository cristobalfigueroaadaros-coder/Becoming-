import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { messages, userId } = await req.json();

    if (!userId || !messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Count user responses (excluding assistant messages)
    const userResponses = messages.filter((m: Message) => m.role === 'user').length;
    
    // Determine if discovery is complete (after 4-5 questions)
    const isComplete = userResponses >= 4;

    let nextQuestion = null;
    let dotsCreated = 0;

    if (!isComplete) {
      // Generate next discovery question
      const questionPrompt = `You are guiding someone through purpose discovery. Based on their responses, ask ONE insightful follow-up question that helps uncover their life purpose. Questions to explore:
${userResponses === 1 ? "- What challenges or problems do they feel compelled to solve?" : ""}
${userResponses === 2 ? "- What unique talents or perspectives do they have that others recognize?" : ""}
${userResponses === 3 ? "- What would they do even if they weren't paid for it?" : ""}
${userResponses === 4 ? "- What impact do they want to have on the world in 10 years?" : ""}

Previous conversation:
${messages.map((m: Message) => `${m.role}: ${m.content}`).join('\n')}

Ask ONE clear, thought-provoking question.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: questionPrompt }],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("AI API error:", aiResponse.status, errorText);
        throw new Error(`AI API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      nextQuestion = aiData.choices[0].message.content;
    } else {
      // Extract insights and create constellation nodes
      const insightExtractionPrompt = `Analyze this purpose discovery conversation and extract 3-4 key insights as constellation nodes. For each insight, provide:
- A concise core theme (2-4 words)
- The insight text (1-2 sentences capturing the essence)
- Relevant skill tags
- Emotional tone (one of: breakthrough, transformative, peaceful, energized, determined, reflective, inspired, grounded, curious, focused, hopeful, empowered)

Conversation:
${messages.map((m: Message) => `${m.role}: ${m.content}`).join('\n')}

Return as JSON array: [{"coreTheme": "...", "insightText": "...", "skillTags": ["..."], "emotionalTone": "..."}]`;

      const extractResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: insightExtractionPrompt }],
        }),
      });

      if (!extractResponse.ok) {
        throw new Error("Failed to extract insights");
      }

      const extractData = await extractResponse.json();
      const responseText = extractData.choices[0].message.content;
      
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }
      
      const insights = JSON.parse(jsonMatch[0]);

      // Create insight dots for each extracted insight
      for (const insight of insights) {
        const { error: dotError } = await supabaseClient
          .from("insight_dots")
          .insert({
            user_id: userId,
            source_type: "Purpose Discovery",
            source_mentor: "future_self",
            insight_text: insight.insightText,
            core_theme: insight.coreTheme,
            skill_tags: insight.skillTags || [],
            emotional_tone: insight.emotionalTone || "reflective",
          });

        if (!dotError) {
          dotsCreated++;
        } else {
          console.error("Error creating dot:", dotError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        complete: isComplete,
        nextQuestion,
        dotsCreated 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in purpose-discovery:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
