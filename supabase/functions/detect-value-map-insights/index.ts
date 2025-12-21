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

// Specificity signals - indicate concrete vs vague thinking
const SPECIFICITY_SIGNALS = [
  "between", "specifically", "exactly", "called", "named", "age", "years old",
  "who are", "people who", "targeting", "for example", "such as", "like the",
  "workshop", "course", "app", "service", "program", "coaching", "consulting"
];

// Calculate specificity score of a message
function calculateSpecificityScore(message: string): number {
  const lowerMessage = message.toLowerCase();
  let score = 0;
  
  for (const signal of SPECIFICITY_SIGNALS) {
    if (lowerMessage.includes(signal)) {
      score += 1;
    }
  }
  
  // Bonus for numbers (ages, prices, etc.)
  const numbers = message.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    score += Math.min(numbers.length, 2);
  }
  
  // Bonus for quoted/named things
  const quotedThings = message.match(/"[^"]+"/g);
  if (quotedThings && quotedThings.length > 0) {
    score += quotedThings.length * 2;
  }
  
  return score;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationType, mentorType, conversationDepth } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Get conversation depth if not provided
    let depth = conversationDepth || 0;
    if (!conversationDepth && mentorType) {
      const { count } = await supabaseClient
        .from("chats")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("mentor_type", mentorType)
        .eq("role", "user");
      depth = count || 0;
    }

    // CRITICAL: Don't detect in early conversations - user is still exploring
    const MIN_DEPTH_FOR_DETECTION = 6;
    if (depth < MIN_DEPTH_FOR_DETECTION) {
      console.log(`Skipping detection: conversation depth ${depth} < ${MIN_DEPTH_FOR_DETECTION}`);
      return new Response(
        JSON.stringify({ detection: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate specificity score - require concrete content
    const specificityScore = calculateSpecificityScore(message);
    const MIN_SPECIFICITY = 2;
    if (specificityScore < MIN_SPECIFICITY) {
      console.log(`Skipping detection: specificity score ${specificityScore} < ${MIN_SPECIFICITY}`);
      return new Response(
        JSON.stringify({ detection: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    
    // Dynamic confidence threshold based on conversation depth
    const confidenceThreshold = depth < 10 ? 0.9 : 0.85;
    
    const analysisPrompt = `Analyze this user message to detect if they are naturally answering any of these Purpose-to-Value Map questions:

USER MESSAGE:
"${message}"

POSSIBLE BLOCKS TO DETECT:
${blocksToAnalyze.map(b => `- ${b.key}: ${b.description} (${b.detectPrompt})`).join('\n')}

CONVERSATION CONTEXT: ${conversationType || 'general'} ${mentorType ? `with ${mentorType}` : ''}
CONVERSATION DEPTH: ${depth} exchanges (${depth < 10 ? 'early exploration' : 'deeper discussion'})

CRITICAL - DETECTION RULES:
1. ONLY detect if the content is SPECIFIC and CONCRETE
2. Generic statements like "I want to help people" should NOT be detected
3. Good detection: "Women between 30-35 who practice yoga" or "Money Mindset Makeovers program"
4. Bad detection: "People who are struggling" or "Some kind of service"
5. The user must be making a STATEMENT, not asking a question
6. Content must be specific enough to be actionable

RESPOND IN EXACTLY THIS JSON FORMAT (no markdown, no code blocks):
{
  "detected": true/false,
  "blockKey": "the_block_key or null",
  "suggestedContent": "A refined, clear version of what they said (30-80 words max)",
  "confidence": 0.0-1.0,
  "reasoning": "One sentence explaining why this was detected"
}

EXAMPLES OF GOOD DETECTIONS (high confidence):
- "Women between 30 and 35 who practice yoga" → audience block, 0.95 confidence
- "I want to create a 'Money Mindset Makeover' program" → solution block, 0.95 confidence
- "Burned out entrepreneurs who lost their passion" → audience block, 0.92 confidence

EXAMPLES OF BAD DETECTIONS (DO NOT DETECT THESE):
- Vague statements like "I want to help people" (too generic)
- "I'm good at listening" (not specific enough alone)
- "Maybe some kind of coaching?" (uncertain, questioning)
- Philosophical musings without specifics

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

    // Only return detection if confidence is high enough (dynamic threshold)
    if (!parsed.detected || parsed.confidence < confidenceThreshold || !parsed.blockKey) {
      console.log(`Detection below threshold (${confidenceThreshold}) or no block detected:`, parsed);
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

    console.log(`Value Map Detection: ${parsed.blockKey} (confidence: ${parsed.confidence}, depth: ${depth})`);

    // Return detection WITHOUT confidence percentage (don't show to user)
    return new Response(
      JSON.stringify({
        detection: {
          blockKey: parsed.blockKey,
          blockTitle: blockConfig.title,
          blockDescription: blockConfig.description,
          suggestedContent: parsed.suggestedContent,
          // Don't include confidence in response - user doesn't need to see it
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
