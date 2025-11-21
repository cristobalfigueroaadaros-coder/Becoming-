import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { entries } = await req.json();

    if (!entries || entries.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Need at least 3 entries to analyze' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${entries.length} constellation entries for user ${user.id}`);

    // Prepare data for AI analysis
    const entriesSummary = entries.map((entry: any) => ({
      type: entry.entry_type,
      title: entry.title,
      description: entry.description,
      takeaway: entry.key_takeaway,
      domains: entry.related_domains,
      emotion: entry.emotional_tone,
    }));

    const systemPrompt = `You are an AI pattern recognition expert helping users discover meaningful connections in their personal growth journey. 

Analyze the following constellation of entries (books, ideas, insights, milestones) and identify:
1. Recurring themes and patterns
2. Hidden strengths being developed
3. Emerging purposes or callings
4. Growth trends over time
5. Unexpected opportunities or directions

For each pattern you identify, provide:
- A clear, insightful explanation of the connection (2-3 sentences)
- Which entries are connected (by their indices in the array)
- The pattern type: "theme", "strength", "purpose", "trend", or "opportunity"

Return your analysis as a JSON array of connections. Each connection should have:
{
  "insight": "Your insightful explanation of the pattern",
  "entry_indices": [0, 2, 5],
  "pattern_type": "theme" | "strength" | "purpose" | "trend" | "opportunity"
}

Be specific, encouraging, and help the user see their evolution in a new light.`;

    const userPrompt = `Here are the constellation entries to analyze:\n\n${JSON.stringify(entriesSummary, null, 2)}`;

    // Call Lovable AI for pattern analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    let parsedConnections;
    try {
      const parsed = JSON.parse(analysisText);
      parsedConnections = parsed.connections || parsed;
      if (!Array.isArray(parsedConnections)) {
        parsedConnections = [parsedConnections];
      }
    } catch (e) {
      console.error('Failed to parse AI response:', analysisText);
      throw new Error('Invalid AI response format');
    }

    console.log(`AI identified ${parsedConnections.length} patterns`);

    // Save connections to database
    const connectionsToInsert = parsedConnections
      .filter((conn: any) => conn.insight && conn.entry_indices && conn.pattern_type)
      .map((conn: any) => ({
        user_id: user.id,
        entry_ids: conn.entry_indices.map((idx: number) => entries[idx]?.id).filter(Boolean),
        connection_insight: conn.insight,
        pattern_type: conn.pattern_type,
      }))
      .filter((conn: any) => conn.entry_ids.length >= 2); // Only save connections with at least 2 valid entries

    if (connectionsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('constellation_connections')
        .insert(connectionsToInsert);

      if (insertError) {
        console.error('Error saving connections:', insertError);
        throw insertError;
      }

      console.log(`Saved ${connectionsToInsert.length} connections to database`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        connections: connectionsToInsert,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-constellation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
