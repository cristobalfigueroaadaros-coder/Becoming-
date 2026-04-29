import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PhaseType, PhaseContentData, ProjectInfo, EvolutionMilestone, PhaseNote, KeyLearning, DesignThinkingIteration } from '@/components/design-thinking-lab/types';
import { PHASE_ORDER } from '@/components/design-thinking-lab/constants';

interface UseDesignThinkingLabReturn {
  phaseContent: Record<PhaseType, PhaseContentData>;
  projectInfo: ProjectInfo | null;
  evolutionTimeline: EvolutionMilestone[];
  keyLearnings: KeyLearning[];
  beforeNow: { before: string; now: string } | null;
  loading: boolean;
  error: Error | null;
  iterations: DesignThinkingIteration[];
  currentIteration: number;
  addNoteToPhase: (phase: PhaseType, note: string) => Promise<void>;
  updateReflection: (phase: PhaseType, response: string) => Promise<void>;
  addMilestone: (title: string, explanation: string, phase?: PhaseType) => Promise<void>;
  completeIteration: () => Promise<void>;
  switchIteration: (iterationNumber: number) => void;
  refetch: () => Promise<void>;
}

const makeEmptyPhaseContent = (phase: PhaseType): PhaseContentData => ({
  phase,
  notes: [],
  autoPopulatedItems: [],
});

const makeDefaultPhaseContent = (): Record<PhaseType, PhaseContentData> =>
  Object.fromEntries(PHASE_ORDER.map(p => [p, makeEmptyPhaseContent(p)])) as Record<PhaseType, PhaseContentData>;

const summarizeText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  let clean = text
    .replace(/["'].*?["']/g, '')
    .replace(/^(I think|I believe|Well,|So,|You know,)/gi, '')
    .trim();
  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }
  return clean;
};

