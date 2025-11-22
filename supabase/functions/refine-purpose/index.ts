import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { purposePath, answers } = await req.json();

    if (!purposePath || !answers) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format answers for AI context
    const formattedAnswers = Object.entries(answers)
      .map(([key, value]) => {
        if (typeof value === "object" && value !== null) {
          return `${key}: ${JSON.stringify(value, null, 2)}`;
        }
        return `${key}: ${value}`;
      })
      .join("\n\n");

    const pathContext = {
      has_purpose: "This person already has a clear purpose and wants to grow from it",
      discovering_purpose: "This person is on a journey of self-discovery to find their purpose",
      has_goal: "This person has specific goals they're working toward",
      not_sure: "This person is exploring and seeking guidance"
    };

    const systemPrompt = `You are an expert life purpose coach who helps people crystallize their life mission into clear, powerful purpose statements. Analyze the user's responses and create focused, actionable purpose statements.

IMPORTANT: Return ONLY valid JSON with this exact structure:
{
  "refinedPurposes": [
    {
      "statement": "string - a powerful, clear purpose statement",
      "rationale": "string - why this captures their essence",
      "focus": "string - the primary theme (e.g., 'Impact', 'Creation', 'Service', 'Growth')"
    }
  ],
  "keyThemes": ["string - 3-5 recurring themes from their answers"],
  "strengthsIdentified": ["string - 3-5 core strengths evident in their responses"],
  "nextSteps": ["string - 3-4 concrete actions to live this purpose"],
  "insights": "string - deeper insight about their journey"
}

Generate 3-4 different purpose statement options, each capturing different angles of their journey.`;

    const userPrompt = `Path Context: ${pathContext[purposePath as keyof typeof pathContext]}

User's Discovery Answers:
${formattedAnswers}

Based on these responses, create refined purpose statement options that are:
- Clear and actionable (not vague or generic)
- Personal and authentic (reflecting their unique voice)
- Inspiring yet grounded (ambitious but achievable)
- Future-oriented (pointing toward growth and impact)

Each purpose statement should be 1-2 sentences maximum.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Calling AI for purpose refinement...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const refinement = JSON.parse(aiData.choices[0].message.content);

    console.log("Purpose refinement generated successfully");

    return new Response(JSON.stringify({ refinement }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in refine-purpose:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
