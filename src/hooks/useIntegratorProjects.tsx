import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface IntegratorProject {
  id: string;
  user_id: string;
  seed_breakthrough_id: string | null;
  project_title: string;
  project_description: string;
  timeframe_days: number;
  start_date: string;
  target_end_date: string;
  current_phase: string;
  current_day: number;
  status: string;
  completion_summary: string | null;
  why_this_matters?: string | null;
  learning_insights_count?: number;
  created_at: string;
  updated_at: string;
}

export interface IntegratorPhase {
  id: string;
  project_id: string;
  phase_name: string;
  phase_color: string;
  phase_description: string;
  order_index: number;
  start_day: number;
  end_day: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface IntegratorDailyStep {
  id: string;
  project_id: string;
  phase_id: string;
  day_number: number;
  scheduled_date: string;
  step_title: string;
  step_description: string;
  encouragement: string;
  estimated_minutes: number;
  status: string;
  completed_at: string | null;
  insight_text: string | null;
  insight_shared_with_mentors: boolean;
  reflection_question?: string | null;
  user_edited_title?: string | null;
  user_edited_description?: string | null;
  skip_reason?: string | null;
  rescheduled_from?: string | null;
  // PDR task system additions
  why_it_matters?: string | null;
  hint?: string | null;
  action_type?: string | null;
}

// PDR v2.1: Project Spine type
export interface ProjectSpine {
  id: string;
  user_id: string;
  spine_title: string;
  core_intention: string;
  broad_contribution: string | null;
  start_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// PDR v2.1: Evolution Node type
export interface EvolutionNode {
  id: string;
  spine_id: string;
  parent_node_id: string | null;
  user_id: string;
  node_number: number;
  node_title: string;
  refined_description: string;
  evolution_insight: string | null;
  timeframe_days: number;
  start_date: string;
  target_end_date: string;
  current_phase: string;
  current_day: number;
  status: string;
  completion_summary: string | null;
  why_this_matters: string | null;
  learning_insights_count: number;
  seed_breakthrough_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useIntegratorProjects() {
  const [projects, setProjects] = useState<IntegratorProject[]>([]);
  const [activeProject, setActiveProject] = useState<IntegratorProject | null>(null);
  const [phases, setPhases] = useState<IntegratorPhase[]>([]);
  const [steps, setSteps] = useState<IntegratorDailyStep[]>([]);
  const [loading, setLoading] = useState(true);
  
  // PDR v2.1: Spine and Node state
  const [activeSpine, setActiveSpine] = useState<ProjectSpine | null>(null);
  const [activeNode, setActiveNode] = useState<EvolutionNode | null>(null);
  const [nodeHistory, setNodeHistory] = useState<EvolutionNode[]>([]);
  
  // Track current user ID to detect session changes and prevent stale data
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load legacy projects
      const { data, error } = await supabase
        .from('integrator_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);

      // Find active project - explicitly check user_id matches to prevent stale data
      const active = data?.find(p => p.status === 'active' && p.user_id === user.id);
      if (active) {
        setActiveProject(active);
        setCurrentUserId(user.id);
        await loadProjectDetails(active.id);
      }

      // PDR v2.1: Load active spine and nodes
      const { data: spineData } = await supabase
        .from('project_spines')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (spineData) {
        setActiveSpine(spineData);
        
        // Load active node
        const { data: activeNodeData } = await supabase
          .from('evolution_nodes')
          .select('*')
          .eq('spine_id', spineData.id)
          .eq('status', 'active')
          .single();
        
        if (activeNodeData) {
          setActiveNode(activeNodeData);
        }

        // Load node history
        const { data: nodeHistoryData } = await supabase
          .from('evolution_nodes')
          .select('*')
          .eq('spine_id', spineData.id)
          .order('node_number', { ascending: true });
        
        if (nodeHistoryData) {
          setNodeHistory(nodeHistoryData);
        }
      }
    } catch (error) {
      console.error('Error loading integrator projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProjectDetails = async (projectId: string) => {
    try {
      // Load phases
      const { data: phasesData, error: phasesError } = await supabase
        .from('integrator_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');

      if (phasesError) throw phasesError;
      setPhases(phasesData || []);

      // Load steps
      const { data: stepsData, error: stepsError } = await supabase
        .from('integrator_daily_steps')
        .select('*')
        .eq('project_id', projectId)
        .order('day_number');

      if (stepsError) throw stepsError;
      setSteps(stepsData || []);
    } catch (error) {
      console.error('Error loading project details:', error);
    }
  };

  // PDR v2.1: Enhanced createProject that supports evolution
  const createProject = async (
    breakthroughId: string | null,
    projectTitle: string,
    projectDescription: string,
    timeframeDays: number,
    isEvolution?: boolean,
    evolutionInsight?: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('integrator-setup', {
        body: { 
          breakthroughId, 
          projectTitle, 
          projectDescription, 
          timeframeDays,
          isEvolution: isEvolution || false,
          evolutionInsight
        }
      });

      if (error) throw error;
      
      if (data.success) {
        // PDR v2.1: Different success messages for evolution vs first project
        if (data.isEvolution) {
          toast.success('Your vision is evolving!');
        } else {
          toast.success('Your journey has begun!');
        }
        
        await loadProjects();
        return {
          project: data.project,
          spine: data.spine,
          node: data.node,
          isEvolution: data.isEvolution,
          previousNode: data.previousNode
        };
      } else {
        throw new Error(data.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating integrator project:', error);
      toast.error('Failed to create project. Please try again.');
      throw error;
    }
  };

  const completeStep = async (stepId: string, insight?: string, feedback?: {
    win: string;
    improvement?: string;
    rating: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updateData: any = {
        status: 'completed',
        completed_at: new Date().toISOString()
      };

      if (insight) {
        updateData.insight_text = insight;
        updateData.insight_shared_with_mentors = true;
      }

      const { error } = await supabase
        .from('integrator_daily_steps')
        .update(updateData)
        .eq('id', stepId);

      if (error) throw error;

      // Save task feedback if provided (PDR system)
      if (feedback && insight) {
        await supabase.from('task_feedback').insert({
          user_id: user.id,
          step_id: stepId,
          insight_text: insight,
          win_text: feedback.win,
          improvement_text: feedback.improvement || null,
          usefulness_rating: feedback.rating
        });
      }

      // If there's an insight, create an insight dot and update learning count
      if (insight && activeProject) {
        const completedStep = steps.find(s => s.id === stepId);
        const stepPhase = completedStep ? phases.find(p => p.id === completedStep.phase_id) : null;
        
        await supabase.from('insight_dots').insert({
          user_id: user.id,
          source_type: 'integrator_step',
          source_id: stepId,
          insight_text: insight,
          core_theme: activeProject.project_title,
          emotional_tone: 'productive',
          skill_tags: stepPhase ? [stepPhase.phase_name, 'focus_mode'] : ['focus_mode'],
          vibrational_context: {
            project_id: activeProject.id,
            project_title: activeProject.project_title,
            phase_name: stepPhase?.phase_name || activeProject.current_phase,
            step_title: completedStep?.step_title || '',
            timeframe_days: activeProject.timeframe_days,
            // PDR v2.1: Include spine and node context
            spine_id: activeSpine?.id,
            node_id: activeNode?.id,
            node_number: activeNode?.node_number
          }
        });

        // Increment learning insights count
        await supabase
          .from('integrator_projects')
          .update({ 
            learning_insights_count: ((activeProject as any).learning_insights_count || 0) + 1 
          })
          .eq('id', activeProject.id);

        // PDR v2.1: Also update evolution node's learning count
        if (activeNode) {
          await supabase
            .from('evolution_nodes')
            .update({
              learning_insights_count: (activeNode.learning_insights_count || 0) + 1
            })
            .eq('id', activeNode.id);
        }
      }

      // Update local state
      setSteps(prev => prev.map(s => 
        s.id === stepId 
          ? { ...s, status: 'completed', completed_at: new Date().toISOString(), insight_text: insight || null }
          : s
      ));

      // Check if we need to update current day or phase
      const completedStep = steps.find(s => s.id === stepId);
      if (completedStep && activeProject) {
        const nextDay = completedStep.day_number + 1;
        const nextStep = steps.find(s => s.day_number === nextDay);
        
        if (nextStep) {
          // Update current day
          await supabase
            .from('integrator_projects')
            .update({ current_day: nextDay })
            .eq('id', activeProject.id);

          // PDR v2.1: Also update evolution node
          if (activeNode) {
            await supabase
              .from('evolution_nodes')
              .update({ current_day: nextDay })
              .eq('id', activeNode.id);
          }

          // Check if we're entering a new phase
          const currentPhase = phases.find(p => p.id === completedStep.phase_id);
          const nextPhase = phases.find(p => p.id === nextStep.phase_id);
          
          if (currentPhase && nextPhase && currentPhase.id !== nextPhase.id) {
            // Mark current phase as completed
            await supabase
              .from('integrator_phases')
              .update({ completed_at: new Date().toISOString() })
              .eq('id', currentPhase.id);

            // Mark next phase as started
            await supabase
              .from('integrator_phases')
              .update({ started_at: new Date().toISOString() })
              .eq('id', nextPhase.id);

            // Update project current phase
            await supabase
              .from('integrator_projects')
              .update({ current_phase: nextPhase.phase_name })
              .eq('id', activeProject.id);

            // PDR v2.1: Also update evolution node
            if (activeNode) {
              await supabase
                .from('evolution_nodes')
                .update({ current_phase: nextPhase.phase_name })
                .eq('id', activeNode.id);
            }
          }

          setActiveProject(prev => prev ? { ...prev, current_day: nextDay } : null);
        } else {
          // Project complete!
          await supabase
            .from('integrator_projects')
            .update({ status: 'completed' })
            .eq('id', activeProject.id);

          // PDR v2.1: Also complete the evolution node
          if (activeNode) {
            await supabase
              .from('evolution_nodes')
              .update({ status: 'completed' })
              .eq('id', activeNode.id);
          }

          toast.success('🎉 Congratulations! You completed your journey!');
        }
      }

      toast.success(insight ? 'Step completed with insight!' : 'Step completed!');
    } catch (error) {
      console.error('Error completing step:', error);
      toast.error('Failed to complete step');
      throw error;
    }
  };

  const skipStep = async (stepId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('integrator_daily_steps')
        .update({
          status: 'skipped',
          skip_reason: reason || null
        })
        .eq('id', stepId);

      if (error) throw error;

      setSteps(prev => prev.map(s => 
        s.id === stepId 
          ? { ...s, status: 'skipped', skip_reason: reason || null }
          : s
      ));

      toast.success('Step skipped');
    } catch (error) {
      console.error('Error skipping step:', error);
      toast.error('Failed to skip step');
      throw error;
    }
  };

  const editStep = async (stepId: string, title: string, description: string) => {
    try {
      const { error } = await supabase
        .from('integrator_daily_steps')
        .update({
          user_edited_title: title,
          user_edited_description: description
        })
        .eq('id', stepId);

      if (error) throw error;

      setSteps(prev => prev.map(s => 
        s.id === stepId 
          ? { ...s, user_edited_title: title, user_edited_description: description }
          : s
      ));

      toast.success('Step updated');
    } catch (error) {
      console.error('Error editing step:', error);
      toast.error('Failed to update step');
      throw error;
    }
  };

  const rescheduleStep = async (stepId: string, newDate: Date) => {
    try {
      const step = steps.find(s => s.id === stepId);
      if (!step) return;

      const { error } = await supabase
        .from('integrator_daily_steps')
        .update({
          rescheduled_from: step.scheduled_date,
          scheduled_date: newDate.toISOString().split('T')[0]
        })
        .eq('id', stepId);

      if (error) throw error;

      setSteps(prev => prev.map(s => 
        s.id === stepId 
          ? { ...s, rescheduled_from: s.scheduled_date, scheduled_date: newDate.toISOString().split('T')[0] }
          : s
      ));

      toast.success('Step rescheduled');
    } catch (error) {
      console.error('Error rescheduling step:', error);
      toast.error('Failed to reschedule step');
      throw error;
    }
  };

  const getMissedSteps = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return steps.filter(s => 
      s.scheduled_date < today && 
      s.status !== 'completed' && 
      s.status !== 'skipped'
    );
  }, [steps]);

