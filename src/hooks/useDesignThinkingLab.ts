import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PhaseType, PhaseContentData, ProjectInfo, EvolutionMilestone, PhaseNote, KeyLearning } from '@/components/design-thinking-lab/types';

interface UseDesignThinkingLabReturn {
  phaseContent: Record<PhaseType, PhaseContentData>;
  projectInfo: ProjectInfo | null;
  evolutionTimeline: EvolutionMilestone[];
  keyLearnings: KeyLearning[];
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

// Helper: Summarize text to max length (no quotes, no dialogue patterns)
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
  const [phaseContent, setPhaseContent] = useState<Record<PhaseType, PhaseContentData>>(defaultPhaseContent);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [evolutionTimeline, setEvolutionTimeline] = useState<EvolutionMilestone[]>([]);
  const [keyLearnings, setKeyLearnings] = useState<KeyLearning[]>([]);
  const [beforeNow, setBeforeNow] = useState<{ before: string; now: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch auto-populated content for EMPATHIZE phase
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

  // Fetch auto-populated content for DEFINE phase
  const fetchDefineContent = useCallback(async (userId: string): Promise<PhaseNote[]> => {
    const results: PhaseNote[] = [];

    // Get evolution nodes (show how definition evolved)
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

    // Get insights from challenger/perspective mentors
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

  // Fetch auto-populated content for IDEATE phase
  const fetchIdeateContent = useCallback(async (userId: string, projId: string): Promise<PhaseNote[]> => {
    const results: PhaseNote[] = [];

    // Get conversation breakthroughs
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

    // Get name changes (conceptual type)
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

  // Fetch auto-populated content for PROTOTYPE phase (directly connected to daily tasks)
  const fetchPrototypeContent = useCallback(async (projId: string): Promise<PhaseNote[]> => {
    const results: PhaseNote[] = [];

    // Get completed daily tasks
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

    // Get name changes (action-driven type)
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

  // Fetch auto-populated content for TEST phase
  const fetchTestContent = useCallback(async (userId: string, projId: string): Promise<PhaseNote[]> => {
    const results: PhaseNote[] = [];

    // Get task feedback with insights
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

    // Also get completed tasks with insights (if no feedback table data)
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

  // Fetch evolution timeline from multiple sources
  const fetchEvolutionTimeline = useCallback(async (userId: string, projId: string): Promise<EvolutionMilestone[]> => {
    const timeline: EvolutionMilestone[] = [];

    // 1. Manual milestones
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

    // 2. Name changes
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

    // 3. Significant task completions (tasks with insights)
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

    // Sort by date descending
    return timeline.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, []);

  // Fetch key learnings
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

  // Fetch before/now comparison
  const fetchBeforeNow = useCallback(async (projId: string, currentDescription: string): Promise<{ before: string; now: string }> => {
    // Try to get first name from history
    const { data: nameHistory } = await supabase
      .from('project_name_history')
      .select('old_name')
      .eq('project_id', projId)
      .order('created_at', { ascending: true })
      .limit(1);

    // Get evolution nodes for original description
    const { data: nodes } = await supabase
      .from('evolution_nodes')
      .select('refined_description')
      .order('node_number', { ascending: true })
      .limit(1);

    const before = nodes?.[0]?.refined_description || currentDescription;
    
    return { before, now: currentDescription };
  }, []);

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

        // Fetch before/now
        const beforeNowData = await fetchBeforeNow(projectId, project.project_description);
        setBeforeNow(beforeNowData);
      }

      // Fetch user-created phase content
      const { data: contentData } = await supabase
        .from('design_thinking_content')
        .select('*')
        .eq('project_id', projectId);

      // Fetch auto-populated content for each phase
      const [empathizeAuto, defineAuto, ideateAuto, prototypeAuto, testAuto] = await Promise.all([
        fetchEmpathizeContent(user.id),
        fetchDefineContent(user.id),
        fetchIdeateContent(user.id, projectId),
        fetchPrototypeContent(projectId),
        fetchTestContent(user.id, projectId),
      ]);

      // Build phase content combining user notes and auto-populated
      const newPhaseContent = { ...defaultPhaseContent };
      
      // Set auto-populated items
      newPhaseContent.empathize.autoPopulatedItems = empathizeAuto;
      newPhaseContent.define.autoPopulatedItems = defineAuto;
      newPhaseContent.ideate.autoPopulatedItems = ideateAuto;
      newPhaseContent.prototype.autoPopulatedItems = prototypeAuto;
      newPhaseContent.test.autoPopulatedItems = testAuto;

      // Merge user-created notes
      contentData?.forEach((item: any) => {
        const phase = item.phase as PhaseType;
        newPhaseContent[phase] = {
          ...newPhaseContent[phase],
          notes: (item.content as PhaseNote[]) || [],
          reflectionResponse: item.reflection_response || undefined,
        };
      });

      setPhaseContent(newPhaseContent);

      // Fetch evolution timeline
      const timeline = await fetchEvolutionTimeline(user.id, projectId);
      setEvolutionTimeline(timeline);

      // Fetch key learnings
      const learnings = await fetchKeyLearnings(projectId);
      setKeyLearnings(learnings);

    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchEmpathizeContent, fetchDefineContent, fetchIdeateContent, fetchPrototypeContent, fetchTestContent, fetchEvolutionTimeline, fetchKeyLearnings, fetchBeforeNow]);

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
