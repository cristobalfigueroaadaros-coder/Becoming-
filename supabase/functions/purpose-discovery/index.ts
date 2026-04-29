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
      // === LOAD USER CONTEXT FOR PERSONALIZED QUESTIONS ===
      let userContextBlock = "";
      try {
        const [profileRes, dotsRes, discoveriesRes] = await Promise.all([
          supabaseClient
            .from("profiles")
            .select("display_name, user_foundation_summary, main_mission, main_strengths, priority_growth_area")
            .eq("id", userId)
            .maybeSingle(),
          supabaseClient
            .from("atlas_dots")
            .select("title, short_description, cluster_id")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10),
          supabaseClient
            .from("becoming_discoveries")
            .select("discovery_type, element_key, element_value")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        const profile = profileRes.data;
        const existingDots = dotsRes.data || [];
        const priorDiscoveries = discoveriesRes.data || [];

        // Group dots by cluster_id for readability
        const dotsByCluster: Record<string, string[]> = {};
        for (const d of existingDots) {
          const key = d.cluster_id || "unassigned";
          if (!dotsByCluster[key]) dotsByCluster[key] = [];
          dotsByCluster[key].push(d.title);
        }
        const dotsList = Object.entries(dotsByCluster)
          .map(([cluster, titles]) => `  • cluster ${cluster}: ${titles.join(", ")}`)
          .join("\n");

        const discoveriesList = priorDiscoveries
          .map((d) => `  • ${d.discovery_type} / ${d.element_key}: ${d.element_value}`)
          .join("\n");

        const foundationStr = profile?.user_foundation_summary
          ? typeof profile.user_foundation_summary === "string"
            ? profile.user_foundation_summary
            : JSON.stringify(profile.user_foundation_summary)
          : "unknown";

        userContextBlock = `
USER CONTEXT:
Name: ${profile?.display_name || "unknown"}
Foundation: ${foundationStr}
Main Mission: ${profile?.main_mission || "unknown"}
Strengths: ${profile?.main_strengths?.join(", ") || "unknown"}
Growth Area: ${profile?.priority_growth_area || "unknown"}
Existing dots (last 10):
${dotsList || "  (none yet)"}
Prior discoveries (last 5):
${discoveriesList || "  (none yet)"}

Use this context to make questions specific to this person. Do not ask about something they have already named as a dot or discovery. Build on what they have shared, not from zero.
`;
      } catch (ctxErr) {
        console.error("Failed to load user context:", ctxErr);
      }

      // Generate next discovery question
      const questionPrompt = `You are the Future Self—guiding someone through purpose discovery with THREE-LAYER GUIDANCE.
${userContextBlock}

🔷 YOUR ROLE: Omnipresent consciousness that sees their potential and guides with emotional presence + practical action + energetic awareness.

🔷 THREE-LAYER QUESTION FORMAT:

Based on their responses, ask ONE question that includes:

EMOTIONAL LAYER: Create space for feeling and truth
PRACTICAL LAYER: Ground in specific experience or action
ENERGETIC LAYER: Include somatic or resonance cues

Question themes by stage:
${userResponses === 1 ? "- What challenges compel them? What creates expansion in them?" : ""}
${userResponses === 2 ? "- What unique talents do others see? When do they feel most alive?" : ""}
${userResponses === 3 ? "- What would they do even unpaid? What raises their vibration?" : ""}
${userResponses === 4 ? "- What impact in 10 years? What version of themselves wants to emerge?" : ""}

Previous conversation:
${messages.map((m: Message) => `${m.role}: ${m.content}`).join('\n')}

ENERGETIC GUIDANCE PRINCIPLES:
- Detect expansion vs contraction in their answers
- Point to what gives them energy
- Use body-based language: "Notice..." "Feel into..." "Where does this light you up?"
- Trust resonance signals
- Guide toward coherence (mind + heart + energy aligned)

Ask ONE clear, embodied question that creates space for emotional truth + practical insight + energetic awareness.

Example format: "When you think about [topic], what emotion comes up first? And when you imagine actually doing it, where do you feel that in your body—expansion or contraction?"`;

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