  const skipMissedSteps = async () => {
    const missed = getMissedSteps();
    for (const step of missed) {
      await supabase
        .from('integrator_daily_steps')
        .update({ status: 'skipped', skip_reason: 'Missed - auto-skipped on return' })
        .eq('id', step.id);
    }
    setSteps(prev => prev.map(s => 
      missed.find(m => m.id === s.id)
        ? { ...s, status: 'skipped', skip_reason: 'Missed - auto-skipped on return' }
        : s
    ));
    toast.success(`Skipped ${missed.length} missed steps`);
  };

  const getTodaysStep = useCallback(() => {
    if (!activeProject) return null;
    
    const today = new Date().toISOString().split('T')[0];
    return steps.find(s => s.scheduled_date === today && s.status !== 'completed') 
      || steps.find(s => s.status !== 'completed');
  }, [steps, activeProject]);

  const getCurrentPhase = useCallback(() => {
    const todaysStep = getTodaysStep();
    if (!todaysStep) return null;
    return phases.find(p => p.id === todaysStep.phase_id);
  }, [phases, getTodaysStep]);

  // Clear stale data and reload when user changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const newUserId = session?.user?.id || null;
        
        // User changed - clear old data immediately to prevent stale renders
        if (newUserId !== currentUserId) {
          setProjects([]);
          setActiveProject(null);
          setPhases([]);
          setSteps([]);
          setActiveSpine(null);
          setActiveNode(null);
          setNodeHistory([]);
          setCurrentUserId(newUserId);
          
          if (newUserId) {
            loadProjects();
          } else {
            setLoading(false);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [currentUserId, loadProjects]);

  // Initial load
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    activeProject,
    setActiveProject,
    phases,
    steps,
    loading,
    createProject,
    completeStep,
    skipStep,
    editStep,
    rescheduleStep,
    getTodaysStep,
    getCurrentPhase,
    getMissedSteps,
    skipMissedSteps,
    loadProjects,
    loadProjectDetails,
    // PDR v2.1: Expose spine and node data
    activeSpine,
    activeNode,
    nodeHistory,
  };
}
