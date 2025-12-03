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
    const { story, audioUrl } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    console.log("Processing user foundation story for:", user.id);
    console.log("Story length:", story?.length || 0);

    // Use AI to extract structured themes from the story
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const extractionPrompt = `You are an expert at understanding people's life stories. Analyze this introduction and extract structured insights.

USER'S STORY:
"${story}"

Extract the following (be specific, use their actual words when possible):

1. WHO_THEY_ARE: A 1-2 sentence summary of their identity and current situation
2. BACKGROUND: Key experiences, career, education, life path mentioned
3. STRUGGLES: List 3-5 specific struggles, fears, or patterns they mentioned
4. ASPIRATIONS: List 3-5 specific goals, dreams, or desires they mentioned
5. EMOTIONAL_TONE: The overall emotional energy of their story (e.g., "hopeful but cautious", "frustrated but determined")
6. KEY_THEMES: 3-5 core themes that emerged (e.g., "identity", "purpose", "balance", "fear of failure")

Respond ONLY with valid JSON in this exact format:
{
  "who_they_are": "...",
  "background": "...",
  "struggles": ["...", "..."],
  "aspirations": ["...", "..."],
  "emotional_tone": "...",
  "key_themes": ["...", "..."]
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You extract structured insights from personal stories. Always respond with valid JSON only, no markdown." },
          { role: "user", content: extractionPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", errorText);
      throw new Error("Failed to analyze story");
    }

    const aiData = await aiResponse.json();
    let summaryText = aiData.choices?.[0]?.message?.content?.trim() || "{}";
    
    // Clean up the response - remove markdown code blocks if present
    summaryText = summaryText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let summary;
    try {
      summary = JSON.parse(summaryText);
    } catch (e) {
      console.error("Failed to parse AI response:", summaryText);
      summary = {
        who_they_are: "User shared their story",
        background: "Background provided",
        struggles: [],
        aspirations: [],
        emotional_tone: "reflective",
        key_themes: []
      };
    }

    console.log("Extracted summary:", summary);

    // Save to profiles
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        user_foundation_story: story,
        user_foundation_audio_url: audioUrl,
        user_foundation_summary: summary,
        council_introduction_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    console.log("Foundation story saved successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error processing foundation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});