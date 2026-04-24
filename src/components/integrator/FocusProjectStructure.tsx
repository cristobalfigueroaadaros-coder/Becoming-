import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectStructure } from "@/components/project-engine/ProjectStructure";
import type { ProjectEngineData } from "@/pages/ProjectEngine";

interface FocusProjectStructureProps {
  projectId: string;
}

/**
 * Loads the full integrator_projects record for the given project and renders
 * the shared ProjectStructure component inline inside Focus Mode.
 */
export function FocusProjectStructure({ projectId }: FocusProjectStructureProps) {
  const [project, setProject] = useState<ProjectEngineData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("integrator_projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (!cancelled) {
        if (!error && data) setProject(data as any);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const handleUpdate = async (updates: Partial<ProjectEngineData>) => {
    if (!project) return;
    const { error } = await supabase
      .from("integrator_projects")
      .update(updates as any)
      .eq("id", project.id);
    if (!error) {
      setProject((prev) => (prev ? { ...prev, ...updates } : prev));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  return <ProjectStructure project={project} onUpdate={handleUpdate} />;
}