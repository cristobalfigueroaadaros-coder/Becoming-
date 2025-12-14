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

      // Combine both sources
      const allDots = [...(dotsData || []), ...transformedEntries];
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

  const refreshData = useCallback(() => {
    setLoading(true);
    loadAllData();
  }, [loadAllData]);

  return {
    // Integrator data (Focus Mode)
    activeProject: integratorData.activeProject,
    phases: integratorData.phases,
    steps: integratorData.steps,
    integratorLoading: integratorData.loading,
    completeStep: integratorData.completeStep,
    getTodaysStep: integratorData.getTodaysStep,
    getCurrentPhase: integratorData.getCurrentPhase,
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
