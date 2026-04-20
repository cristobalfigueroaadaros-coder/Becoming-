import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCoreHeader } from "@/components/project-engine/ProjectCoreHeader";
import { ProjectDefinition } from "@/components/project-engine/ProjectDefinition";
import { ProjectContext } from "@/components/project-engine/ProjectContext";
import { ProjectStructure } from "@/components/project-engine/ProjectStructure";
import { WeeklyFocus } from "@/components/project-engine/WeeklyFocus";
import { SprintTasks } from "@/components/project-engine/SprintTasks";
import { ConnectedInsights } from "@/components/project-engine/ConnectedInsights";
import { DailyGoals } from "@/components/project-engine/DailyGoals";
import { PaymentModal } from "@/components/PaymentModal";

export interface ProjectEngineData {
  id: string;
  project_title: string;
  project_description: string;
  project_brief: string | null;
  project_maturity_stage: string | null;
  project_constraints: any;
  weekly_focus_intent: string | null;
  project_structure: any;
  current_phase: string;
  status: string;
  current_day: number;
  timeframe_days: number;
  why_this_matters: string | null;
  user_id: string;
}

export default function ProjectEngine() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectEngineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("payment_popup_shown")) return;
    const timer = setTimeout(() => setShowPayment(true), 12000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (id) loadProject(id);
  }, [id]);

  const loadProject = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("integrator_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data as any);
    } catch (err) {
      console.error("Failed to load project:", err);
      toast.error("Project not found");
      navigate("/creation-lab");
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (updates: Partial<ProjectEngineData>) => {
    if (!project) return;
    try {
      const { error } = await supabase
        .from("integrator_projects")
        .update(updates as any)
        .eq("id", project.id);
      if (error) throw error;
      setProject(prev => prev ? { ...prev, ...updates } : prev);
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to save changes");
    }
  };

  // Handler for daily goals updating activity status in structure
  const handleActivityStatusChange = (activityId: string, status: string) => {
    if (!project) return;
    const structure = Array.isArray(project.project_structure) ? project.project_structure : [];
    
    const updateRecursive = (nodes: any[]): any[] => {
      return nodes.map((n: any) => {
        if (n.id === activityId) return { ...n, status };
        return { ...n, children: updateRecursive(n.children || []) };
      });
    };

    const updated = updateRecursive(structure);
    updateProject({ project_structure: updated } as any);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return null;

  const structure = Array.isArray(project.project_structure) ? project.project_structure : [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/creation-lab")} className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <h1 className="text-center text-xl font-semibold text-primary">Project Engine</h1>

        <ProjectCoreHeader project={project} onUpdate={updateProject} />
        <ProjectDefinition project={project} onUpdate={updateProject} />
        <ProjectContext project={project} onUpdate={updateProject} />
        <ProjectStructure project={project} onUpdate={updateProject} />
        
        {/* Daily Goals derived from structure */}
        <DailyGoals
          structure={structure}
          projectTitle={project.project_title}
          onActivityStatusChange={handleActivityStatusChange}
        />

        <WeeklyFocus project={project} onUpdate={updateProject} />
        <SprintTasks projectId={project.id} />
        <ConnectedInsights projectId={project.id} userId={project.user_id} />
      </div>

      <PaymentModal open={showPayment} onClose={() => setShowPayment(false)} />
    </div>
  );
}
