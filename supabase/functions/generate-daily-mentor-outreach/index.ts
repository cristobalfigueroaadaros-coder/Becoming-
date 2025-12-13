import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const mentorOutreachPrompts: Record<string, { types: string[], personality: string }> = {
  discipline_mentor: {
    types: ['goal_check', 'accountability', 'encouragement'],
    personality: 'Direct, results-focused. Check on goals and commitments. Brief and actionable.'
  },
  business_mentor: {
    types: ['idea', 'opportunity', 'strategic_question'],
    personality: 'Revenue-focused, strategic. Offer business insights based on recent discussions.'
  },
  creative_visionary: {
    types: ['idea', 'inspiration', 'creative_prompt'],
    personality: 'Imaginative, expansive. Suggest creative angles or new possibilities.'
  },
  heart_mentor: {
    types: ['emotional_check', 'relationship_question', 'self_care'],
    personality: 'Warm, empathetic. Check on emotional wellbeing and relationships.'
  },
  strategist_mentor: {
    types: ['pattern_insight', 'next_step', 'optimization'],
    personality: 'Analytical, pattern-focused. Offer strategic insights based on user patterns.'
  },
  marketing_mentor: {
    types: ['audience_insight', 'story_prompt', 'visibility_tip'],
    personality: 'Audience-focused, story-driven. Help with visibility and messaging.'
  },
  future_self: {
    types: ['journey_suggestion', 'vision_reminder', 'encouragement'],
    personality: 'Wise, loving, all-knowing. Suggest mentor journeys and remind of vision.'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { forceGenerate } = await req.json().catch(() => ({}));

    // Check if user already has a message today (unless forcing)
    if (!forceGenerate) {
      const today = new Date().toISOString().split('T')[0];
      const { data: existingMessage } = await supabase
        .from('mentor_daily_outreach')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today)
        .limit(1);

      if (existingMessage && existingMessage.length > 0) {
        return new Response(JSON.stringify({ 
          message: 'Already generated today',
          existing: true 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Gather user context
    const [
      { data: profile },
      { data: recentCouncil },
      { data: dailyGoals },
      { data: lifeDomains },
      { data: recentOutreach },
      { data: recentChats },
      { data: pendingFollowups }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('council_meetings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('daily_goals').select('*').eq('user_id', user.id).eq('completed', false).limit(5),
      supabase.from('life_domains').select('*').eq('user_id', user.id),
      supabase.from('mentor_daily_outreach').select('mentor_type, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(7),
      supabase.from('chats').select('mentor_type, content, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('mentor_followup_queue').select('*, saved_insights(*)').eq('user_id', user.id).eq('status', 'pending').lte('scheduled_for', new Date().toISOString()).limit(3)
    ]);

    // PRIORITY 1: Check for pending insight follow-ups
    if (pendingFollowups && pendingFollowups.length > 0) {
      const followup = pendingFollowups[0];
      const mentorConfig = mentorOutreachPrompts[followup.mentor_type] || { personality: 'Wise and caring mentor.' };
      
      // Generate follow-up message referencing the saved insight
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured');
      }

      const systemPrompt = `You are ${followup.mentor_type.replace(/_/g, ' ')}. ${mentorConfig.personality}

You are following up on an insight the user saved from a previous conversation. They asked you to reach out to discuss this more deeply.

THE INSIGHT THEY SAVED:
"${followup.insight_text}"

RULES:
- Open by referencing the insight they saved - they wanted to explore this with you
- Be warm and inviting, showing you've been thinking about their insight
- Ask an open question that invites deeper exploration
- Keep it to 3-4 sentences MAX
- Use **bold** for 1-2 key phrases`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Generate a follow-up message about the insight they saved.' }
          ],
          max_tokens: 400,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate follow-up message');
      }

      const aiData = await response.json();
      const generatedMessage = aiData.choices?.[0]?.message?.content || `I've been thinking about what you saved: "${followup.insight_text}". Let's explore this together.`;

      // Save the outreach message
      const { data: outreach, error: insertError } = await supabase
        .from('mentor_daily_outreach')
        .insert({
          user_id: user.id,
          mentor_type: followup.mentor_type,
          message: generatedMessage,
          message_type: 'insight_followup',
          context_source: 'saved_insight',
          context_data: { saved_insight_id: followup.saved_insight_id, insight_text: followup.insight_text }
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Mark the follow-up as sent
      await supabase
        .from('mentor_followup_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', followup.id);

      // Update the saved insight
      await supabase
        .from('saved_insights')
        .update({ followup_triggered_at: new Date().toISOString() })
        .eq('id', followup.saved_insight_id);

      console.log(`Generated insight follow-up from ${followup.mentor_type} for user ${user.id}`);

      return new Response(JSON.stringify({ 
        success: true,
        outreach,
        isFollowup: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Determine which mentor should reach out (avoid recent ones)
    const recentMentors = recentOutreach?.map(o => o.mentor_type) || [];
    const availableMentors = Object.keys(mentorOutreachPrompts).filter(m => !recentMentors.includes(m));
    
    // Prioritize based on context
    let selectedMentor = 'future_self';
    let messageType = 'encouragement';
    let contextSource = 'general';

    // Check for incomplete goals → Discipline Mentor
    if (dailyGoals && dailyGoals.length > 0 && availableMentors.includes('discipline_mentor')) {
      selectedMentor = 'discipline_mentor';
      messageType = 'goal_check';
      contextSource = 'daily_goal';
    }
    // Check for recent council meeting → Related mentor based on topic
    else if (recentCouncil && recentCouncil.length > 0) {
      const latestCouncil = recentCouncil[0];
      const emotionalTone = latestCouncil.emotional_tone || '';
      
      if (emotionalTone.includes('business') || emotionalTone.includes('revenue')) {
        if (availableMentors.includes('business_mentor')) {
          selectedMentor = 'business_mentor';
          messageType = 'strategic_question';
          contextSource = 'council_meeting';
        }
      } else if (emotionalTone.includes('creative') || emotionalTone.includes('idea')) {
        if (availableMentors.includes('creative_visionary')) {
          selectedMentor = 'creative_visionary';
          messageType = 'idea';
          contextSource = 'council_meeting';
        }
      } else if (emotionalTone.includes('relationship') || emotionalTone.includes('emotional')) {
        if (availableMentors.includes('heart_mentor')) {
          selectedMentor = 'heart_mentor';
          messageType = 'emotional_check';
          contextSource = 'council_meeting';
        }
      }
    }
    // Check life domains for gaps → Strategist
    else if (lifeDomains && lifeDomains.some(d => d.current_score < 5) && availableMentors.includes('strategist_mentor')) {
      selectedMentor = 'strategist_mentor';
      messageType = 'pattern_insight';
      contextSource = 'life_domain';
    }
    // Default to Future Self for journey suggestions
    else if (availableMentors.includes('future_self')) {
      selectedMentor = 'future_self';
      messageType = 'journey_suggestion';
      contextSource = 'pattern';
    }
    // Fallback to any available mentor
    else if (availableMentors.length > 0) {
      selectedMentor = availableMentors[Math.floor(Math.random() * availableMentors.length)];
      messageType = mentorOutreachPrompts[selectedMentor].types[0];
    }

    // Build context for AI
    const contextData: Record<string, unknown> = {};
    let contextPrompt = '';

    if (contextSource === 'daily_goal' && dailyGoals) {
      contextData.goals = dailyGoals.map(g => g.goal_text);
      contextPrompt = `User has these pending goals: ${dailyGoals.map(g => g.goal_text).join(', ')}`;
    } else if (contextSource === 'council_meeting' && recentCouncil?.[0]) {
      contextData.council = recentCouncil[0];
      contextPrompt = `User recently discussed: "${recentCouncil[0].question}". Resolution: "${recentCouncil[0].resolution || 'ongoing'}"`;
    } else if (contextSource === 'life_domain' && lifeDomains) {
      const lowDomains = lifeDomains.filter(d => d.current_score < 5);
      contextData.lowDomains = lowDomains;
      contextPrompt = `User's life domains needing attention: ${lowDomains.map(d => `${d.domain_name} (${d.current_score}/10)`).join(', ')}`;
    }

    // Add recent chat context for journey suggestions
    if (selectedMentor === 'future_self' && recentChats && recentChats.length > 0) {
      const recentTopics = recentChats.slice(0, 10).map(c => c.content.substring(0, 100));
      contextPrompt += `\n\nRecent conversation topics:\n${recentTopics.join('\n')}`;
    }

    // Generate the message using AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const mentorConfig = mentorOutreachPrompts[selectedMentor];
    
    const systemPrompt = `You are ${selectedMentor.replace(/_/g, ' ')}. ${mentorConfig.personality}

You are sending a proactive daily message to a user of a personal growth app. This is NOT a response to their message - you are reaching out to them.

MESSAGE TYPE: ${messageType}
${contextPrompt}

RULES:
- Be personal and warm, like a real mentor checking in
- Keep it to 2-3 sentences MAX
- Ask a specific question OR give a specific insight
- Reference their actual context/goals if provided
- If you're Future Self suggesting a journey, recommend which mentors to talk to in what order
- NO generic advice - be specific to their situation
- Use **bold** for key phrases (max 2-3 highlights)`;

    const userPrompt = messageType === 'journey_suggestion' 
      ? 'Generate a message suggesting a multi-mentor journey the user should take based on their recent activity. Recommend specific mentors in a specific order.'
      : `Generate a ${messageType} message for the user.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate message');
    }

    const aiData = await response.json();
    const generatedMessage = aiData.choices?.[0]?.message?.content || 'How are you progressing today?';

    // Save the outreach message
    const { data: outreach, error: insertError } = await supabase
      .from('mentor_daily_outreach')
      .insert({
        user_id: user.id,
        mentor_type: selectedMentor,
        message: generatedMessage,
        message_type: messageType,
        context_source: contextSource,
        context_data: contextData
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving outreach:', insertError);
      throw insertError;
    }

    console.log(`Generated ${messageType} message from ${selectedMentor} for user ${user.id}`);

    return new Response(JSON.stringify({ 
      success: true,
      outreach 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in generate-daily-mentor-outreach:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
