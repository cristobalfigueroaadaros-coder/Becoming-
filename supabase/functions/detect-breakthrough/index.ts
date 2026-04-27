import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Specificity signals that indicate a concrete, named idea
const SPECIFICITY_SIGNALS = [
  "called", "named", "workshop", "program", "course", "service", "app",
  "platform", "toolkit", "coaching", "consulting", "framework", "method",
  "makeover", "retreat", "bootcamp", "academy", "club", "community"
];

// Crystallization signals - user is landing on something
const CRYSTALLIZATION_SIGNALS = [
  "this is it", "i want to", "i'm going to", "i realize", "that's what",
  "money mindset", "financial", "it could be", "what if i", "i could create"
];

// Calculate readiness score for breakthrough detection
function calculateReadinessScore(
  messages: Array<{ role: string; content: string }>,
  conversationDepth: number
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  
  // Minimum conversation depth (at least 6 user messages)
  if (conversationDepth >= 6) {
    score += 20;
    reasons.push(`Conversation depth: ${conversationDepth}`);
  } else if (conversationDepth >= 4) {
    score += 10;
    reasons.push(`Moderate depth: ${conversationDepth}`);
  }
  
  // Check last 6 messages for specificity signals
  const recentMessages = messages.slice(-6);
  const allRecentText = recentMessages.map(m => m.content.toLowerCase()).join(" ");
  
  for (const signal of SPECIFICITY_SIGNALS) {
    if (allRecentText.includes(signal)) {
      score += 15;
      reasons.push(`Specificity signal: "${signal}"`);
    }
  }
  
  // Check for crystallization signals
  for (const signal of CRYSTALLIZATION_SIGNALS) {
    if (allRecentText.includes(signal)) {
      score += 10;
      reasons.push(`Crystallization signal: "${signal}"`);
    }
  }
  
  // Check for quoted/named things (strong signal)
  const quotedThings = allRecentText.match(/"[^"]+"/g) || [];
  if (quotedThings.length > 0) {
    score += 25;
    reasons.push(`Named concept: ${quotedThings.join(", ")}`);
  }
  
  // Check for numbers (target demographics, etc.)
  const userMessages = recentMessages.filter(m => m.role === "user");
  const userText = userMessages.map(m => m.content).join(" ");
  const numbers = userText.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    score += 10;
    reasons.push(`Specific numbers mentioned`);
  }
  
  return { score, reasons };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversation, mentorType, userContext, conversationDepth, forceCheck } = await req.json();

    // Resolve user from auth header (best-effort — do not block detection)
    let userId: string | null = null;
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user } } = await supabaseClient.auth.getUser();
        userId = user?.id ?? null;
      }
    } catch (authErr) {
      console.error("Auth resolve failed:", authErr);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Parse conversation into messages if it's a string
    const messages: Array<{ role: string; content: string }> = 
      typeof conversation === 'string' 
        ? [{ role: 'user', content: conversation }]
        : conversation;
    
    const depth = conversationDepth || messages.filter(m => m.role === 'user').length;
    
    // Calculate readiness score
    const { score: readinessScore, reasons } = calculateReadinessScore(messages, depth);
    console.log(`Breakthrough readiness score: ${readinessScore}, reasons:`, reasons);
    
    // Minimum readiness score required (unless forced)
    const MIN_READINESS = forceCheck ? 30 : 50;
    if (readinessScore < MIN_READINESS) {
      console.log(`Readiness score ${readinessScore} below threshold ${MIN_READINESS}, skipping detection`);
      return new Response(
        JSON.stringify({ 
          detected: false, 
          reasoning: `Not ready for breakthrough detection (score: ${readinessScore}/${MIN_READINESS})`,
          readinessScore
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format conversation for analysis
    const conversationText = messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const systemPrompt = `You are an AI that detects BREAKTHROUGH MOMENTS in mentor conversations.

A REAL breakthrough is when a user crystallizes:
- A SPECIFIC, NAMED product/service/program idea (e.g., "Money Mindset Makeovers")
- A clear business concept with DEFINED target audience (e.g., "burned out entrepreneurs ages 35-50")
- A concrete creative project with specific scope
- An actionable life change decision with clear next steps
- A synthesized insight combining their SPECIFIC background + new perspective

CRITICAL - NOT a breakthrough (DO NOT DETECT):
- Vague ideas ("maybe I could help people")
- General discussions without concrete outcomes
- Questions without answers
- Emotional processing without specific action
- Generic aspirations ("I want to make a difference")
- Still exploring/unsure language ("I'm not sure but maybe...")
- Early conversation exploration (first 5-6 exchanges)

USER CONTEXT:
Mission: ${userContext?.mission || "Not specified"}
Background: ${JSON.stringify(userContext?.foundation || {})}
Conversation Depth: ${depth} exchanges
Readiness Score: ${readinessScore} (reasons: ${reasons.join(", ")})

ANALYZE THIS CONVERSATION:
${conversationText}

DETECTION CRITERIA (ALL must be true):
1. User has a NAMED concept (e.g., "Money Mindset Makeovers", "Financial Compass")
2. User has a SPECIFIC target (e.g., "women 30-35", "burned out entrepreneurs")
3. User has a CLEAR approach (e.g., "combining empathy with financial guidance")
4. User sounds CERTAIN, not questioning ("I want to" vs "maybe I could")
5. Conversation shows PROGRESSION from vague to specific

RESPOND IN JSON FORMAT ONLY:
{
  "detected": true/false,
  "breakthrough": {
    "title": "Short, catchy name for the idea (max 50 chars) - USE THEIR WORDS if they named it",
    "description": "1-2 sentence description of what this is, including target audience",
    "next_step": "One concrete action they could take today"
  },
  "reasoning": "Why this qualifies as a breakthrough (or why not)"
}

If no breakthrough detected, respond:
{
  "detected": false,
  "reasoning": "Why no breakthrough was detected (be specific about what's missing)"
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
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analyze the conversation for breakthroughs." }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices[0].message.content;

    // Clean up the response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      const result = JSON.parse(content);
      result.readinessScore = readinessScore;
      console.log("Breakthrough detection result:", result);

      // === SAVE TO atlas_breakthroughs (best-effort) ===
      if (result.detected && result.breakthrough && userId && readinessScore >= 50) {
        try {
          const adminClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
          );
          const bt = result.breakthrough;
          const { error: insertError } = await adminClient
            .from("atlas_breakthroughs")
            .insert({
              user_id: userId,
              concept_name: bt.title || "Untitled breakthrough",
              target_audience: bt.target_audience || bt.targetAudience || null,
              approach: bt.approach || bt.description || null,
              first_step: bt.next_step || bt.first_step || bt.firstStep || null,
              readiness_score: readinessScore,
              conversation_depth: depth,
              source_mentor_type: mentorType ?? null,
            });
          if (insertError) {
            console.error("Failed to insert atlas_breakthrough:", insertError);
          }
        } catch (insertErr) {
          console.error("atlas_breakthroughs insert threw:", insertErr);
        }
      }

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ detected: false, reasoning: "Failed to parse response", readinessScore }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Breakthrough detection error:", error);
    return new Response(
      JSON.stringify({ error: error.message, detected: false }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
