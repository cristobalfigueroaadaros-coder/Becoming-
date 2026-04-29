import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { period, startDate, endDate } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Fetch challenges for the period
    const { data: challenges, error: challengesError } = await supabase
      .from('daily_challenge')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (challengesError) throw challengesError;

    // Fetch user profile and purpose
    const { data: profile } = await supabase
      .from('profiles')
      .select('main_mission, purpose_path, priority_growth_area')
      .eq('id', user.id)
      .single();

    // Fetch recent insight dots for context
    const { data: insights } = await supabase
      .from('insight_dots')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
      .limit(20);

    // Prepare context for AI
    const completed = challenges?.filter(c => c.status === 'completed') || [];
    const skipped = challenges?.filter(c => c.status === 'skipped') || [];
    const completionRate = challenges?.length ? Math.round((completed.length / challenges.length) * 100) : 0;

    const challengeTypes = completed.reduce((acc, c) => {
      const types = c.source_reason?.match(/\b(purpose|growth|domain|shadow|challenge)\b/gi) || [];
      types.forEach((type: string) => {
        acc[type.toLowerCase()] = (acc[type.toLowerCase()] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const systemPrompt = `You are an insightful growth coach analyzing someone's challenge completion patterns over a ${period} period.

User's Purpose: ${profile?.main_mission || 'Not defined yet'}
Purpose Path: ${profile?.purpose_path || 'Not defined'}
Growth Priority: ${profile?.priority_growth_area || 'Not defined'}

Period: ${startDate} to ${endDate}
Total Challenges: ${challenges?.length || 0}
Completed: ${completed.length}
Skipped: ${skipped.length}
Completion Rate: ${completionRate}%

Challenge Focus Areas: ${JSON.stringify(challengeTypes, null, 2)}

Recent Insights Generated: ${insights?.map(i => `- ${i.core_theme}: ${i.insight_text}`).join('\n') || 'None'}

Analyze this data and provide:
1. KEY PATTERNS: 2-3 specific patterns you notice in their challenge completion
2. PURPOSE ALIGNMENT: How well their challenges align with their stated purpose (be honest)
3. GROWTH AREAS: 2-3 specific areas where they're making progress
4. RECOMMENDATIONS: 2-3 actionable recommendations for the next ${period}

Be specific, honest, and encouraging. Focus on patterns, not just numbers.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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
          { role: 'user', content: 'Generate comprehensive insights for this period.' }
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to generate insights');
    }

    const aiData = await aiResponse.json();
    const insights_text = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({
        insights: insights_text,
        stats: {
          total: challenges?.length || 0,
          completed: completed.length,
          skipped: skipped.length,
          completionRate,
          challengeTypes
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating insights:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});