import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PhaseType, PhaseContentData, ProjectInfo, EvolutionMilestone, PhaseNote } from '@/components/design-thinking-lab/types';

interface UseDesignThinkingLabReturn {
  phaseContent: Record<PhaseType, PhaseContentData>;
  projectInfo: ProjectInfo | null;
  evolutionTimeline: EvolutionMilestone[];
  keyLearnings: string[];
  beforeNow: { before: string; now: string } | null;
  loading: boolean;
  error: Error | null;
  addNoteToPhase: (phase: PhaseType, note: string) => Promise<void>;
  updateReflection: (phase: PhaseType, response: string) => Promise<void>;
  addMilestone: (title: string, explanation: string, phase?: PhaseType) => Promise<void>;
  refetch: () => Promise<void>;
}

const emptyPhaseContent: PhaseContentData = {
  phase: 'empathize',
  notes: [],
  autoPopulatedItems: [],
};

const defaultPhaseContent: Record<PhaseType, PhaseContentData> = {
  empathize: { ...emptyPhaseContent, phase: 'empathize' },
  define: { ...emptyPhaseContent, phase: 'define' },
  ideate: { ...emptyPhaseContent, phase: 'ideate' },
  prototype: { ...emptyPhaseContent, phase: 'prototype' },
  test: { ...emptyPhaseContent, phase: 'test' },
};

export function useDesignThinkingLab(projectId: string): UseDesignThinkingLabReturn {
  const [phaseContent, setPhaseContent] = useState<Record<PhaseType, PhaseContentData>>(defaultPhaseContent);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [evolutionTimeline, setEvolutionTimeline] = useState<EvolutionMilestone[]>([]);
  const [keyLearnings, setKeyLearnings] = useState<string[]>([]);
  const [beforeNow, setBeforeNow] = useState<{ before: string; now: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch project info
      const { data: project } = await supabase
        .from('integrator_projects')
        .select('id, project_title, project_description, why_this_matters')
        .eq('id', projectId)
        .single();

      if (project) {
        setProjectInfo({
          id: project.id,
          title: project.project_title,
          description: project.project_description,
          currentFocus: project.why_this_matters || undefined,
        });
        setBeforeNow({
          before: project.project_description,
          now: project.project_description, // Will be updated with evolution data in PDR 2
        });
      }

      // Fetch phase content
      const { data: contentData } = await supabase
        .from('design_thinking_content')
        .select('*')
        .eq('project_id', projectId);

      if (contentData) {
        const newPhaseContent = { ...defaultPhaseContent };
        contentData.forEach((item: any) => {
          const phase = item.phase as PhaseType;
          newPhaseContent[phase] = {
            phase,
            notes: (item.content as PhaseNote[]) || [],
            reflectionResponse: item.reflection_response || undefined,
            autoPopulatedItems: [], // Will be populated in PDR 2
          };
        });
        setPhaseContent(newPhaseContent);
      }

      // Fetch milestones
      const { data: milestones } = await supabase
        .from('project_thread_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('milestone_date', { ascending: false });

      if (milestones) {
        setEvolutionTimeline(milestones.map((m: any) => ({
          id: m.id,
          title: m.title,
          explanation: m.explanation,
          relatedPhase: m.related_phase as PhaseType | undefined,
          date: m.milestone_date,
          type: 'manual' as const,
        })));
      }

      // Fetch key learnings from completed tasks
      const { data: completedTasks } = await supabase
        .from('integrator_daily_steps')
        .select('insight_text')
        .eq('project_id', projectId)
        .eq('status', 'completed')
        .not('insight_text', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (completedTasks) {
        setKeyLearnings(completedTasks.map((t: any) => t.insight_text).filter(Boolean));
      }

    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addNoteToPhase = async (phase: PhaseType, noteText: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newNote: PhaseNote = {
      id: crypto.randomUUID(),
      text: noteText,
      source: 'manual',
      createdAt: new Date().toISOString(),
    };

    const currentNotes = phaseContent[phase].notes || [];
    const updatedNotes = [...currentNotes, newNote];

    const { error: upsertError } = await supabase
      .from('design_thinking_content')
      .upsert({
        project_id: projectId,
        user_id: user.id,
        phase,
        content: updatedNotes as unknown as any,
        updated_at: new Date().toISOString(),
      } as any, {
        onConflict: 'project_id,phase'
      });

    if (!upsertError) {
      setPhaseContent(prev => ({
        ...prev,
        [phase]: { ...prev[phase], notes: updatedNotes }
      }));
    }
  };

  const updateReflection = async (phase: PhaseType, response: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: upsertError } = await supabase
      .from('design_thinking_content')
      .upsert({
        project_id: projectId,
        user_id: user.id,
        phase,
        reflection_response: response,
        updated_at: new Date().toISOString(),
      } as any, {
        onConflict: 'project_id,phase'
      });

    if (!upsertError) {
      setPhaseContent(prev => ({
        ...prev,
        [phase]: { ...prev[phase], reflectionResponse: response }
      }));
    }
  };

  const addMilestone = async (title: string, explanation: string, phase?: PhaseType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: insertError } = await supabase
      .from('project_thread_milestones')
      .insert({
        project_id: projectId,
        user_id: user.id,
        title,
        explanation,
        related_phase: phase,
      })
      .select()
      .single();

    if (!insertError && data) {
      setEvolutionTimeline(prev => [{
        id: data.id,
        title: data.title,
        explanation: data.explanation,
        relatedPhase: data.related_phase as PhaseType | undefined,
        date: data.milestone_date,
        type: 'manual',
      }, ...prev]);
    }
  };

  return {
    phaseContent,
    projectInfo,
    evolutionTimeline,
    keyLearnings,
    beforeNow,
    loading,
    error,
    addNoteToPhase,
    updateReflection,
    addMilestone,
    refetch: fetchData,
  };
}
