import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIntegratorProjects } from "@/hooks/useIntegratorProjects";
import { useSavedInsights } from "@/hooks/useSavedInsights";
import { toast } from "sonner";

export interface InsightDot {
  id: string;
  source_type: string;
  source_mentor: string | null;
  insight_text: string;
  core_theme: string;
  skill_tags: string[];
  emotional_tone: string | null;
  created_at: string;
  reviewed_at: string | null;
  user_reflection: string | null;
  connection_ids: string[];
}

export interface DotConnection {
  id: string;
  dot_id_1: string;
  dot_id_2: string;
  connection_type: string;
  connection_insight: string;
  ai_generated: boolean;
  user_notes?: string | null;
}

export interface ConstellationEntry {
  id: string;
  entry_type: string;
  title: string;
  description: string;
  key_takeaway?: string;
  related_domains?: string[];
  emotional_tone?: string;
  created_at: string;
}

export interface CreationProject {
  id: string;
  title: string;
  description: string;
  first_step: string;
  impact: string | null;
  status: string;
  progress_notes: string | null;
  dot_connections: any;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export const useCreationLabData = () => {
  // Integrator projects (Focus Mode)
  const integratorData = useIntegratorProjects();
  
  // Saved insights
  const savedInsightsData = useSavedInsights();
  
  // Constellation data
  const [insightDots, setInsightDots] = useState<InsightDot[]>([]);
  const [dotConnections, setDotConnections] = useState<DotConnection[]>([]);
  const [constellationEntries, setConstellationEntries] = useState<ConstellationEntry[]>([]);
  
  // Legacy creation projects
  const [creationProjects, setCreationProjects] = useState<CreationProject[]>([]);
  
  // User purpose
  const [userPurpose, setUserPurpose] = useState<string | null>(null);
  
  // Analysis data
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  
  // Loading state
  const [loading, setLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load insight dots
      const { data: dotsData, error: dotsError } = await supabase
        .from("insight_dots")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (dotsError) throw dotsError;

      // Load constellation entries
      const { data: entriesData, error: entriesError } = await supabase
        .from("constellation_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (entriesError) throw entriesError;

      // Transform entries to dots format for unified view
      const transformedEntries: InsightDot[] = (entriesData || []).map((entry: ConstellationEntry) => ({
        id: entry.id,
        source_type: entry.entry_type,
        source_mentor: null,
        insight_text: `${entry.title}: ${entry.description}`,
        core_theme: entry.related_domains?.[0] || "General",
        skill_tags: entry.related_domains || [],
        emotional_tone: entry.emotional_tone || null,
        created_at: entry.created_at,
        reviewed_at: null,
        user_reflection: entry.key_takeaway || null,
        connection_ids: [],
      }));

      // === NEW DATA SOURCES ===

      // 1. Fetch becoming_discoveries (Core Values, Ikigai, Strengths, My Why)
      const { data: discoveriesData } = await supabase
        .from("becoming_discoveries")
        .select("*")
        .eq("user_id", user.id);

      const discoveryDots: InsightDot[] = (discoveriesData || []).map((d: any) => {
        let parsedValue: any = {};
        try {
          parsedValue = typeof d.element_value === 'string' ? JSON.parse(d.element_value) : d.element_value;
        } catch { parsedValue = { raw: d.element_value }; }

        let insightText = '';
        if (d.discovery_type === 'core_values' && parsedValue.values) {
          insightText = `My Core Values: ${Array.isArray(parsedValue.values) ? parsedValue.values.join(', ') : parsedValue.values}`;
        } else if (d.discovery_type === 'ikigai') {
          insightText = `Ikigai Element: ${parsedValue.element || parsedValue.raw || d.element_key}`;
        } else if (d.discovery_type === 'strengths') {
          insightText = `Strength: ${parsedValue.strength || parsedValue.raw || d.element_key}`;
        } else if (d.discovery_type === 'my_why') {
          insightText = `My Why: ${parsedValue.why || parsedValue.raw || d.element_key}`;
        } else {
          insightText = `${d.discovery_type}: ${d.element_key}`;
        }

        return {
          id: d.id,
          source_type: d.discovery_type,
          source_mentor: null,
          insight_text: insightText,
          core_theme: d.discovery_type.replace(/_/g, ' ').toUpperCase(),
          skill_tags: [],
          emotional_tone: null,
          created_at: d.created_at,
          reviewed_at: null,
          user_reflection: parsedValue.reflection || null,
          connection_ids: [],
          anchor_type: 'becoming' as const,
        };
      });

      // 2. Fetch integrator_projects (Active Projects)
      const { data: integratorProjectsData } = await supabase
        .from("integrator_projects")
        .select("*")
        .eq("user_id", user.id);

      const projectDots: InsightDot[] = (integratorProjectsData || []).map((p: any) => ({
        id: p.id,
        source_type: 'project',
        source_mentor: null,
        insight_text: `Project: ${p.project_title} - ${p.project_description}`,
        core_theme: 'Active Project',
        skill_tags: [],
        emotional_tone: null,
        created_at: p.created_at,
        reviewed_at: null,
        user_reflection: p.why_this_matters || null,
        connection_ids: [],
        anchor_type: 'creating' as const,
      }));

      // 3. Fetch integrator_daily_steps with insights
      const { data: stepsData } = await supabase
        .from("integrator_daily_steps")
        .select("*")
        .eq("user_id", user.id)
        .not("insight_text", "is", null);

      const stepInsightDots: InsightDot[] = (stepsData || []).map((s: any) => ({
        id: s.id,
        source_type: 'focus_mode',
        source_mentor: null,
        insight_text: `Task: ${s.step_title} - Learning: ${s.insight_text}`,
        core_theme: 'Focus Mode Learning',
        skill_tags: [],
        emotional_tone: null,
        created_at: s.completed_at || s.created_at,
        reviewed_at: null,
        user_reflection: null,
        connection_ids: [],
        anchor_type: 'creating' as const,
      }));

      // 4. Fetch saved_insights (Mentor Perspectives)
      const { data: savedData } = await supabase
        .from("saved_insights")
        .select("*")
        .eq("user_id", user.id)
        .is("archived_at", null);

      const savedInsightDots: InsightDot[] = (savedData || []).map((s: any) => ({
        id: s.id,
        source_type: s.is_concept ? 'concept' : 'mentor_insight',
        source_mentor: s.source_mentor,
        insight_text: s.insight_text,
        core_theme: 'Mentor Perspective',
        skill_tags: [],
        emotional_tone: null,
        created_at: s.created_at,
        reviewed_at: null,
        user_reflection: null,
        connection_ids: [],
        anchor_type: 'both' as const,
      }));

      // 5. Fetch council_meetings (Resolutions & Patterns)
      const { data: councilData } = await supabase
        .from("council_meetings")
        .select("*")
        .eq("user_id", user.id);

      const councilDots: InsightDot[] = (councilData || [])
        .filter((c: any) => c.resolution || c.pattern_detected)
        .map((c: any) => ({
          id: c.id,
          source_type: 'council_meeting',
          source_mentor: null,
          insight_text: c.resolution || `Pattern: ${c.pattern_detected}`,
          core_theme: 'Council Wisdom',
          skill_tags: [],
          emotional_tone: c.emotional_tone || null,
          created_at: c.created_at,
          reviewed_at: null,
          user_reflection: null,
          connection_ids: [],
          anchor_type: 'both' as const,
        }));

      // 6. Fetch value_map_blocks (Purpose to Value Map)
      const { data: valueMapData } = await supabase
        .from("value_map_blocks")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_unlocked", true)
        .not("content", "is", null);

      const valueMapDots: InsightDot[] = (valueMapData || []).map((v: any) => ({
        id: v.id,
        source_type: 'value_map',
        source_mentor: null,
        insight_text: `${v.block_key}: ${v.content}`,
        core_theme: 'Value Map',
        skill_tags: [],
        emotional_tone: null,
        created_at: v.updated_at || v.created_at,
        reviewed_at: null,
        user_reflection: null,
        connection_ids: [],
        anchor_type: v.block_key?.includes('purpose') ? 'becoming' as const : 'creating' as const,
      }));

      // Combine ALL sources
      const allDots = [
        ...(dotsData || []),
        ...transformedEntries,
        ...discoveryDots,
        ...projectDots,
        ...stepInsightDots,
        ...savedInsightDots,
        ...councilDots,
        ...valueMapDots,
      ];
      setInsightDots(allDots);
      setConstellationEntries(entriesData || []);

      // Load connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from("dot_connections")
        .select("*")
        .eq("user_id", user.id);

      if (connectionsError) throw connectionsError;
      setDotConnections(connectionsData || []);

      // Load user purpose
      const { data: profileData } = await supabase
        .from("profiles")
        .select("main_mission")
        .eq("id", user.id)
        .single();

      setUserPurpose(profileData?.main_mission || null);

      // Load creation projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('creation_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setCreationProjects(projectsData || []);

      // Load latest analysis
      const { data: analysisData } = await supabase
        .from('dot_analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (analysisData) {
        setLatestAnalysis(analysisData);
      }
    } catch (error: any) {
      console.error("Error loading Creation Lab data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    // Reload integrator projects FIRST (for newly created projects)
    await integratorData.loadProjects();
    // Then load the rest of the data
    await loadAllData();
  }, [loadAllData, integratorData.loadProjects]);

  return {
    // Integrator data (Focus Mode)
    activeProject: integratorData.activeProject,
    setActiveProject: integratorData.setActiveProject,
    phases: integratorData.phases,
    steps: integratorData.steps,
    integratorLoading: integratorData.loading,
    completeStep: integratorData.completeStep,
    skipStep: integratorData.skipStep,
    editStep: integratorData.editStep,
    rescheduleStep: integratorData.rescheduleStep,
    getTodaysStep: integratorData.getTodaysStep,
    getCurrentPhase: integratorData.getCurrentPhase,
    getMissedSteps: integratorData.getMissedSteps,
    skipMissedSteps: integratorData.skipMissedSteps,
    createProject: integratorData.createProject,
    loadProjects: integratorData.loadProjects,
    
    // Saved insights
    savedInsights: savedInsightsData.insights,
    conceptInsights: savedInsightsData.getConceptInsights(),
    archiveInsight: savedInsightsData.archiveInsight,
    insightsLoading: savedInsightsData.loading,
    
    // Constellation data
    insightDots,
    dotConnections,
    constellationEntries,
    
    // Legacy projects
    creationProjects,
    setCreationProjects,
    
    // User purpose
    userPurpose,
    setUserPurpose,
    
    // Analysis
    latestAnalysis,
    
    // State management
    loading: loading || integratorData.loading || savedInsightsData.loading,
    refreshData,
    loadAllData,
  };
};
