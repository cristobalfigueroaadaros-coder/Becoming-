import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Block configuration for detection - maps to the Purpose to Value Map
const VALUE_MAP_BLOCKS = {
  purpose: {
    key: "purpose",
    title: "Purpose",
    description: "Why this matters to me",
    triggers: ["purpose", "why", "meaning", "mission", "calling", "reason", "matter", "important"],
    detectPrompt: "User is explaining why something matters to them, their purpose, or deeper meaning behind their work/idea."
  },
  strengths: {
    key: "strengths",
    title: "Strengths",
    description: "What I'm naturally good at",
    triggers: ["good at", "strength", "talent", "natural", "skill", "gifted", "excel", "best at"],
    detectPrompt: "User is describing what they're naturally good at, their talents, or skills."
  },
  audience: {
    key: "audience",
    title: "Who This Is For",
    description: "People, groups, communities",
    triggers: ["for", "people", "who", "target", "audience", "help", "serve", "clients", "customers", "community"],
    detectPrompt: "User is describing who they want to help or serve - a specific group, demographic, or community."
  },
  problems: {
    key: "problems",
    title: "What They're Struggling With",
    description: "Top 1-3 problems they face",
    triggers: ["struggle", "pain", "problem", "hard", "difficult", "frustrated", "broken", "challenge", "stuck"],
    detectPrompt: "User is describing problems, struggles, or pain points that their audience faces."
  },
  impact: {
    key: "impact",
    title: "Impact Reflection",
    description: "How does this help them feel?",
    triggers: ["feel", "change", "transform", "help", "better", "impact", "difference", "empowered"],
    detectPrompt: "User is describing how their work/idea would make people feel or what change it creates."
  },
  solution: {
    key: "solution",
    title: "Solution / Expression",
    description: "What I'm creating",
    triggers: ["create", "build", "making", "product", "service", "offer", "solution", "tool", "platform", "app"],
    detectPrompt: "User is describing what they're creating - a product, service, tool, experience, etc."
  },
  value_prop: {
    key: "value_prop",
    title: "Value Proposition",
    description: "How this helps them",
    triggers: ["helps", "benefit", "value", "unique", "different", "special", "offer"],
    detectPrompt: "User is describing the unique value or benefit their solution provides."
  },
  channels: {
    key: "channels",
    title: "Channels",
    description: "How it reaches people",
    triggers: ["reach", "channel", "distribute", "share", "platform", "social", "email", "marketing"],
    detectPrompt: "User is describing how they would reach or distribute their solution to people."
  },
  relationship: {
    key: "relationship",
    title: "Relationship",
    description: "How I stay connected",
    triggers: ["connect", "relationship", "community", "engage", "retain", "loyal", "follow"],
    detectPrompt: "User is describing how they would maintain relationships with their audience."
  },
  revenue: {
    key: "revenue",
    title: "Revenue / Value Exchange",
    description: "How this sustains me",
    triggers: ["money", "revenue", "price", "charge", "income", "sustain", "business model", "paid"],
    detectPrompt: "User is describing how their solution would generate income or sustain them."
  },
  activities: {
    key: "activities",
    title: "Key Activities",
    description: "What I must do consistently",
    triggers: ["do", "activity", "daily", "routine", "action", "task", "habit", "consistently"],
    detectPrompt: "User is describing key activities they need to do consistently."
  },
  resources: {
    key: "resources",
    title: "Key Resources",
    description: "What supports this creation",
    triggers: ["need", "resource", "support", "tool", "team", "asset", "require"],
    detectPrompt: "User is describing resources, tools, or support they need."
  },
  costs: {
    key: "costs",
    title: "Cost / Energy Awareness",
    description: "What this requires from me",
    triggers: ["cost", "energy", "effort", "sacrifice", "investment", "time", "require"],
    detectPrompt: "User is describing what this work requires from them in terms of energy, time, or investment."
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationType, mentorType } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Get current value map blocks to see what's already filled
    const { data: existingBlocks } = await supabaseClient
      .from("value_map_blocks")
      .select("block_key, content, is_unlocked")
      .eq("user_id", user.id);

    const filledBlocks = new Set(
      existingBlocks?.filter(b => b.content && b.content.trim().length > 10).map(b => b.block_key) || []
    );

    // Quick keyword-based pre-filter to identify potential blocks
    const lowerMessage = message.toLowerCase();
    const potentialBlocks: string[] = [];
    
    for (const [key, config] of Object.entries(VALUE_MAP_BLOCKS)) {
      // Skip already filled blocks - we want to discover NEW insights
      if (filledBlocks.has(key)) continue;
      
      const hasKeyword = config.triggers.some(trigger => lowerMessage.includes(trigger));
      if (hasKeyword) {
        potentialBlocks.push(key);
      }
    }

    // If no potential blocks detected by keywords, return null
    if (potentialBlocks.length === 0) {
      console.log("No value map patterns detected in message");
      return new Response(
        JSON.stringify({ detection: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to analyze the message and extract structured content
    const blocksToAnalyze = potentialBlocks.map(key => VALUE_MAP_BLOCKS[key as keyof typeof VALUE_MAP_BLOCKS]);
    
    const analysisPrompt = `Analyze this user message to detect if they are naturally answering any of these Purpose-to-Value Map questions:

USER MESSAGE:
"${message}"

POSSIBLE BLOCKS TO DETECT:
${blocksToAnalyze.map(b => `- ${b.key}: ${b.description} (${b.detectPrompt})`).join('\n')}

CONVERSATION CONTEXT: ${conversationType || 'general'} ${mentorType ? `with ${mentorType}` : ''}

TASK:
1. Determine if the user's message naturally answers any of these blocks
2. Only detect if there's a CLEAR, SPECIFIC answer (not vague)
3. Extract the content in a clean, refined way (not just copying their words)
4. Return ONLY ONE detection (the strongest/clearest one)

RESPOND IN EXACTLY THIS JSON FORMAT (no markdown, no code blocks):
{
  "detected": true/false,
  "blockKey": "the_block_key or null",
  "suggestedContent": "A refined, clear version of what they said (30-80 words max)",
  "confidence": 0.0-1.0,
  "reasoning": "One sentence explaining why this was detected"
}

EXAMPLES OF GOOD DETECTIONS:
- "Women between 30 and 35 who practice yoga" → audience block, high confidence
- "I want to help burned out entrepreneurs find their passion again" → audience + impact blocks (pick strongest)
- "I'm building an app that tracks daily habits" → solution block, high confidence

EXAMPLES OF BAD DETECTIONS (DO NOT DETECT):
- Vague statements like "I want to help people" (too generic)
- Philosophical musings without specifics
- Questions rather than statements

Only return the JSON, nothing else.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: analysisPrompt }],
      }),
    });

    if (!response.ok) {
      console.error("AI Gateway error:", await response.text());
      return new Response(
        JSON.stringify({ detection: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const rawContent = aiData.choices[0].message.content;
    
    // Parse JSON from response (handle markdown code blocks if present)
    let parsed;
    try {
      const jsonStr = rawContent.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(
        JSON.stringify({ detection: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only return detection if confidence is high enough
    if (!parsed.detected || parsed.confidence < 0.7 || !parsed.blockKey) {
      console.log("Detection below threshold or no block detected:", parsed);
      return new Response(
        JSON.stringify({ detection: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const blockConfig = VALUE_MAP_BLOCKS[parsed.blockKey as keyof typeof VALUE_MAP_BLOCKS];
    if (!blockConfig) {
      return new Response(
        JSON.stringify({ detection: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Value Map Detection: ${parsed.blockKey} (confidence: ${parsed.confidence})`);

    return new Response(
      JSON.stringify({
        detection: {
          blockKey: parsed.blockKey,
          blockTitle: blockConfig.title,
          blockDescription: blockConfig.description,
          suggestedContent: parsed.suggestedContent,
          confidence: parsed.confidence,
          reasoning: parsed.reasoning,
          source: conversationType || "conversation",
          mentorType: mentorType || null
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in detect-value-map-insights:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ detection: null, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
