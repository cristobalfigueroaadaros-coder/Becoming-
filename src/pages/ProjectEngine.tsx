import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
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
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem("payment_popup_shown");
    const shownAt = shown ? parseInt(shown, 10) : 0;
    if (shownAt && Date.now() - shownAt < 24 * 60 * 60 * 1000) return;
    const timer = setTimeout(() => setShowPayment(true), 7000);
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

  const handleActivityStatusChange = (activityId: string, status: string) => {
    if (!project) return;
    const structure = Array.isArray(project.project_structure) ? project.project_structure : [];
    const updateRecursive = (nodes: any[]): any[] =>
      nodes.map((n: any) =>
        n.id === activityId ? { ...n, status } : { ...n, children: updateRecursive(n.children || []) }
      );
    updateProject({ project_structure: updateRecursive(structure) } as any);
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
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <Button variant="ghost" size="sm" onClick={() => navigate("/creation-lab")} className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Project title + phase — hero header, no card wrapper */}
        <ProjectCoreHeader project={project} onUpdate={updateProject} />

        {/* Primary focus: structure */}
        <ProjectStructure project={project} onUpdate={updateProject} />

        {/* Daily actions derived from structure */}
        <DailyGoals
          structure={structure}
          projectTitle={project.project_title}
          onActivityStatusChange={handleActivityStatusChange}
        />

        {/* Brief — collapsed when filled */}
        <ProjectDefinition project={project} onUpdate={updateProject} />

        {/* Secondary details — collapsed by default */}
        <div className="rounded-xl border border-border/30 overflow-hidden">
          <button
            onClick={() => setShowDetails(d => !d)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
          >
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details & context</span>
            <ChevronDown
              className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", showDetails && "rotate-180")}
            />
          </button>

          <AnimatePresence initial={false}>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-5 pt-1">
                  <ProjectContext project={project} onUpdate={updateProject} />
                  <WeeklyFocus project={project} onUpdate={updateProject} />
                  <SprintTasks projectId={project.id} />
                  <ConnectedInsights projectId={project.id} userId={project.user_id} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <PaymentModal open={showPayment} onClose={() => setShowPayment(false)} />
    </div>
  );
}
