import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const mentorSkillFocus: Record<string, string> = {
  mamba_mentor: "discipline",
  creative_visionary: "creativity",
  quantum_inventor: "innovation",
  ancient_sage: "wisdom",
  compassionate_elder: "empathy",
  business_mentor: "strategy",
  creator_mentor: "storytelling",
  mystic_mentor: "intuition",
  heart_mentor: "connection",
  strategist_mentor: "planning",
  explorer_mentor: "courage",
  future_self: "vision",
};

const mentorBadges: Record<string, { name: string; icon: string }> = {
  mamba_mentor: { name: "Discipline Master", icon: "🏆" },
  creative_visionary: { name: "Creative Genius", icon: "🎨" },
  quantum_inventor: { name: "Innovation Pioneer", icon: "🔬" },
  ancient_sage: { name: "Wisdom Keeper", icon: "📿" },
  compassionate_elder: { name: "Empathy Guide", icon: "💝" },
  business_mentor: { name: "Strategic Mind", icon: "💼" },
  creator_mentor: { name: "Storytelling Ace", icon: "📖" },
  mystic_mentor: { name: "Intuitive Master", icon: "🔮" },
  heart_mentor: { name: "Connection Expert", icon: "💕" },
  strategist_mentor: { name: "Master Planner", icon: "🗂️" },
  explorer_mentor: { name: "Courage Champion", icon: "🗺️" },
  future_self: { name: "Visionary Leader", icon: "⭐" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chatHistory, mentorType } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Format chat history for AI
    const conversationText = chatHistory
      .map((msg: any) => `${msg.role === "user" ? "User" : "Mentor"}: ${msg.content}`)
      .join("\n\n");

    const skillFocus = mentorSkillFocus[mentorType] || "growth";
    const badge = mentorBadges[mentorType] || { name: "Learning Badge", icon: "📚" };

    // Generate learning module using AI
    const systemPrompt = `You are creating a learning module for a mentor chat session.

Your task:
1. Summarize the key lessons from this conversation (2-3 sentences)
2. Extract ONE core insight (1 sentence, powerful and memorable)
3. Generate 3 quiz questions to test understanding
   - Each question should have 4 multiple choice options
   - Questions should test comprehension of the mentor's teachings
   - Mix difficulty levels (easy, medium, hard)

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Brief summary of the conversation...",
  "coreInsight": "One powerful takeaway...",
  "quizQuestions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0
    }
  ]
}`;

    const userPrompt = `Create a learning module for this chat session focused on "${skillFocus}":

${conversationText}

Remember: Return ONLY the JSON object, no other text.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errorText);
      throw new Error("Failed to generate learning module");
    }

    const aiData = await aiResponse.json();
    let moduleContent = aiData.choices[0].message.content;

    // Clean up JSON response (remove markdown code blocks if present)
    moduleContent = moduleContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let moduleData;
    try {
      moduleData = JSON.parse(moduleContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", moduleContent);
      throw new Error("Invalid module format from AI");
    }

    // Add badge and skill info
    const finalModule = {
      ...moduleData,
      skillFocus,
      badgeName: badge.name,
      badgeIcon: badge.icon,
    };

    return new Response(
      JSON.stringify({ module: finalModule }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-learning-module:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
