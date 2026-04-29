import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X, Heart, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DualProgressRing } from "./DualProgressRing";
import type { IntegratorProject, IntegratorPhase, IntegratorDailyStep } from "@/hooks/useIntegratorProjects";

interface ProjectHeaderEditorProps {
  project: IntegratorProject;
  currentPhase: IntegratorPhase | undefined;
  steps: IntegratorDailyStep[];
  onProjectUpdate: (updates: Partial<IntegratorProject>) => void;
}

export function ProjectHeaderEditor({
  project,
  currentPhase,
  steps,
  onProjectUpdate
}: ProjectHeaderEditorProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(project.project_title);
  const [editedDescription, setEditedDescription] = useState(project.project_description);
  const [editedWhyMatters, setEditedWhyMatters] = useState((project as any).why_this_matters || "");
  const [isSaving, setIsSaving] = useState(false);

  // Calculate progress
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const stepsWithInsights = steps.filter(s => s.insight_text).length;
  const totalSteps = steps.length;
  
  const completionProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const learningProgress = totalSteps > 0 ? (stepsWithInsights / totalSteps) * 100 : 0;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('integrator_projects')
        .update({
          project_title: editedTitle,
          project_description: editedDescription,
          why_this_matters: editedWhyMatters
        })
        .eq('id', project.id);

      if (error) throw error;

      onProjectUpdate({
        project_title: editedTitle,
        project_description: editedDescription,
      });
      
      setIsEditing(false);
      toast.success('Project updated');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedTitle(project.project_title);
    setEditedDescription(project.project_description);
    setEditedWhyMatters((project as any).why_this_matters || "");
    setIsEditing(false);
  };

  return (
    <Card className="overflow-hidden">
      <div 
        className="h-2"
        style={{ backgroundColor: currentPhase?.phase_color || 'hsl(var(--primary))' }}
      />
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Project Info */}
          <div className="flex-1 space-y-3">
            {isEditing ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-xl font-bold"
                  placeholder="Project Title"
                />
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="resize-none"
                  rows={2}
                  placeholder="What are you building or exploring?"
                />
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    Why this matters
                  </label>
                  <Input
                    value={editedWhyMatters}
                    onChange={(e) => setEditedWhyMatters(e.target.value)}
                    placeholder="One sentence about why this project is meaningful to you..."
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    <Check className="w-4 h-4 mr-1" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      {project.project_title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{project.project_description}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/project/${project.id}`)}
                      title="Open Project Engine"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {(project as any).why_this_matters && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <Heart className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-primary/80 italic">
                      {(project as any).why_this_matters}
                    </p>
                  </motion.div>
                )}

                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="capitalize"
                    style={{ 
                      backgroundColor: currentPhase?.phase_color ? `${currentPhase.phase_color}60` : undefined 
                    }}
                  >
                    {project.current_phase}
                  </Badge>
                  <Badge variant="outline">
                    Day {project.current_day} / {project.timeframe_days}
                  </Badge>
                </div>
              </>
            )}
          </div>

          {/* Right: Progress Rings */}
          {!isEditing && (
            <div className="flex-shrink-0">
              <DualProgressRing
                completionProgress={completionProgress}
                learningProgress={learningProgress}
                completedSteps={completedSteps}
                stepsWithInsights={stepsWithInsights}
                totalSteps={totalSteps}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
