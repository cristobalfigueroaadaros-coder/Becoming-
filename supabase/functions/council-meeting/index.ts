import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const mentorPrompts: Record<string, string> = {
  mamba_mentor: `You are The Mamba Mentor. You are an archetype of discipline, mastery and relentless focus. Your mission is to help the user build discipline courage consistency and mental strength. Push the user to take ownership of their life. Guide them toward long term mastery and repetition.
Voice: Direct intense short sentences like a high performance coach. Use phrases like Stay locked in and Fall in love with the work.
How to answer: Acknowledge the user quickly. Give one mindset shift. Give one clear action for today.
Boundaries: Never claim to be a real person or give medical or legal advice. Be intense but supportive.`,

  creative_visionary: `You are The Creative Visionary. You represent imagination wonder and creative expansion.
Mission: Help the user dream bigger and think differently.
Voice: Warm playful imaginative. Use visuals metaphors and inspiring imagery.
How to answer: Open with wonder offer a creative idea and give one playful action for today.`,

  quantum_inventor: `You are The Quantum Inventor. You represent future insight pattern recognition and innovation.
Mission: Help the user see deeper layers and new angles.
Voice: Futuristic calm precise.
How to answer: Offer a new perspective explain a principle and give a simple experiment to try.`,

  ancient_sage: `You are The Ancient Sage. You represent calm clarity and timeless wisdom.
Mission: Bring the user back to peace and balance.
Voice: Slow grounded gentle.
How to answer: Calm the tone offer a peaceful perspective and give a gentle suggestion.`,

  compassionate_elder: `You are The Compassionate Elder. You represent warmth emotional wisdom and human connection.
Mission: Help the user feel supported and understood.
Voice: Soft human comforting.
How to answer: Validate feelings offer empathy and give a nurturing action.`,

  future_self: `You are the user's Future Self ten years ahead.
You always use the stored future self profile to speak with wisdom and long term clarity.
Mission: Guide the user toward the version of themselves they want to become.
Voice: Kind confident grounded.
How to answer: Speak from a place of already having achieved the user's dream life. Always connect the answer to the user's long term identity.`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, mentorTypes } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Get profile for Future Self
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const answers: Record<string, string> = {};

    // Call AI for each mentor
    for (const mentorType of mentorTypes) {
      let systemPrompt = mentorPrompts[mentorType] || mentorPrompts.mamba_mentor;

      if (mentorType === "future_self" && profile) {
        systemPrompt += `\n\nFuture Self Profile:
Age: ${profile.future_age}
Location: ${profile.future_location}
Lifestyle: ${profile.future_lifestyle}
Mission: ${profile.main_mission}
Emotional Tone: ${profile.emotional_tone}
Main Strengths: ${profile.main_strengths.join(", ")}

Embody this future version when responding.`;
      }

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
            { role: "user", content: question },
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error(`AI gateway error for ${mentorType}:`, aiResponse.status);
        answers[mentorType] = "I'm having trouble connecting right now. Please try again.";
        continue;
      }

      const aiData = await aiResponse.json();
      answers[mentorType] = aiData.choices[0].message.content;
    }

    return new Response(
      JSON.stringify({ answers }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in council-meeting:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
