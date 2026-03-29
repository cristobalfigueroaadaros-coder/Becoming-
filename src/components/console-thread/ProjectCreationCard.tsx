import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProjectCreationCardProps {
  projectName: string;
  projectDescription: string;
  onProjectCreated: (projectId: string, projectName: string) => void;
}

const ProjectCreationCard = ({ projectName, projectDescription, onProjectCreated }: ProjectCreationCardProps) => {
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create project via integrator-setup
      const { data, error } = await supabase.functions.invoke("integrator-setup", {
        body: {
          projectTitle: projectName,
          projectDescription,
          timeframeDays: 30,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Project creation failed");

      const projectId = data?.project?.id || data?.projectId;
      if (!projectId) throw new Error("No project ID returned");

      // Mark first project created
      await supabase
        .from("profiles")
        .update({
          first_project_created_at: new Date().toISOString(),
          first_project_id: projectId,
          console_intake_completed: true,
        })
        .eq("id", user.id);

      setCreated(true);
      toast.success("Project created!");
      onProjectCreated(projectId, projectName);
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Project Detected</span>
        </div>

        <div>
          <h4 className="font-semibold text-foreground">{projectName}</h4>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{projectDescription}</p>
        </div>

        {!created ? (
          <Button onClick={handleCreate} disabled={creating} className="w-full gap-2" size="sm">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {creating ? "Creating..." : "Create This Project"}
          </Button>
        ) : (
          <div className="text-center text-sm text-primary font-medium py-1">
            ✨ Project Created
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectCreationCard;
