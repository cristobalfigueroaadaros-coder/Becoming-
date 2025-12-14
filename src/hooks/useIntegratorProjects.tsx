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
}

export function useIntegratorProjects() {
  const [projects, setProjects] = useState<IntegratorProject[]>([]);
  const [activeProject, setActiveProject] = useState<IntegratorProject | null>(null);
  const [phases, setPhases] = useState<IntegratorPhase[]>([]);
  const [steps, setSteps] = useState<IntegratorDailyStep[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('integrator_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);

      // Find active project
      const active = data?.find(p => p.status === 'active');
      if (active) {
        setActiveProject(active);
        await loadProjectDetails(active.id);
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

  const createProject = async (
    breakthroughId: string | null,
    projectTitle: string,
    projectDescription: string,
    timeframeDays: number
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('integrator-setup', {
        body: { breakthroughId, projectTitle, projectDescription, timeframeDays }
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success('Your journey has begun!');
        await loadProjects();
        return data.project;
      } else {
        throw new Error(data.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating integrator project:', error);
      toast.error('Failed to create project. Please try again.');
      throw error;
    }
  };

  const completeStep = async (stepId: string, insight?: string) => {
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

      // If there's an insight, create an insight dot
      if (insight && activeProject) {
        await supabase.from('insight_dots').insert({
          user_id: user.id,
          source_type: 'integrator_step',
          source_id: stepId,
          insight_text: insight,
          core_theme: activeProject.project_title,
          emotional_tone: 'productive'
        });
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
          }

          setActiveProject(prev => prev ? { ...prev, current_day: nextDay } : null);
        } else {
          // Project complete!
          await supabase
            .from('integrator_projects')
            .update({ status: 'completed' })
            .eq('id', activeProject.id);

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

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    activeProject,
    phases,
    steps,
    loading,
    createProject,
    completeStep,
    getTodaysStep,
    getCurrentPhase,
    loadProjects,
    loadProjectDetails
  };
}
