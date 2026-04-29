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

    console.log('Analyzing purpose evolution for user', user.id);

    // Get user's profile with current purpose
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('main_mission, purpose_path, priority_growth_area')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    // Get completed tasks (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: completedTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('task_title, completion_reflection, completed_at')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('completed_at', thirtyDaysAgo.toISOString())
      .order('completed_at', { ascending: false })
      .limit(20);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
    }

    // Get energetic patterns (last 30 days)
    const { data: energeticData, error: energeticError } = await supabase
      .from('energetic_snapshots')
      .select('overall_frequency, emotional_state, activity_context, alignment_feeling, captured_at')
      .eq('user_id', user.id)
      .gte('captured_at', thirtyDaysAgo.toISOString())
      .order('captured_at', { ascending: false })
      .limit(50);

    if (energeticError) {
      console.error('Error fetching energetic data:', energeticError);
    }

    // Get recent insight dots with connections
    const { data: insightDots, error: dotsError } = await supabase
      .from('insight_dots')
      .select('core_theme, insight_text, emotional_tone, skill_tags, source_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (dotsError) {
      console.error('Error fetching insight dots:', dotsError);
    }

    // Get dot connections
    const { data: connections, error: connectionsError } = await supabase
      .from('dot_connections')
      .select('connection_type, connection_insight')
      .eq('user_id', user.id)
      .order('discovered_at', { ascending: false })
      .limit(15);

    if (connectionsError) {
      console.error('Error fetching connections:', connectionsError);
    }

    // Analyze energetic patterns
    const highAlignmentMoments = (energeticData || []).filter(e => (e.alignment_feeling || 0) >= 8);
    const dominantFrequencies = [...new Set((energeticData || []).map(e => e.overall_frequency).filter(Boolean))];
    const flowContexts = [...new Set((energeticData || []).filter(e => e.overall_frequency === 'flow').map(e => e.activity_context).filter(Boolean))];

    // Analyze task patterns
    const taskThemes = (completedTasks || []).map(t => t.task_title).join(' | ');
    const taskReflections = (completedTasks || []).filter(t => t.completion_reflection).map(t => t.completion_reflection);

    // Analyze dot patterns
    const coreThemes = [...new Set((insightDots || []).map(d => d.core_theme))];
    const skillTags = [...new Set((insightDots || []).flatMap(d => d.skill_tags || []))];
    const connectionPatterns = (connections || []).map(c => `[${c.connection_type}] ${c.connection_insight}`);

    const systemPrompt = `You are a purpose evolution expert helping users refine their life purpose based on their lived experience and growth patterns.

Analyze the user's:
1. Completed tasks and reflections (what they've actually done)
2. Energetic patterns (when they feel most aligned and in flow)
3. Insight dots and connections (their emerging wisdom and patterns)

Your refinements should:
- Be grounded in their actual lived experience, not aspirational fantasy
- Reflect patterns of when they're most energized and aligned
- Incorporate emerging themes from their dot connections
- Be specific and actionable, not generic
- Honor their current purpose while suggesting evolution

Return your analysis as JSON with this structure:
{
  "evolved_purpose": "The refined purpose statement based on all data",
  "key_insights": [
    "Specific insight from the data that informed this evolution"
  ],
  "alignment_evidence": [
    "Evidence from tasks, energy, or dots that supports this direction"
  ],
  "recommended_focus": "What to prioritize based on their natural resonance",
  "integration_path": "How to embody this evolved purpose in daily life"
}`;

    const userPrompt = `Current Purpose: ${profile?.main_mission || 'Not yet defined'}
Purpose Path: ${profile?.purpose_path || 'Not specified'}
Priority Growth Area: ${profile?.priority_growth_area || 'Not specified'}

COMPLETED TASKS (Last 30 Days):
${taskThemes || 'No completed tasks'}

Task Reflections:
${taskReflections.slice(0, 5).join('\n---\n') || 'No reflections'}

ENERGETIC PATTERNS:
- High Alignment Moments: ${highAlignmentMoments.length} times
- Dominant Frequencies: ${dominantFrequencies.join(', ') || 'Not enough data'}
- Flow State Contexts: ${flowContexts.join(', ') || 'Not detected'}

INSIGHT DOTS & THEMES:
Core Themes: ${coreThemes.join(', ') || 'No themes yet'}
Skill Tags: ${skillTags.slice(0, 10).join(', ') || 'No skills tagged'}

DOT CONNECTION PATTERNS:
${connectionPatterns.slice(0, 8).join('\n') || 'No connections yet'}

Based on this lived experience data, suggest an evolved purpose statement that reflects where they're naturally flowing and what patterns are emerging.`;

    console.log('Calling AI for purpose evolution...');

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
    const evolutionText = aiData.choices[0].message.content;
    
    let evolution;
    try {
      evolution = JSON.parse(evolutionText);
    } catch (e) {
      console.error('Failed to parse AI response:', evolutionText);
      throw new Error('Invalid AI response format');
    }

    console.log('Generated purpose evolution');

    return new Response(
      JSON.stringify({
        success: true,
        ...evolution,
        data_summary: {
          completed_tasks: (completedTasks || []).length,
          energetic_snapshots: (energeticData || []).length,
          insight_dots: (insightDots || []).length,
          dot_connections: (connections || []).length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in evolve-purpose:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
