import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Dot {
  id: string;
  source_type: string;
  insight_text: string;
  core_theme: string;
  created_at: string;
  emotional_tone?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { dots } = await req.json();
    
    if (!dots || dots.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Need at least 3 insights to find connections' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${dots.length} dots for user ${user.id}`);

    // Use Lovable AI to analyze connections
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert pattern recognition AI that helps people discover meaningful connections in their personal growth journey.

Analyze the user's insights and identify 3-5 deep, meaningful connections between different entries. Look for:
- Similar themes across different contexts
- Cause-and-effect relationships
- Complementary ideas that build on each other
- Contradictions that reveal growth or evolution
- Skills or patterns that emerge across multiple areas

For each connection, explain HOW the insights relate and WHY this matters for the user's journey.`;

    const dotsContext = dots.map((dot: Dot, idx: number) => 
      `[${idx + 1}] ${dot.source_type} (${dot.core_theme}): ${dot.insight_text.substring(0, 200)}${dot.emotional_tone ? ` [${dot.emotional_tone}]` : ''}`
    ).join('\n\n');

    const userPrompt = `Analyze these insights from someone's personal growth journey and find meaningful connections:\n\n${dotsContext}\n\nIdentify 3-5 significant connections between these insights. Return your analysis as a JSON array with this structure:
[
  {
    "dot_indices": [1, 5],
    "connection_type": "Theme Pattern|Causal Link|Complementary Growth|Evolution|Skill Development",
    "insight": "A clear explanation of how these insights connect and what this reveals about the user's journey"
  }
]

Focus on quality over quantity - only return truly meaningful connections.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "identify_connections",
            description: "Return meaningful connections between insights",
            parameters: {
              type: "object",
              properties: {
                connections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      dot_indices: {
                        type: "array",
                        items: { type: "number" },
                        description: "Array of 2 dot indices that are connected"
                      },
                      connection_type: {
                        type: "string",
                        enum: ["Theme Pattern", "Causal Link", "Complementary Growth", "Evolution", "Skill Development"]
                      },
                      insight: {
                        type: "string",
                        description: "Clear explanation of the connection"
                      }
                    },
                    required: ["dot_indices", "connection_type", "insight"]
                  }
                }
              },
              required: ["connections"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "identify_connections" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));

    let connections = [];
    
    // Extract from tool call
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      const args = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
      connections = args.connections || [];
    }

    console.log(`Found ${connections.length} connections`);

    // Store connections in database
    const newConnections = [];
    for (const conn of connections) {
      if (conn.dot_indices.length === 2) {
        const dot1 = dots[conn.dot_indices[0] - 1];
        const dot2 = dots[conn.dot_indices[1] - 1];
        
        if (dot1 && dot2) {
          const { data, error } = await supabase
            .from('dot_connections')
            .insert({
              user_id: user.id,
              dot_id_1: dot1.id,
              dot_id_2: dot2.id,
              connection_type: conn.connection_type,
              connection_insight: conn.insight,
              ai_generated: true,
            })
            .select()
            .single();

          if (!error && data) {
            newConnections.push(data);
          } else if (error) {
            console.error('Error inserting connection:', error);
          }
        }
      }
    }

    console.log(`Successfully stored ${newConnections.length} connections`);

    return new Response(
      JSON.stringify({ 
        connections: newConnections,
        count: newConnections.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in connect-all-dots:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
