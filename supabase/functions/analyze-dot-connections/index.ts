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
    const { dots } = await req.json();
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

    if (!dots || dots.length < 2) {
      return new Response(
        JSON.stringify({ connections: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing connections to avoid duplicates
    const { data: existingConnections } = await supabaseClient
      .from("dot_connections")
      .select("dot_id_1, dot_id_2")
      .eq("user_id", user.id);

    const existingPairs = new Set(
      (existingConnections || []).map((c: any) => 
        [c.dot_id_1, c.dot_id_2].sort().join("-")
      )
    );

    // Format dots for AI analysis
    const dotsText = dots
      .map((dot: any, idx: number) => 
        `[${idx}] Theme: ${dot.core_theme} | Source: ${dot.source_mentor || dot.source_type} | Insight: ${dot.insight_text}`
      )
      .join("\n\n");

    const systemPrompt = `You are an insight connection analyzer. Your task is to find meaningful connections between user insights.

Rules:
1. Look for patterns, contradictions, reinforcements, or building relationships
2. Each connection should reveal something the user might not have noticed
3. Focus on actionable or enlightening connections
4. Return 0-5 connections (quality over quantity)
5. Connection types: "reinforces", "contrasts", "builds_on", "reveals_pattern", "complements"

Respond ONLY with valid JSON in this format:
{
  "connections": [
    {
      "dot1_index": 0,
      "dot2_index": 3,
      "connection_type": "reinforces",
      "insight": "Brief explanation of the connection"
    }
  ]
}`;

    const userPrompt = `Analyze these insights and find meaningful connections:

${dotsText}

Return only the JSON response.`;

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
      console.error("AI error:", aiResponse.status, await aiResponse.text());
      throw new Error("Failed to analyze connections");
    }

    const aiData = await aiResponse.json();
    let responseContent = aiData.choices[0].message.content;

    // Clean up JSON response
    responseContent = responseContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let analysisResult;
    try {
      analysisResult = JSON.parse(responseContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseContent);
      throw new Error("Invalid response format from AI");
    }

    // Create connections in database
    const newConnections: any[] = [];
    
    for (const conn of analysisResult.connections || []) {
      const dot1 = dots[conn.dot1_index];
      const dot2 = dots[conn.dot2_index];
      
      if (!dot1 || !dot2) continue;

      // Check if connection already exists
      const pairKey = [dot1.id, dot2.id].sort().join("-");
      if (existingPairs.has(pairKey)) continue;

      const { data, error } = await supabaseClient
        .from("dot_connections")
        .insert({
          user_id: user.id,
          dot_id_1: dot1.id,
          dot_id_2: dot2.id,
          connection_type: conn.connection_type || "pattern",
          connection_insight: conn.insight,
          ai_generated: true,
        })
        .select()
        .single();

      if (!error && data) {
        newConnections.push(data);
        existingPairs.add(pairKey);
      }
    }

    return new Response(
      JSON.stringify({ 
        connections: newConnections,
        count: newConnections.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in analyze-dot-connections:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
