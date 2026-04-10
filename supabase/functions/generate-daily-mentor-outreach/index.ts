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

    const { forceGenerate, mentorType: directMentorType, insightText: directInsightText } = await req.json().catch(() => ({}));

    // PRIORITY 0: Direct followup — mentor type passed explicitly from "Go Deeper Later"
    // This is the most reliable path: no queue lookup, no race condition
    if (directMentorType && directInsightText) {
      const mentorConfig = mentorOutreachPrompts[directMentorType] || { personality: 'Wise and caring mentor.' };
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

      const mentorDisplayName = directMentorType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      const systemPrompt = `You are ${mentorDisplayName}. ${mentorConfig.personality}

The user just saved one of your messages and asked you to go deeper on it later. This is your follow-up.

THE INSIGHT THEY SAVED:
"${directInsightText}"

RULES:
- Open by referencing the insight they saved — they wanted to explore this with you
- Be warm and inviting, showing you've been thinking about their insight
- Ask one open question that invites deeper exploration
- Keep it to 3-4 sentences MAX
- Use **bold** for 1-2 key phrases`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Generate the follow-up message.' }
          ],
          max_tokens: 400,
        }),
      });

      if (!aiResponse.ok) throw new Error('Failed to generate follow-up message');
      const aiData = await aiResponse.json();
      const generatedMessage = aiData.choices?.[0]?.message?.content
        || `I've been thinking about what you shared: "${directInsightText.slice(0, 80)}...". Let's explore this together.`;

      const { data: outreach, error: insertError } = await supabase
        .from('mentor_daily_outreach')
        .insert({
          user_id: user.id,
          mentor_type: directMentorType,
          message: generatedMessage,
          message_type: 'insight_followup',
          context_source: 'saved_insight',
          context_data: { insight_text: directInsightText }
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify({ success: true, outreach, isFollowup: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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
      { data: pendingFollowups },
      { data: activeProject }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('council_meetings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('daily_goals').select('*').eq('user_id', user.id).eq('completed', false).limit(5),
      supabase.from('life_domains').select('*').eq('user_id', user.id),
      supabase.from('mentor_daily_outreach').select('mentor_type, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(7),
      supabase.from('chats').select('mentor_type, content, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('mentor_followup_queue').select('*, saved_insights(*)').eq('user_id', user.id).eq('status', 'pending').lte('scheduled_for', new Date().toISOString()).limit(3),
      supabase.from('integrator_projects').select('project_title, project_description').eq('user_id', user.id).eq('status', 'active').limit(1).maybeSingle()
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

    let selectedMentor = 'future_self';
    let messageType = 'proactive_insight';
    let contextSource = 'general';

    // PRIORITY 1: Council participants who haven't outreached yet
    // Pick a mentor who spoke in the most recent council and hasn't DM'd recently
    if (recentCouncil && recentCouncil.length > 0) {
      const latestCouncil = recentCouncil[0];
      const councilParticipants = Object.keys(latestCouncil.answers || {});
      const availableParticipants = councilParticipants.filter(m =>
        !recentMentors.includes(m) && mentorOutreachPrompts[m]
      );
      if (availableParticipants.length > 0) {
        selectedMentor = availableParticipants[Math.floor(Math.random() * availableParticipants.length)];
        messageType = 'proactive_insight';
        contextSource = 'council_meeting';
      }
    }

    // PRIORITY 2: Inactivity → Discipline Mentor (only if no council context)
    if (contextSource === 'general' && dailyGoals && dailyGoals.length > 0 && availableMentors.includes('discipline_mentor')) {
      selectedMentor = 'discipline_mentor';
      messageType = 'accountability';
      contextSource = 'daily_goal';
    }

    // PRIORITY 3: Default to Future Self
    if (contextSource === 'general') {
      selectedMentor = availableMentors.includes('future_self') ? 'future_self' : (availableMentors[0] || 'future_self');
      messageType = 'proactive_insight';
    }

    // Build context for AI
    const contextData: Record<string, unknown> = {};
    let mentorPerspectiveContext = '';
    let projectContext = '';
    let councilQuestionContext = '';

    if (activeProject) {
      projectContext = `"${activeProject.project_title}"${activeProject.project_description ? ` — ${activeProject.project_description}` : ''}`;
    }

    if (contextSource === 'council_meeting' && recentCouncil?.[0]) {
      const council = recentCouncil[0];
      councilQuestionContext = council.question || '';
      mentorPerspectiveContext = council.answers?.[selectedMentor] || '';
      contextData.council = { question: councilQuestionContext, mentorPerspective: mentorPerspectiveContext };
    } else if (contextSource === 'daily_goal' && dailyGoals) {
      contextData.goals = dailyGoals.map((g: any) => g.goal_text);
    }

    // Add recent chat context
    if (recentChats && recentChats.length > 0) {
      const myRecentChats = recentChats
        .filter((c: any) => c.mentor_type === selectedMentor)
        .slice(0, 5)
        .map((c: any) => c.content.substring(0, 120));
      if (myRecentChats.length > 0) {
        contextData.recentChat = myRecentChats;
      }
    }

    // Generate the message using AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const mentorConfig = mentorOutreachPrompts[selectedMentor];
    const mentorDisplayName = selectedMentor.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

    const systemPrompt = `You are ${mentorDisplayName}. ${mentorConfig.personality}

You are reaching out to a user because something has been on your mind since your last interaction.
${projectContext ? `\nTHEIR PROJECT: ${projectContext}` : ''}
${councilQuestionContext ? `\nWHAT THEY BROUGHT TO THE COUNCIL: "${councilQuestionContext}"` : ''}
${mentorPerspectiveContext ? `\nWHAT YOU SAID IN THE COUNCIL: "${mentorPerspectiveContext}"` : ''}
${messageType === 'accountability' && dailyGoals ? `\nPENDING GOALS: ${dailyGoals.map((g: any) => g.goal_text).join(', ')}` : ''}

WRITE A DM (2-3 sentences) that:
- Opens as if you've been thinking about this — not a generic greeting
- Delivers ONE specific idea, angle, reframe, or question from YOUR lens
- References something concrete: their project, what they said, or what you said in the council
- Ends with ONE question that makes them want to respond

NOT a check-in. NOT generic. Give them something worth reading.
Sound like yourself — your voice, your blind spot, your take.
Use **bold** for 1 key phrase max. No bullet lists. No intro labels.`;

    const userPrompt = `Generate the message.`;

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
        max_tokens: 450,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate message');
    }

    const aiData = await response.json();
    const generatedMessage = aiData.choices?.[0]?.message?.content || "I've been thinking about where you're headed. What's the one thing you keep putting off that you know matters most right now?";

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