export function useDesignThinkingLab(projectId: string): UseDesignThinkingLabReturn {
  const [phaseContent, setPhaseContent] = useState<Record<PhaseType, PhaseContentData>>(makeDefaultPhaseContent());
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [evolutionTimeline, setEvolutionTimeline] = useState<EvolutionMilestone[]>([]);
  const [keyLearnings, setKeyLearnings] = useState<KeyLearning[]>([]);
  const [beforeNow, setBeforeNow] = useState<{ before: string; now: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [iterations, setIterations] = useState<DesignThinkingIteration[]>([]);
  const [currentIteration, setCurrentIteration] = useState(1);

  const fetchEmpathizeContent = useCallback(async (userId: string): Promise<PhaseNote[]> => {
    const { data: insights } = await supabase
      .from('saved_insights')
      .select('*')
      .eq('user_id', userId)
      .in('source_mentor', ['perspective', 'empath'])
      .order('created_at', { ascending: false })
      .limit(10);

    return insights?.map(i => ({
      id: i.id,
      text: summarizeText(i.insight_text, 120),
      source: 'mentor' as const,
      sourceId: i.id,
      sourceContext: i.source_mentor || undefined,
      createdAt: i.created_at,
    })) || [];
  }, []);

  const fetchDefineContent = useCallback(async (userId: string): Promise<PhaseNote[]> => {
    const results: PhaseNote[] = [];

    const { data: nodes } = await supabase
      .from('evolution_nodes')
      .select('*')
      .eq('user_id', userId)
      .order('node_number', { ascending: true })
      .limit(5);

    nodes?.forEach(n => results.push({
      id: n.id,
      text: `Focus: ${n.node_title} - ${summarizeText(n.refined_description, 80)}`,
      source: 'task' as const,
      sourceId: n.id,
      sourceContext: `Evolution ${n.node_number}`,
      createdAt: n.created_at,
    }));

    const { data: insights } = await supabase
      .from('saved_insights')
      .select('*')
      .eq('user_id', userId)
      .in('source_mentor', ['challenger', 'perspective'])
      .order('created_at', { ascending: false })
      .limit(5);

    insights?.forEach(i => results.push({
      id: i.id,
      text: summarizeText(i.insight_text, 100),
      source: 'mentor' as const,
      sourceId: i.id,
      sourceContext: i.source_mentor || undefined,
      createdAt: i.created_at,
    }));

    return results;
  }, []);

  const fetchIdeateContent = useCallback(async (userId: string, projId: string): Promise<PhaseNote[]> => {
    const results: PhaseNote[] = [];

    const { data: breakthroughs } = await supabase
      .from('conversation_breakthroughs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    breakthroughs?.forEach(b => results.push({
      id: b.id,
      text: `${b.breakthrough_title}: ${summarizeText(b.breakthrough_description, 80)}`,
      source: 'mentor' as const,
      sourceId: b.id,
      sourceContext: b.mentor_type,
      createdAt: b.created_at,
    }));

    const { data: nameChanges } = await supabase
      .from('project_name_history')
      .select('*')
      .eq('project_id', projId)
      .eq('change_type', 'conceptual')
      .order('created_at', { ascending: false });

    nameChanges?.forEach(nc => results.push({
      id: nc.id,
      text: `Renamed: "${nc.old_name}" → "${nc.new_name}"${nc.change_reason ? ` (${nc.change_reason})` : ''}`,
      source: 'name_evolution' as const,
      sourceId: nc.id,
      createdAt: nc.created_at,
    }));

    return results;
  }, []);

  const fetchPrototypeContent = useCallback(async (projId: string): Promise<PhaseNote[]> => {
    const results: PhaseNote[] = [];

    const { data: tasks } = await supabase
      .from('integrator_daily_steps')
      .select('*')
      .eq('project_id', projId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10);

    tasks?.forEach(t => results.push({
      id: t.id,
      text: `${t.step_title}${t.insight_text ? ` → ${summarizeText(t.insight_text, 60)}` : ''}`,
      source: 'task' as const,
      sourceId: t.id,
      sourceContext: t.step_title,
      createdAt: t.completed_at || t.created_at,
    }));

    const { data: nameChanges } = await supabase
      .from('project_name_history')
      .select('*')
      .eq('project_id', projId)
      .eq('change_type', 'action_driven')
      .order('created_at', { ascending: false });

    nameChanges?.forEach(nc => results.push({
      id: nc.id,
      text: `Tested & Renamed: "${nc.old_name}" → "${nc.new_name}"`,
      source: 'name_evolution' as const,
      sourceId: nc.id,
      createdAt: nc.created_at,
    }));

    return results;
  }, []);

  const fetchTestContent = useCallback(async (userId: string, projId: string): Promise<PhaseNote[]> => {
    const results: PhaseNote[] = [];

    const { data: feedback } = await supabase
      .from('task_feedback')
      .select('*, integrator_daily_steps!inner(project_id, step_title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const projectFeedback = feedback?.filter(
      (f: any) => f.integrator_daily_steps?.project_id === projId
    );

    projectFeedback?.forEach((f: any) => results.push({
      id: f.id,
      text: `Learning: ${summarizeText(f.insight_text, 80)}${f.win_text ? ` | Win: ${summarizeText(f.win_text, 40)}` : ''}`,
      source: 'feedback' as const,
      sourceId: f.id,
      sourceContext: f.integrator_daily_steps?.step_title,
      createdAt: f.created_at,
    }));

    if (results.length === 0) {
      const { data: tasks } = await supabase
        .from('integrator_daily_steps')
        .select('*')
        .eq('project_id', projId)
        .eq('status', 'completed')
        .not('insight_text', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(5);

      tasks?.forEach(t => results.push({
        id: t.id,
        text: `Learned: ${summarizeText(t.insight_text || '', 100)}`,
        source: 'task' as const,
        sourceId: t.id,
        sourceContext: t.step_title,
        createdAt: t.completed_at || t.created_at,
      }));
    }

    return results;
  }, []);

  const fetchEvolutionTimeline = useCallback(async (userId: string, projId: string): Promise<EvolutionMilestone[]> => {
    const timeline: EvolutionMilestone[] = [];

    const { data: milestones } = await supabase
      .from('project_thread_milestones')
      .select('*')
      .eq('project_id', projId);

    milestones?.forEach(m => timeline.push({
      id: m.id,
      title: m.title,
      explanation: m.explanation || undefined,
      relatedPhase: m.related_phase as PhaseType | undefined,
      date: m.milestone_date,
      type: 'manual',
    }));

    const { data: nameChanges } = await supabase
      .from('project_name_history')
      .select('*')
      .eq('project_id', projId);

    nameChanges?.forEach(nc => timeline.push({
      id: nc.id,
      title: `Project renamed: "${nc.old_name}" → "${nc.new_name}"`,
      explanation: nc.change_reason || undefined,
      relatedPhase: nc.related_phase as PhaseType | undefined,
      date: nc.created_at,
      type: 'name_change',
      sourceData: nc,
    }));

    const { data: tasks } = await supabase
      .from('integrator_daily_steps')
      .select('*')
      .eq('project_id', projId)
      .eq('status', 'completed')
      .not('insight_text', 'is', null)
      .limit(10);

    tasks?.forEach(t => timeline.push({
      id: t.id,
      title: `Completed: ${t.step_title}`,
      explanation: t.insight_text || undefined,
      relatedPhase: 'prototype',
      date: t.completed_at || t.created_at,
      type: 'task_completed',
    }));

    return timeline.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, []);

  const fetchKeyLearnings = useCallback(async (projId: string): Promise<KeyLearning[]> => {
    const { data: completedTasks } = await supabase
      .from('integrator_daily_steps')
      .select('id, insight_text, step_title, completed_at')
      .eq('project_id', projId)
      .eq('status', 'completed')
      .not('insight_text', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5);

    return completedTasks?.map(t => ({
      id: t.id,
      text: t.insight_text || '',
      source: t.step_title,
      date: t.completed_at || new Date().toISOString(),
    })) || [];
  }, []);

  const fetchBeforeNow = useCallback(async (projId: string, currentDescription: string): Promise<{ before: string; now: string }> => {
    const { data: nodes } = await supabase
      .from('evolution_nodes')
      .select('refined_description')
      .order('node_number', { ascending: true })
      .limit(1);

    const before = nodes?.[0]?.refined_description || currentDescription;
    return { before, now: currentDescription };
  }, []);

  // Fetch iterations for the project — gracefully falls back if table doesn't exist yet
  const fetchIterations = useCallback(async (userId: string, projId: string): Promise<DesignThinkingIteration[]> => {
    try {
      const { data, error } = await (supabase as any)
        .from('design_thinking_iterations')
        .select('*')
        .eq('project_id', projId)
        .order('iteration_number', { ascending: true });

      if (error) {
        // Table may not exist yet (migration pending) — return a local fallback
        return [{ id: 'local-1', iterationNumber: 1, status: 'active', createdAt: new Date().toISOString() }];
      }

      if (!data || data.length === 0) {
        // Seed iteration 1
        const { data: seeded, error: seedError } = await (supabase as any)
          .from('design_thinking_iterations')
          .insert({ project_id: projId, user_id: userId, iteration_number: 1, status: 'active' })
          .select()
          .single();

        if (seedError) {
          return [{ id: 'local-1', iterationNumber: 1, status: 'active', createdAt: new Date().toISOString() }];
        }

        return seeded ? [{
          id: seeded.id,
          iterationNumber: 1,
          status: 'active',
          createdAt: seeded.created_at,
        }] : [{ id: 'local-1', iterationNumber: 1, status: 'active', createdAt: new Date().toISOString() }];
      }

      return data.map((row: any) => ({
        id: row.id,
        iterationNumber: row.iteration_number,
        status: row.status,
        summary: row.summary || undefined,
        completedAt: row.completed_at || undefined,
        createdAt: row.created_at,
      }));
    } catch {
      return [{ id: 'local-1', iterationNumber: 1, status: 'active', createdAt: new Date().toISOString() }];
    }
  }, []);

  const fetchData = useCallback(async (iterationNum?: number) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch iterations first
      const iterationList = await fetchIterations(user.id, projectId);
      setIterations(iterationList);

      // Use the active iteration or the one requested
      const activeIteration = iterationNum ?? (
        iterationList.find(i => i.status === 'active')?.iterationNumber ?? iterationList[iterationList.length - 1]?.iterationNumber ?? 1
      );
      setCurrentIteration(activeIteration);

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

        const beforeNowData = await fetchBeforeNow(projectId, project.project_description);
        setBeforeNow(beforeNowData);
      }

      // Fetch user-created phase content for this iteration
      // Falls back to unfiltered query if iteration_number column doesn't exist yet
      let contentData: any[] | null = null;
      const { data: contentWithIter, error: contentError } = await (supabase as any)
        .from('design_thinking_content')
        .select('*')
        .eq('project_id', projectId)
        .eq('iteration_number', activeIteration);

      if (contentError) {
        // iteration_number column may not exist yet — fetch without it
        const { data: contentFallback } = await supabase
          .from('design_thinking_content')
          .select('*')
          .eq('project_id', projectId);
        contentData = contentFallback;
      } else {
        contentData = contentWithIter;
      }

      // Auto-populated content (always global, not iteration-scoped)
      const [empathizeAuto, defineAuto, ideateAuto, prototypeAuto, testAuto] = await Promise.all([
        fetchEmpathizeContent(user.id),
        fetchDefineContent(user.id),
        fetchIdeateContent(user.id, projectId),
        fetchPrototypeContent(projectId),
        fetchTestContent(user.id, projectId),
      ]);

      const newPhaseContent = makeDefaultPhaseContent();
      newPhaseContent.empathize.autoPopulatedItems = empathizeAuto;
      newPhaseContent.define.autoPopulatedItems = defineAuto;
      newPhaseContent.ideate.autoPopulatedItems = ideateAuto;
      newPhaseContent.prototype.autoPopulatedItems = prototypeAuto;
      newPhaseContent.test.autoPopulatedItems = testAuto;

      contentData?.forEach((item: any) => {
        const phase = item.phase as PhaseType;
        if (newPhaseContent[phase]) {
          newPhaseContent[phase] = {
            ...newPhaseContent[phase],
            notes: (item.content as PhaseNote[]) || [],
            reflectionResponse: item.reflection_response || undefined,
          };
        }
      });

      setPhaseContent(newPhaseContent);

      const timeline = await fetchEvolutionTimeline(user.id, projectId);
      setEvolutionTimeline(timeline);

      const learnings = await fetchKeyLearnings(projectId);
      setKeyLearnings(learnings);

    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchIterations, fetchEmpathizeContent, fetchDefineContent, fetchIdeateContent, fetchPrototypeContent, fetchTestContent, fetchEvolutionTimeline, fetchKeyLearnings, fetchBeforeNow]);

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

    // Try with iteration_number first; fall back to without if column missing
    const { error: upsertError } = await supabase
      .from('design_thinking_content')
      .upsert({
        project_id: projectId,
        user_id: user.id,
        phase,
        iteration_number: currentIteration,
        content: updatedNotes as unknown as any,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: 'project_id,phase,iteration_number' });

    if (upsertError) {
      await supabase
        .from('design_thinking_content')
        .upsert({
          project_id: projectId,
          user_id: user.id,
          phase,
          content: updatedNotes as unknown as any,
          updated_at: new Date().toISOString(),
        } as any, { onConflict: 'project_id,phase' });
    }

    // Always update local state
    setPhaseContent(prev => ({
      ...prev,
      [phase]: { ...prev[phase], notes: updatedNotes }
    }));
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
        iteration_number: currentIteration,
        reflection_response: response,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: 'project_id,phase,iteration_number' });

    if (upsertError) {
      await supabase
        .from('design_thinking_content')
        .upsert({
          project_id: projectId,
          user_id: user.id,
          phase,
          reflection_response: response,
          updated_at: new Date().toISOString(),
        } as any, { onConflict: 'project_id,phase' });
    }

    setPhaseContent(prev => ({
      ...prev,
      [phase]: { ...prev[phase], reflectionResponse: response }
    }));
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

  // Complete the current iteration: call edge function for AI summary, unlock next iteration
  const completeIteration = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Call edge function to generate AI summary
      const { data: summaryData, error: fnError } = await supabase.functions.invoke('generate-iteration-summary', {
        body: { projectId, iterationNumber: currentIteration },
      });

      const summary = !fnError && summaryData?.summary ? summaryData.summary : null;

      // Mark current iteration as completed
      await (supabase as any)
        .from('design_thinking_iterations')
        .update({
          status: 'completed',
          summary,
          completed_at: new Date().toISOString(),
        })
        .eq('project_id', projectId)
        .eq('iteration_number', currentIteration);

      const nextIterationNumber = currentIteration + 1;

      // Create next iteration
      await (supabase as any)
        .from('design_thinking_iterations')
        .insert({
          project_id: projectId,
          user_id: user.id,
          iteration_number: nextIterationNumber,
          status: 'active',
        });

      // Refresh everything with new iteration
      await fetchData(nextIterationNumber);
    } catch (err) {
      console.error('Failed to complete iteration:', err);
    }
  };

  const switchIteration = (iterationNumber: number) => {
    fetchData(iterationNumber);
  };

  return {
    phaseContent,
    projectInfo,
    evolutionTimeline,
    keyLearnings,
    beforeNow,
    loading,
    error,
    iterations,
    currentIteration,
    addNoteToPhase,
    updateReflection,
    addMilestone,
    completeIteration,
    switchIteration,
    refetch: fetchData,
  };
}
