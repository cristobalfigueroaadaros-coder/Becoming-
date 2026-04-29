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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user's profile with current purpose and constellation insights
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('main_mission, constellation_insights, purpose_path')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    const currentPurpose = profile?.main_mission;
    const constellationInsights = profile?.constellation_insights as any;
    const purposePath = profile?.purpose_path;

    if (!constellationInsights) {
      return new Response(
        JSON.stringify({ error: 'No constellation insights available. Please analyze your constellation first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Refining purpose for user', user.id);

    // Prepare constellation data for AI
    const insightsSummary = {
      dominant_themes: constellationInsights.summary?.dominant_themes || [],
      emerging_strengths: constellationInsights.summary?.emerging_strengths || [],
      growth_direction: constellationInsights.summary?.growth_direction || '',
      priority_focus: constellationInsights.summary?.priority_focus || '',
      patterns: constellationInsights.connections?.map((c: any) => ({
        insight: c.insight,
        pattern_type: c.pattern_type,
      })) || []
    };

    const systemPrompt = `You are a purpose refinement expert helping users evolve their life purpose based on their growth patterns.

Analyze the user's constellation insights (patterns from their books, ideas, and experiences) and their current purpose statement to suggest evolved, more refined versions.

Your refinements should:
1. Incorporate emerging themes and strengths from their constellation
2. Be more specific and actionable than the current purpose
3. Reflect their growth journey and new insights
4. Stay authentic to their core values while expanding depth
5. Provide 2-3 evolved variations they can choose from

Return your analysis as JSON with this structure:
{
  "refined_purposes": [
    {
      "statement": "The refined purpose statement",
      "rationale": "Why this refinement based on constellation patterns",
      "key_additions": ["What new elements were added"],
      "alignment_score": 85
    }
  ],
  "growth_indicators": [
    "Specific patterns showing their evolution"
  ],
  "integration_suggestions": "How to integrate this refined purpose into daily life"
}`;

    const userPrompt = `Current Purpose: ${currentPurpose || 'Not yet defined'}
Purpose Path: ${purposePath || 'Not specified'}

Constellation Insights:
- Dominant Themes: ${insightsSummary.dominant_themes.join(', ')}
- Emerging Strengths: ${insightsSummary.emerging_strengths.join(', ')}
- Growth Direction: ${insightsSummary.growth_direction}
- Priority Focus: ${insightsSummary.priority_focus}

Key Patterns:
${insightsSummary.patterns.map((p: any, i: number) => `${i + 1}. [${p.pattern_type}] ${p.insight}`).join('\n')}

Based on these patterns and growth indicators, suggest evolved versions of their purpose statement.`;

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
      throw new Error(`AI refinement failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const refinementText = aiData.choices[0].message.content;
    
    let refinement;
    try {
      refinement = JSON.parse(refinementText);
    } catch (e) {
      console.error('Failed to parse AI response:', refinementText);
      throw new Error('Invalid AI response format');
    }

    console.log('Generated purpose refinements:', refinement.refined_purposes?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        ...refinement
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in refine-purpose-from-constellation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
