import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BLOCK_ANALYSIS_PROMPTS: Record<string, string> = {
  purpose: "Extract the user's core purpose, mission, or what feels meaningful to work on.",
  strengths: "Identify natural abilities, lived experiences, skills, and what feels easy for them.",
  audience: "Determine who the user wants to help or serve, their target audience.",
  problems: "Find the problems, struggles, or pain points the user wants to address.",
  alternatives: "Identify current solutions people use and what's not working.",
  unique_value: "Extract what makes the user's approach unique or different.",
  solution: "Determine what product, service, or offering the user is building.",
  impact: "Find the emotional and practical impact the user wants to create.",
  channels: "Identify how the user plans to reach their audience.",
  revenue: "Extract any mentions of monetization or sustainability.",
  costs: "Find mentions of what this requires from the user.",
  unfair_advantage: "Identify what's unique to the user's life experience.",
  signals: "Find metrics or signals of progress the user cares about."
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Analyzing value map for user:', user.id);

    // Gather user data from multiple sources
    const [
      councilMeetings,
      mentorChats,
      savedInsights,
      profile,
      existingBlocks
    ] = await Promise.all([
      supabase
        .from('council_meetings')
        .select('question, resolution, answers, pattern_detected')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('chats')
        .select('content, mentor_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('saved_insights')
        .select('insight_text, source_type, source_mentor')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .limit(30),
      supabase
        .from('profiles')
        .select('main_mission, main_strengths, priority_growth_area, purpose_path')
        .eq('id', user.id)
        .single(),
      supabase
        .from('value_map_blocks')
        .select('block_key, content, is_unlocked')
        .eq('user_id', user.id)
    ]);

    // Build context from gathered data
    const profileData = profile.data as {
      main_mission?: string;
      main_strengths?: string[];
      priority_growth_area?: string;
      purpose_path?: string;
    } | null;

    const context = {
      councilInsights: councilMeetings.data?.map(m => ({
        question: m.question,
        resolution: m.resolution,
        pattern: m.pattern_detected
      })) || [],
      mentorConversations: mentorChats.data?.slice(0, 20).map(c => c.content) || [],
      savedInsights: savedInsights.data?.map(i => i.insight_text) || [],
      profile: profileData || {} as { main_mission?: string; main_strengths?: string[]; priority_growth_area?: string }
    };

    // Find blocks that need suggestions (unlocked but empty, or not unlocked)
    const emptyBlocks = (existingBlocks.data || [])
      .filter(b => !b.content)
      .map(b => b.block_key);

    if (emptyBlocks.length === 0) {
      return new Response(JSON.stringify({ 
        suggestions: [],
        message: 'All blocks are filled' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use AI to generate suggestions
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const suggestions: Array<{
      block_key: string;
      suggestion_text: string;
      source_type: string;
      source_context: Record<string, unknown>;
    }> = [];

    // Generate suggestions for up to 3 blocks at a time
    const blocksToAnalyze = emptyBlocks.slice(0, 3);

    for (const blockKey of blocksToAnalyze) {
      const prompt = BLOCK_ANALYSIS_PROMPTS[blockKey];
      if (!prompt) continue;

      const systemPrompt = `You are analyzing a user's journey data to suggest content for their Purpose to Value Map. 
The map helps users transform their purpose into something that creates value.

Block to fill: ${blockKey}
Task: ${prompt}

Based on the user's data, suggest a concise, meaningful entry for this block.
Keep it personal and grounded in their actual journey.
Write in first person from the user's perspective.
Keep it under 100 words.
If there's not enough relevant data, respond with "INSUFFICIENT_DATA".`;

      const userPrompt = `User Data:

Profile Mission: ${context.profile.main_mission || 'Not set'}
Profile Strengths: ${context.profile.main_strengths?.join(', ') || 'Not set'}
Growth Area: ${context.profile.priority_growth_area || 'Not set'}

Recent Council Insights:
${context.councilInsights.slice(0, 3).map(i => `- Question: ${i.question}\n  Resolution: ${i.resolution || 'None'}`).join('\n')}

Saved Insights:
${context.savedInsights.slice(0, 5).map(i => `- ${i}`).join('\n')}

Recent Mentor Conversations (excerpts):
${context.mentorConversations.slice(0, 5).map(c => `- ${c.substring(0, 200)}...`).join('\n')}`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 300
          })
        });

        if (!aiResponse.ok) {
          console.error('AI API error:', await aiResponse.text());
          continue;
        }

        const aiData = await aiResponse.json();
        const suggestionText = aiData.choices?.[0]?.message?.content?.trim();

        if (suggestionText && suggestionText !== 'INSUFFICIENT_DATA') {
          suggestions.push({
            block_key: blockKey,
            suggestion_text: suggestionText,
            source_type: 'ai_analysis',
            source_context: {
              analyzed_sources: ['council', 'mentors', 'insights', 'profile'],
              generated_at: new Date().toISOString()
            }
          });
        }
      } catch (aiError) {
        console.error('Error generating suggestion for block:', blockKey, aiError);
      }
    }

    // Save suggestions to database
    if (suggestions.length > 0) {
      const { error: insertError } = await supabase
        .from('value_map_suggestions')
        .insert(suggestions.map(s => ({
          user_id: user.id,
          block_key: s.block_key,
          suggestion_text: s.suggestion_text,
          source_type: s.source_type,
          source_context: s.source_context,
          status: 'pending'
        })));

      if (insertError) {
        console.error('Error saving suggestions:', insertError);
      }
    }

    console.log(`Generated ${suggestions.length} suggestions for user ${user.id}`);

    return new Response(JSON.stringify({ 
      suggestions,
      analyzed_blocks: blocksToAnalyze,
      message: `Generated ${suggestions.length} suggestions`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in analyze-value-map:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
