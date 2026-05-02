import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PHASE_COLORS = {
  exploration: '#FEF9C3',
  validation: '#DBEAFE',
  creation: '#D1FAE5',
  expression: '#FED7AA',
  reflection: '#E9D5FF',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { breakthroughId, projectTitle, projectDescription, timeframeDays, isEvolution, evolutionInsight, regenerate, entryState, intakeAnswers, projectType } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check for existing active Project Spine
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

    // PDR TASK MEMORY: Fetch past task feedback for context
    const { data: pastFeedback } = await supabase
      .from('task_feedback')
      .select('insight_text, win_text, improvement_text, usefulness_rating')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate patterns from feedback
    let taskMemoryContext = '';
    if (pastFeedback && pastFeedback.length > 0) {
      const avgRating = pastFeedback.reduce((sum, f) => sum + (f.usefulness_rating || 0), 0) / pastFeedback.length;
      const highRated = pastFeedback.filter(f => (f.usefulness_rating || 0) >= 4);
      const lowRated = pastFeedback.filter(f => (f.usefulness_rating || 0) <= 2);
      
      taskMemoryContext = `
USER'S TASK HISTORY (adapt tasks based on this):
- Average usefulness rating: ${avgRating.toFixed(1)}/5
- Tasks they loved: ${highRated.slice(0, 3).map(f => f.win_text?.substring(0, 40)).filter(Boolean).join(', ') || 'None yet'}
- Improvement suggestions: ${lowRated.slice(0, 2).map(f => f.improvement_text?.substring(0, 40)).filter(Boolean).join(', ') || 'None yet'}

${avgRating < 3 ? 'ADAPT: User prefers simpler, more concrete tasks. Avoid abstract thinking tasks.' : ''}
${avgRating > 4 ? 'ADAPT: User thrives with current difficulty. Maintain this level.' : ''}
`;
    }

    const userContext = {
      displayName: profile?.display_name || 'Friend',
      mission: profile?.main_mission,
      strengths: profile?.main_strengths,
      foundationSummary: profile?.user_foundation_summary,
      lifeDomains: lifeDomains?.map(d => `${d.domain_name}: ${d.current_score}/10`).join(', ')
    };

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are The Integrator - a warm, supportive intelligence that transforms ideas into actionable projects.

Your role is to create structured project plans that are:
- Action-oriented (learning through DOING, not studying)
- Achievable (each task should feel manageable and clear)
- Motivating (each task title should make the user feel "I know exactly what to do")
- Varied (mix creating, testing, expressing, deciding, interacting - NEVER repetitive research)
- Progressive (building momentum and confidence day by day)

CRITICAL RULES:
1. NO TIME-BASED INSTRUCTIONS - Never say "spend 20 minutes" or any time reference
2. NO PASSIVE RESEARCH - Never say "research" or "study" or "read about"
3. SPECIFIC ACTIONS - Every task must produce something tangible
4. MOTIVATING TITLES - Like "Define the emotional shift this product should create" NOT "Research market needs"

TASK TYPES TO PRIORITIZE:
1. CREATE - Make something tangible (draft, prototype, sketch, write, design)
2. TEST - Try an assumption with real feedback (ask someone, send a message, run an experiment)
3. EXPRESS - Share or communicate an idea (post, present, explain to someone)
4. DECIDE - Make a clear choice between options (pick one direction, commit)
5. INTERACT - Have a real conversation or get real feedback (call, message, meet)

TASK STRUCTURE (required for each task):
- title: Clear, specific, MOTIVATING action (e.g., "Define the emotional shift this product should create")
- description: One clear action in natural language, NO time references, produces tangible output
- whyItMatters: One sentence connecting this task to their larger goal
- hint: A gentle optional suggestion (e.g., "If helpful, you could look at..." or "One way to approach this is...")
- encouragement: Personal, warm, human message
- actionType: create | test | express | decide | interact

THE FIVE PHASES (internal structure only):
1. Exploration - Quick experiments and inspiration through action
2. Validation - Real feedback from real people
3. Creation - Build, draft, prototype, develop
4. Expression - Share, launch, present to the world
5. Reflection - Review learnings, iterate

${taskMemoryContext}`;

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
      "endDay": X
    }
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
    }
  ]
}

CRITICAL REQUIREMENTS:
- Create exactly ${timeframeDays} daily tasks (one per day)
- NO time-based instructions like "spend X minutes" - EVER
- Every task produces something tangible
- Task titles are specific and motivating
- Include whyItMatters for each task
- Include hint for each task
- Include actionType for each task (create, test, express, decide, interact)
- NO passive research tasks - prioritize action and creation
- Vary task types throughout the project`;

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
    
    planText = planText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let plan;
    try {
      plan = JSON.parse(planText);
    } catch (e) {
      console.error('Failed to parse AI response:', planText);
      throw new Error('Failed to parse project plan');
    }

    const startDate = new Date();
    const targetEndDate = new Date(startDate);
    targetEndDate.setDate(targetEndDate.getDate() + timeframeDays - 1);

    let spine;
    let node;
    let previousActiveNode = null;

    // Handle regeneration: archive existing steps first
    if (regenerate && existingSpine) {
      const { data: activeNode } = await supabase
        .from('evolution_nodes')
        .select('*')
        .eq('spine_id', existingSpine.id)
        .eq('status', 'active')
        .single();

      if (activeNode) {
        // Get the project linked to this node
        const { data: activeProject } = await supabase
          .from('integrator_projects')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (activeProject) {
          // Archive existing steps
          const { data: existingSteps } = await supabase
            .from('integrator_daily_steps')
            .select('*')
            .eq('project_id', activeProject.id);

          if (existingSteps && existingSteps.length > 0) {
            const archivedSteps = existingSteps.map(step => ({
              original_step_id: step.id,
              project_id: step.project_id,
              user_id: user.id,
              day_number: step.day_number,
              step_title: step.step_title,
              step_description: step.step_description,
              encouragement: step.encouragement,
              estimated_minutes: step.estimated_minutes,
              status: step.status,
              scheduled_date: step.scheduled_date,
              insight_text: step.insight_text,
              why_it_matters: step.why_it_matters,
              hint: step.hint,
              action_type: step.action_type,
              archive_reason: 'pdr_regeneration'
            }));

            await supabase.from('archived_integrator_steps').insert(archivedSteps);
            console.log(`Archived ${archivedSteps.length} existing steps`);

            // Delete old steps
            await supabase
              .from('integrator_daily_steps')
              .delete()
              .eq('project_id', activeProject.id);

            // Delete old phases
            await supabase
              .from('integrator_phases')
              .delete()
              .eq('project_id', activeProject.id);
          }
        }
      }
    }

    // Create or use existing Project Spine
    if (existingSpine && (isEvolution === true || regenerate)) {
      spine = existingSpine;
      
      const { data: activeNode } = await supabase
        .from('evolution_nodes')
        .select('*')
        .eq('spine_id', spine.id)
        .eq('status', 'active')
        .single();
      
      if (activeNode && !regenerate) {
        previousActiveNode = activeNode;
        await supabase
          .from('evolution_nodes')
          .update({ status: 'archived' })
          .eq('id', activeNode.id);
        
        console.log(`Archived previous node: ${activeNode.node_title}`);
      }
      
      if (!regenerate) {
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
        
        if (nodeError) throw new Error('Failed to create evolution node');
        node = newNode;
      } else {
        node = activeNode;
      }
      
    } else if (existingSpine && !isEvolution) {
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
      
      if (nodeError) throw new Error('Failed to create evolution node');
      node = newNode;
      
    } else {
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
      
      if (spineError) throw new Error('Failed to create project spine');
      spine = newSpine;
      
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
      
      if (nodeError) throw new Error('Failed to create first evolution node');
      node = firstNode;
    }

    // Get or create legacy project
    let project;
    if (regenerate) {
      const { data: existingProject } = await supabase
        .from('integrator_projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (existingProject) {
        project = existingProject;
        // Reset project state
        await supabase
          .from('integrator_projects')
          .update({
            current_phase: 'exploration',
            current_day: 1,
            start_date: startDate.toISOString().split('T')[0],
            target_end_date: targetEndDate.toISOString().split('T')[0]
          })
          .eq('id', project.id);
      }
    }

    if (!project) {
      const { data: newProject, error: projectError } = await supabase
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

      if (projectError) throw new Error('Failed to create project');
      project = newProject;
    }

    const atlasProjectSlug = `project-${project.id.slice(0, 8)}`;
    const { data: existingAtlasCluster } = await supabase
      .from('atlas_clusters')
      .select('id')
      .eq('slug', atlasProjectSlug)
      .maybeSingle();

    if (!existingAtlasCluster) {
      const { data: atlasCluster, error: atlasClusterError } = await supabase
        .from('atlas_clusters')
        .insert({
          name: project.project_title,
          slug: atlasProjectSlug,
          description: project.project_description,
          sort_order: 100,
          cluster_category: 'project',
          state: 'activated'
        })
        .select('id')
        .single();

      if (atlasClusterError) throw new Error(`Failed to create Atlas cluster: ${atlasClusterError.message}`);

      const { data: atlasProjectNode, error: atlasProjectNodeError } = await supabase
        .from('atlas_project_nodes')
        .insert({
          user_id: user.id,
          title: project.project_title,
          description: project.project_description,
        })
        .select('id')
        .single();

      if (atlasProjectNodeError) throw new Error(`Failed to create Atlas project node: ${atlasProjectNodeError.message}`);

      const { error: atlasConnectionError } = await supabase
        .from('atlas_cluster_project_connections')
        .insert({
          cluster_id: atlasCluster.id,
          project_id: atlasProjectNode.id,
        });

      if (atlasConnectionError) throw new Error(`Failed to connect Atlas project cluster: ${atlasConnectionError.message}`);
    }

    // Create phases
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

    if (phasesError) throw new Error('Failed to create phases');

    const phaseMap = new Map(phases.map((p: any) => [p.phase_name, p.id]));

    // Create daily steps - NO estimated_minutes, with PDR fields
    const firstPhaseId = phases[0]?.id;
    const stepsToInsert = plan.dailySteps.map((step: any) => {
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() + step.day - 1);
      
      const resolvedPhaseId = phaseMap.get(step.phase);
      if (!resolvedPhaseId) {
        console.warn(`Phase name mismatch: "${step.phase}" not found in phases [${Array.from(phaseMap.keys()).join(', ')}]. Falling back to first phase.`);
      }
      
      return {
        project_id: project.id,
        node_id: node.id,
        phase_id: resolvedPhaseId || firstPhaseId,
        user_id: user.id,
        day_number: step.day,
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        step_title: step.title,
        step_description: step.description,
        encouragement: step.encouragement,
        estimated_minutes: 0, // Keep for backward compat, but don't use
        status: 'pending',
        why_it_matters: step.whyItMatters || null,
        hint: step.hint || null,
        action_type: step.actionType || 'create'
      };
    });

    const { data: steps, error: stepsError } = await supabase
      .from('integrator_daily_steps')
      .insert(stepsToInsert)
      .select();

    if (stepsError) throw new Error('Failed to create daily steps');

    if (breakthroughId) {
      await supabase
        .from('conversation_breakthroughs')
        .update({ converted_to_goal: true, goal_id: project.id })
        .eq('id', breakthroughId);
    }

    const isEvolutionResult = !!previousActiveNode;
    console.log(`Created Integrator project: ${project.id} with ${phases.length} phases and ${steps.length} PDR-compliant steps. Is evolution: ${isEvolutionResult}`);

    // For BUILD phase: generate tailored blocks using intake answers
    let proposedBlocks: Array<{ id: string; title: string; status: string; importance: string; children: any[] }> | null = null;
    if (entryState === "BUILD" && intakeAnswers && intakeAnswers.length >= 2) {
      try {
        const mk = () => Math.random().toString(36).slice(2, 10);
        const blocksPrompt = `You are generating a focused 30-day project structure for someone growing their existing business.

PROJECT: ${projectTitle}
WHAT THEY'RE BUILDING: ${intakeAnswers[0] || ""}
MAIN CONSTRAINT RIGHT NOW: ${intakeAnswers[1] || ""}
30-DAY WIN THEY WANT: ${intakeAnswers[2] || ""}

Generate exactly 4 execution blocks. Each block must directly attack their constraint and help them reach their 30-day win.

RULES:
- Block names must reflect the CATEGORY of work (e.g. Marketing, Content, Sales, Platform, Community) — name them for what the work IS, not abstract concepts
- Activities must be concrete and SPECIFIC to their actual business/product — not generic advice
- Activities use action verbs (Identify, Write, Test, Send, Post, Reach out to, Create, Draft, etc.)
- Everything connects to reaching their 30-day win
- Be specific (e.g. "Identify 5 family-focused Instagram accounts to partner with" not "Do influencer marketing")

Return JSON only — no markdown, no extra text:
{
  "blocks": [
    { "title": "Block Name", "activities": ["Activity 1", "Activity 2", "Activity 3"] },
    { "title": "Block Name", "activities": ["Activity 1", "Activity 2", "Activity 3"] },
    { "title": "Block Name", "activities": ["Activity 1", "Activity 2", "Activity 3"] },
    { "title": "Block Name", "activities": ["Activity 1", "Activity 2", "Activity 3"] }
  ]
}`;

        const blocksResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            messages: [{ role: 'user', content: blocksPrompt }],
          }),
        });

        if (blocksResponse.ok) {
          const blocksData = await blocksResponse.json();
          let blocksText = blocksData.choices?.[0]?.message?.content || '';
          blocksText = blocksText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(blocksText);
          if (parsed.blocks && Array.isArray(parsed.blocks)) {
            proposedBlocks = parsed.blocks.map((b: any) => ({
              id: mk(),
              title: b.title,
              status: "not_started",
              importance: "high",
              children: (b.activities || []).map((a: string) => ({
                id: mk(),
                title: a,
                status: "not_started",
                importance: "medium",
                children: [],
              })),
            }));
            console.log("Generated tailored BUILD blocks:", parsed.blocks.map((b: any) => b.title).join(", "));
          }
        }
      } catch (blockErr) {
        console.error("BUILD block generation failed (non-fatal):", blockErr);
      }
    }

    // For GROW phase: generate validation/structure blocks using intake answers
    if (entryState === "GROW" && intakeAnswers && intakeAnswers.length >= 2 && !proposedBlocks) {
      try {
        const mk = () => Math.random().toString(36).slice(2, 10);
        const growPrompt = `You are generating a focused project structure for someone in the GROW phase — they have an emerging idea or early version of something and need to validate, sharpen, and structure it.

PROJECT: ${projectTitle}
WHAT THEY'RE BUILDING / WORKING ON: ${intakeAnswers[0] || ""}
CURRENT PROGRESS OR PARTIAL VERSION: ${intakeAnswers[1] || ""}
WHAT THEY WANT TO REACH NEXT: ${intakeAnswers[2] || ""}

Generate exactly 4 blocks that move them from "partial idea" to "validated, structured concept ready to build". Each block must connect directly to their actual project — no generic advice.

RULES:
- Block names reflect the CATEGORY of work (e.g. Audience Validation, Concept Sharpening, Offer Definition, First Test, Identity & Story).
- Activities are concrete and SPECIFIC to their actual project — use action verbs (Talk to, Define, Sketch, Test, Map, Write, Refine).
- Focus on VALIDATION and STRUCTURE, not execution/scaling — they are not in BUILD yet.
- Each block has 3 activities.

Return JSON only — no markdown, no extra text:
{
  "blocks": [
    { "title": "Block Name", "activities": ["Activity 1", "Activity 2", "Activity 3"] },
    { "title": "Block Name", "activities": ["Activity 1", "Activity 2", "Activity 3"] },
    { "title": "Block Name", "activities": ["Activity 1", "Activity 2", "Activity 3"] },
    { "title": "Block Name", "activities": ["Activity 1", "Activity 2", "Activity 3"] }
  ]
}`;

        const growResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            messages: [{ role: 'user', content: growPrompt }],
          }),
        });

        if (growResponse.ok) {
          const growData = await growResponse.json();
          let growText = growData.choices?.[0]?.message?.content || '';
          growText = growText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(growText);
          if (parsed.blocks && Array.isArray(parsed.blocks)) {
            proposedBlocks = parsed.blocks.map((b: any) => ({
              id: mk(),
              title: b.title,
              status: "not_started",
              importance: "high",
              children: (b.activities || []).map((a: string) => ({
                id: mk(),
                title: a,
                status: "not_started",
                importance: "medium",
                children: [],
              })),
            }));
            console.log("Generated tailored GROW blocks:", parsed.blocks.map((b: any) => b.title).join(", "));
          }
        } else {
          const errBody = await growResponse.text().catch(() => "<unreadable>");
          console.error(`GROW block generation HTTP error status=${growResponse.status} body=${errBody.substring(0, 200)}`);
        }
      } catch (growBlockErr) {
        console.error("GROW block generation failed (non-fatal):", growBlockErr);
      }
    }

    // For DISCOVER phase: generate AI-tailored blocks using project context + project type
    if (entryState === "DISCOVER") {
      try {
        const mk = () => Math.random().toString(36).slice(2, 10);
        const resolvedType = projectType || "experience";

        const mechanicsGuidance = resolvedType === "product"
          ? "Block 5 (System Mechanics) — for a physical product: components/materials, how they interact, usage steps, what makes it tactile and real."
          : resolvedType === "digital"
          ? "Block 5 (System Mechanics) — for a digital product/app: core features, user flows, screens, what each feature enables."
          : resolvedType === "hybrid"
          ? "Block 5 (System Mechanics) — for a hybrid project: list the physical + digital components and how they connect."
          : "Block 5 (System Mechanics) — for an experience/service: the steps, exercises, facilitation flow, timing, and what makes each moment work.";

        const discoverBlocksPrompt = `You are generating a 7-block project structure for a DISCOVERY PHASE project. This user just had a breakthrough conversation and named their project. Your job is to create blocks that feel personal, specific, and actionable — NOT generic.

PROJECT NAME: ${projectTitle}
PROJECT DESCRIPTION: ${projectDescription}
PROJECT TYPE: ${resolvedType}

Generate ONLY these 4 blocks (blocks 2, 3, 6 are fixed — you generate 1, 4, 5, 7):

BLOCK 1 — Project Identity: 3 activities that anchor the project's name, purpose, and format. Make them specific to this project.
BLOCK 4 — Core Journey: 4 activities mapping the human journey from first moment to what they carry away. This is the emotional progression — NOT the mechanics.
BLOCK 5 — System Mechanics: 3 activities defining how the project actually works. ${mechanicsGuidance}
BLOCK 7 — Project System Design: 3 activities connecting everything into one coherent system (the architecture).

RULES:
- All activities must be specific to THIS project, not generic
- Activities use action verbs (Define, Map, Design, Write, Identify, Build, Test, etc.)
- Block 4 is human/emotional — phases, moments, shifts. Not tasks.
- Block 5 is structural/mechanical — components, rules, flows. Not feelings.
- Keep activities concrete and actionable

Return JSON only — no markdown, no extra text:
{
  "block1": { "title": "Project Identity", "activities": ["Activity 1", "Activity 2", "Activity 3"] },
  "block4": { "title": "Core Journey", "activities": ["Activity 1", "Activity 2", "Activity 3", "Activity 4"] },
  "block5": { "title": "System Mechanics", "activities": ["Activity 1", "Activity 2", "Activity 3"] },
  "block7": { "title": "Project System Design", "activities": ["Activity 1", "Activity 2", "Activity 3"] }
}`;

        const discoverBlocksResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            messages: [{ role: 'user', content: discoverBlocksPrompt }],
          }),
        });

        if (discoverBlocksResponse.ok) {
          const discoverData = await discoverBlocksResponse.json();
          let discoverText = discoverData.choices?.[0]?.message?.content || '';
          discoverText = discoverText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(discoverText);

          if (parsed.block1 && parsed.block4 && parsed.block5 && parsed.block7) {
            const toChildren = (activities: string[]) =>
              (activities || []).map((a: string) => ({ id: mk(), title: a, status: "not_started", importance: "medium", children: [] }));

            proposedBlocks = [
              {
                id: mk(), title: parsed.block1.title || "Project Identity", status: "not_started", importance: "high",
                children: toChildren(parsed.block1.activities),
              },
              {
                id: mk(), title: "Transformation", status: "not_started", importance: "high",
                children: [
                  { id: mk(), title: "Before — how does someone feel before they experience this?", status: "not_started", importance: "high", children: [] },
                  { id: mk(), title: "During — what shifts while they are inside this experience?", status: "not_started", importance: "high", children: [] },
                  { id: mk(), title: "After — what can they do or feel that they could not before?", status: "not_started", importance: "high", children: [] },
                ],
              },
              {
                id: mk(), title: "Ideal User", status: "not_started", importance: "high",
                children: [
                  { id: mk(), title: "Who is this person? Write a real profile", status: "not_started", importance: "high", children: [] },
                  { id: mk(), title: "What are they struggling with right now?", status: "not_started", importance: "high", children: [] },
                  { id: mk(), title: "What do they want more than anything?", status: "not_started", importance: "medium", children: [] },
                  { id: mk(), title: "Why would they pay for this?", status: "not_started", importance: "medium", children: [] },
                ],
              },
              {
                id: mk(), title: parsed.block4.title || "Core Journey", status: "not_started", importance: "high",
                children: toChildren(parsed.block4.activities),
              },
              {
                id: mk(), title: parsed.block5.title || "System Mechanics", status: "not_started", importance: "high",
                children: toChildren(parsed.block5.activities),
              },
              {
                id: mk(), title: "Interaction Design", status: "not_started", importance: "medium",
                children: [
                  { id: mk(), title: "What is the tone? (playful, serious, gentle, bold...)", status: "not_started", importance: "medium", children: [] },
                  { id: mk(), title: "What energy should someone feel while using this?", status: "not_started", importance: "medium", children: [] },
                  { id: mk(), title: "What makes this feel different from anything else?", status: "not_started", importance: "medium", children: [] },
                ],
              },
              {
                id: mk(), title: parsed.block7.title || "Project System Design", status: "not_started", importance: "medium",
                children: toChildren(parsed.block7.activities),
              },
            ];
            console.log("Generated tailored DISCOVER blocks for type:", resolvedType);
          }
        }
      } catch (discoverBlockErr) {
        console.error("DISCOVER block generation failed (non-fatal):", discoverBlockErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      project,
      phases,
      steps,
      spine,
      node,
      isEvolution: isEvolutionResult,
      regenerated: regenerate || false,
      previousNode: previousActiveNode ? {
        id: previousActiveNode.id,
        title: previousActiveNode.node_title
      } : null,
      proposedBlocks,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Integrator setup error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to setup project'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
