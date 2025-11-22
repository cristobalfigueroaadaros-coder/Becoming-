import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch all insight dots for the user
    const { data: dots, error: dotsError } = await supabase
      .from('insight_dots')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (dotsError) {
      console.error('Error fetching dots:', dotsError);
      throw dotsError;
    }

    if (!dots || dots.length === 0) {
      return new Response(JSON.stringify({
        themes: [],
        skillClusters: [],
        patterns: [],
        evolution: [],
        summary: 'No insights available yet. Start collecting dots to see patterns emerge.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare data for AI analysis
    const dotsText = dots.map(dot => 
      `[${dot.created_at}] ${dot.source_type}: ${dot.insight_text} (Theme: ${dot.core_theme}, Tags: ${dot.skill_tags?.join(', ') || 'none'})`
    ).join('\n');

    const systemPrompt = `You are an expert pattern analyst specializing in personal development insights. 
Analyze the user's constellation of insights and identify:
1. Emerging themes (recurring topics across different sources)
2. Skill clusters (related skills that appear together)
3. Behavioral patterns (recurring patterns in how insights emerge)
4. Theme evolution (how themes change over time)

Return a JSON object with this exact structure:
{
  "themes": [
    {
      "name": "Theme name",
      "frequency": number (count of related dots),
      "trend": "rising" | "stable" | "declining",
      "description": "Brief description",
      "relatedSources": ["source_type1", "source_type2"]
    }
  ],
  "skillClusters": [
    {
      "name": "Cluster name",
      "skills": ["skill1", "skill2"],
      "strength": number (1-10),
      "description": "How these skills connect"
    }
  ],
  "patterns": [
    {
      "type": "Pattern type",
      "description": "Pattern description",
      "frequency": "daily" | "weekly" | "monthly",
      "insight": "What this pattern reveals"
    }
  ],
  "evolution": [
    {
      "period": "time period",
      "dominantThemes": ["theme1", "theme2"],
      "insight": "What changed in this period"
    }
  ],
  "summary": "2-3 sentence overview of key insights"
}`;

    const userPrompt = `Analyze these constellation insights and identify patterns:\n\n${dotsText}\n\nTotal dots: ${dots.length}\nDate range: ${dots[0].created_at} to ${dots[dots.length - 1].created_at}`;

    console.log('Calling Lovable AI for constellation insights analysis...');
    
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
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Extract JSON from response
    let insights;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        insights = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI insights');
    }

    console.log('Successfully analyzed constellation insights');

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in analyze-constellation-insights:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});