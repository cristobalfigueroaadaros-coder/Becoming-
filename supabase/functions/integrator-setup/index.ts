import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PHASE_COLORS = {
  exploration: '#FEF9C3', // Light yellow
  validation: '#DBEAFE',  // Light blue
  creation: '#D1FAE5',    // Soft green
  expression: '#FED7AA',  // Coral/orange
  reflection: '#E9D5FF',  // Violet
};

const PHASE_ORDER = ['exploration', 'validation', 'creation', 'expression', 'reflection'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { breakthroughId, projectTitle, projectDescription, timeframeDays, isEvolution, evolutionInsight } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // === PDR v2.1: Check for existing active Project Spine ===
    const { data: existingSpine } = await supabase
      .from('project_spines')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    // Get user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get user's life domains for context
    const { data: lifeDomains } = await supabase
      .from('life_domains')
      .select('domain_name, current_score')
      .eq('user_id', user.id);

    // Build context for AI
    const userContext = {
      displayName: profile?.display_name || 'Friend',
      mission: profile?.main_mission,
      strengths: profile?.main_strengths,
      foundationSummary: profile?.user_foundation_summary,
      lifeDomains: lifeDomains?.map(d => `${d.domain_name}: ${d.current_score}/10`).join(', ')
    };

    // Generate AI-powered project plan
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are The Integrator - a warm, supportive intelligence that transforms ideas into actionable projects.

Your role is to create structured project plans that are:
- Action-oriented (prefer doing over researching)
- Achievable (each daily task should take 15-30 minutes max)
- Motivating (each task title should make the user feel "I know exactly what I'm doing today")
- Varied (avoid repetitive "research X" tasks - mix testing, creating, expressing, deciding)
- Progressive (building momentum and confidence day by day)

TASK PHILOSOPHY:
- Learning comes from DOING, not studying
- Tasks should feel human and engaging, not academic
- Avoid time-based instructions like "spend 20 minutes"
- Every task should result in something tangible: a decision, a test, a creation, a conversation

TASK TYPES TO PRIORITIZE:
1. CREATE - Make something tangible (draft, prototype, sketch, write)
2. TEST - Try an assumption with real feedback
3. EXPRESS - Share or communicate an idea
4. DECIDE - Make a clear choice between options
5. INTERACT - Have a real conversation or get real feedback

TASK TYPES TO MINIMIZE:
- Passive research or reading
- Abstract thinking or planning sessions
- Generic "explore" tasks without specific output

THE FIVE PHASES (internal structure - NOT shown to user):
1. Exploration - Gather inspiration through action and quick experiments
2. Validation - Test assumptions with real people and real feedback
3. Creation - Build the core, draft, prototype, develop
4. Expression - Share, launch, publish, present to the world
5. Reflection - Review learnings, gather feedback, iterate

DISTRIBUTION GUIDELINES for ${timeframeDays} days:
- Exploration: ~15-20% of days
- Validation: ~15-20% of days
- Creation: ~35-40% of days
- Expression: ~15-20% of days
- Reflection: ~10-15% of days

Each daily task must include:
- A clear, specific, MOTIVATING title (user should feel excited, not overwhelmed)
- What to do (specific action, not time-based)
- Why it matters (one sentence connecting this task to their goal)
- An optional hint (hidden by default, for if they get stuck)
- An encouragement message (personal, warm, human)
- Action type (create, test, express, decide, interact)`;

    const userPrompt = `Create a ${timeframeDays}-day project plan for:

PROJECT: ${projectTitle}
DESCRIPTION: ${projectDescription}

USER CONTEXT:
- Name: ${userContext.displayName}
- Mission: ${userContext.mission || 'Discovering their purpose'}
- Strengths: ${userContext.strengths?.join(', ') || 'Being explored'}
- Life Areas: ${userContext.lifeDomains || 'Not yet mapped'}

Generate a JSON response with this exact structure:
{
  "phases": [
    {
      "name": "exploration",
      "description": "A warm description of this phase for this specific project",
      "startDay": 1,
      "endDay": 4
    },
    // ... all 5 phases
  ],
  "dailySteps": [
    {
      "day": 1,
      "phase": "exploration",
      "title": "Define the emotional shift this product should create",
      "description": "Write 2-3 sentences describing the transformation your user experiences. Focus on the before and after.",
      "whyItMatters": "This grounds your entire project in real human impact, not features.",
      "hint": "Ask yourself: What does someone feel before using this? What do they feel after?",
      "encouragement": "Today marks the beginning of something meaningful. You're not just planning - you're defining what matters.",
      "actionType": "create"
    },
    // ... one step for each day
  ]
}

IMPORTANT:
- Create exactly ${timeframeDays} daily tasks (one per day)
- Every task must produce something tangible (a decision, a draft, a test result, a conversation)
- NO time-based instructions like "spend X minutes"
- Task titles should be specific and motivating (user should know exactly what to do)
- Include "whyItMatters" for each task (one sentence)
- Include "hint" for each task (optional help if stuck)
- Include "actionType" for each task (create, test, express, decide, interact)
- Write encouragement that feels personal and warm
- Avoid repetitive research tasks - prioritize action and creation
- Distribute days proportionally across all 5 phases`;

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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to generate project plan');
    }

    const aiData = await response.json();
    let planText = aiData.choices?.[0]?.message?.content || '';
    
    // Clean up markdown if present
    planText = planText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let plan;
    try {
      plan = JSON.parse(planText);
    } catch (e) {
      console.error('Failed to parse AI response:', planText);
      throw new Error('Failed to parse project plan');
    }

    // Calculate dates
    const startDate = new Date();
    const targetEndDate = new Date(startDate);
    targetEndDate.setDate(targetEndDate.getDate() + timeframeDays - 1);

    let spine;
    let node;
    let previousActiveNode = null;

    // === PDR v2.1: Create or use existing Project Spine ===
    if (existingSpine && (isEvolution === true)) {
      // Use existing spine, archive old active node
      spine = existingSpine;
      
      // Get the current active node to archive it
      const { data: activeNode } = await supabase
        .from('evolution_nodes')
        .select('*')
        .eq('spine_id', spine.id)
        .eq('status', 'active')
        .single();
      
      if (activeNode) {
        previousActiveNode = activeNode;
        // Archive the previous node
        await supabase
          .from('evolution_nodes')
          .update({ status: 'archived' })
          .eq('id', activeNode.id);
        
        console.log(`Archived previous node: ${activeNode.node_title}`);
      }
      
      // Get the node count for numbering
      const { count: nodeCount } = await supabase
        .from('evolution_nodes')
        .select('*', { count: 'exact', head: true })
        .eq('spine_id', spine.id);
      
      // Create new evolution node
      const { data: newNode, error: nodeError } = await supabase
        .from('evolution_nodes')
        .insert({
          spine_id: spine.id,
          parent_node_id: previousActiveNode?.id || null,
          user_id: user.id,
          node_number: (nodeCount || 0) + 1,
          node_title: projectTitle,
          refined_description: projectDescription,
          evolution_insight: evolutionInsight || `Evolved from: ${previousActiveNode?.node_title || 'initial exploration'}`,
          timeframe_days: timeframeDays,
          start_date: startDate.toISOString().split('T')[0],
          target_end_date: targetEndDate.toISOString().split('T')[0],
          current_phase: 'exploration',
          current_day: 1,
          status: 'active',
          seed_breakthrough_id: breakthroughId || null
        })
        .select()
        .single();
      
      if (nodeError) {
        console.error('Evolution node creation error:', nodeError);
        throw new Error('Failed to create evolution node');
      }
      
      node = newNode;
      console.log(`Created evolution node #${node.node_number}: ${node.node_title}`);
      
    } else if (existingSpine && !isEvolution) {
      // User has active spine but this is NOT marked as evolution
      // This is the first commitment OR a forced new project scenario
      // For now, we'll still use the existing spine and archive the old node
      spine = existingSpine;
      
      const { data: activeNode } = await supabase
        .from('evolution_nodes')
        .select('*')
        .eq('spine_id', spine.id)
        .eq('status', 'active')
        .single();
      
      if (activeNode) {
        previousActiveNode = activeNode;
        await supabase
          .from('evolution_nodes')
          .update({ status: 'archived' })
          .eq('id', activeNode.id);
      }
      
      const { count: nodeCount } = await supabase
        .from('evolution_nodes')
        .select('*', { count: 'exact', head: true })
        .eq('spine_id', spine.id);
      
      const { data: newNode, error: nodeError } = await supabase
        .from('evolution_nodes')
        .insert({
          spine_id: spine.id,
          parent_node_id: previousActiveNode?.id || null,
          user_id: user.id,
          node_number: (nodeCount || 0) + 1,
          node_title: projectTitle,
          refined_description: projectDescription,
          evolution_insight: evolutionInsight || null,
          timeframe_days: timeframeDays,
          start_date: startDate.toISOString().split('T')[0],
          target_end_date: targetEndDate.toISOString().split('T')[0],
          current_phase: 'exploration',
          current_day: 1,
          status: 'active',
          seed_breakthrough_id: breakthroughId || null
        })
        .select()
        .single();
      
      if (nodeError) {
        console.error('Node creation error:', nodeError);
        throw new Error('Failed to create evolution node');
      }
      
      node = newNode;
      
    } else {
      // === FIRST PROJECT: Create new spine + first node ===
      const { data: newSpine, error: spineError } = await supabase
        .from('project_spines')
        .insert({
          user_id: user.id,
          spine_title: projectTitle,
          core_intention: projectDescription,
          broad_contribution: profile?.main_mission || null,
          start_date: startDate.toISOString().split('T')[0],
          status: 'active'
        })
        .select()
        .single();
      
      if (spineError) {
        console.error('Spine creation error:', spineError);
        throw new Error('Failed to create project spine');
      }
      
      spine = newSpine;
      console.log(`Created new project spine: ${spine.spine_title}`);
      
      // Create first evolution node
      const { data: firstNode, error: nodeError } = await supabase
        .from('evolution_nodes')
        .insert({
          spine_id: spine.id,
          parent_node_id: null,
          user_id: user.id,
          node_number: 1,
          node_title: projectTitle,
          refined_description: projectDescription,
          evolution_insight: null,
          timeframe_days: timeframeDays,
          start_date: startDate.toISOString().split('T')[0],
          target_end_date: targetEndDate.toISOString().split('T')[0],
          current_phase: 'exploration',
          current_day: 1,
          status: 'active',
          seed_breakthrough_id: breakthroughId || null
        })
        .select()
        .single();
      
      if (nodeError) {
        console.error('First node creation error:', nodeError);
        throw new Error('Failed to create first evolution node');
      }
      
      node = firstNode;
      console.log(`Created first evolution node: ${node.node_title}`);
    }

    // === ALSO create in legacy integrator_projects table for backward compatibility ===
    const { data: project, error: projectError } = await supabase
      .from('integrator_projects')
      .insert({
        user_id: user.id,
        seed_breakthrough_id: breakthroughId || null,
        project_title: projectTitle,
        project_description: projectDescription,
        timeframe_days: timeframeDays,
        start_date: startDate.toISOString().split('T')[0],
        target_end_date: targetEndDate.toISOString().split('T')[0],
        current_phase: 'exploration',
        current_day: 1,
        status: 'active'
      })
      .select()
      .single();

    if (projectError) {
      console.error('Legacy project creation error:', projectError);
      throw new Error('Failed to create project');
    }

    // Create phases linked to both node and project
    const phasesToInsert = plan.phases.map((phase: any, index: number) => ({
      project_id: project.id,
      node_id: node.id,
      user_id: user.id,
      phase_name: phase.name,
      phase_color: PHASE_COLORS[phase.name as keyof typeof PHASE_COLORS] || '#E5E7EB',
      phase_description: phase.description,
      order_index: index,
      start_day: phase.startDay,
      end_day: phase.endDay,
      started_at: index === 0 ? new Date().toISOString() : null
    }));

    const { data: phases, error: phasesError } = await supabase
      .from('integrator_phases')
      .insert(phasesToInsert)
      .select();

    if (phasesError) {
      console.error('Phases creation error:', phasesError);
      throw new Error('Failed to create phases');
    }

    // Create a map of phase names to phase IDs
    const phaseMap = new Map(phases.map((p: any) => [p.phase_name, p.id]));

    // Create daily steps linked to both node and project
    const stepsToInsert = plan.dailySteps.map((step: any) => {
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() + step.day - 1);
      
      return {
        project_id: project.id,
        node_id: node.id,
        phase_id: phaseMap.get(step.phase),
        user_id: user.id,
        day_number: step.day,
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        step_title: step.title,
        step_description: step.description,
        encouragement: step.encouragement,
        estimated_minutes: step.minutes || 20,
        status: 'pending',
        // PDR task system additions
        why_it_matters: step.whyItMatters || null,
        hint: step.hint || null,
        action_type: step.actionType || null
      };
    });

    const { data: steps, error: stepsError } = await supabase
      .from('integrator_daily_steps')
      .insert(stepsToInsert)
      .select();

    if (stepsError) {
      console.error('Steps creation error:', stepsError);
      throw new Error('Failed to create daily steps');
    }

    // If this came from a breakthrough, mark it as converted
    if (breakthroughId) {
      await supabase
        .from('conversation_breakthroughs')
        .update({ converted_to_goal: true, goal_id: project.id })
        .eq('id', breakthroughId);
    }

    const isEvolutionResult = !!previousActiveNode;
    console.log(`Created Integrator project: ${project.id} with ${phases.length} phases and ${steps.length} steps. Is evolution: ${isEvolutionResult}`);

    return new Response(JSON.stringify({
      success: true,
      project,
      phases,
      steps,
      // PDR v2.1: Include spine and node info
      spine,
      node,
      isEvolution: isEvolutionResult,
      previousNode: previousActiveNode ? {
        id: previousActiveNode.id,
        title: previousActiveNode.node_title,
        nodeNumber: previousActiveNode.node_number
      } : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Integrator setup error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
