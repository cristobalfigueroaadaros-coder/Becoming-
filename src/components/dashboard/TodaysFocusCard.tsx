import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Target, ChevronRight, CheckCircle2, Sparkles, Users, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIntegratorProjects } from "@/hooks/useIntegratorProjects";

const TodaysFocusCard = () => {
  const navigate = useNavigate();
  const { activeProject, activeNode, steps, getTodaysStep, completeStep, loading } = useIntegratorProjects();
  const [showInsightCapture, setShowInsightCapture] = useState(false);
  const [insightText, setInsightText] = useState("");
  const [completingStep, setCompletingStep] = useState(false);

  const todaysStep = getTodaysStep();
  const projectTitle = activeNode?.node_title || activeProject?.project_title;
  const hasActiveProject = !!(activeProject || activeNode);

  const handleCompleteStep = async () => {
    if (!todaysStep) return;
    setCompletingStep(true);
    try {
      await completeStep(todaysStep.id, insightText || undefined);
      setShowInsightCapture(false);
      setInsightText("");
      toast.success("Step completed! Your momentum is building.");
    } catch (error: any) {
      toast.error(error.message || "Failed to complete step");
    } finally {
      setCompletingStep(false);
    }
  };

  const handleWorkOnGoal = () => {
    if (todaysStep) {
      setShowInsightCapture(true);
    } else {
      navigate("/creation-lab");
    }
  };

  // No active project state
  if (!hasActiveProject && !loading) {
    return (
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Ready to Begin?</h3>
              <p className="text-muted-foreground mb-4">
                Get guidance from your Council or start creating in the Lab
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate("/council-meeting")} className="gap-2">
                <Users className="w-4 h-4" />
                Ask the Council
              </Button>
              <Button variant="outline" onClick={() => navigate("/creation-lab")} className="gap-2">
                <FlaskConical className="w-4 h-4" />
                Enter Creation Lab
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Insight capture state after clicking "Work on Today's Goal"
  if (showInsightCapture && todaysStep) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Today's Step</p>
              <h3 className="text-lg font-semibold">{todaysStep.user_edited_title || todaysStep.step_title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {todaysStep.user_edited_description || todaysStep.step_description}
              </p>
            </div>
          </div>
          
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium">Capture Your Insight</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Learning counts as progress. Take a moment to reflect. (Optional)
            </p>
            <Textarea
              placeholder="What did you learn or discover?"
              value={insightText}
              onChange={(e) => setInsightText(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleCompleteStep}
                disabled={completingStep}
                className="flex-1 gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {completingStep ? "Completing..." : "I've completed this step"}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowInsightCapture(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active project with today's step
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5 shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Project Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Project</p>
                <h3 className="font-semibold text-lg">{projectTitle}</h3>
              </div>
            </div>
          </div>

          {/* Today's Goal */}
          {todaysStep ? (
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Today's Goal</p>
              <p className="font-medium">{todaysStep.user_edited_title || todaysStep.step_title}</p>
              {(todaysStep.user_edited_description || todaysStep.step_description) && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {todaysStep.user_edited_description || todaysStep.step_description}
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-sm text-muted-foreground">
                No steps scheduled for today. Visit the Creation Lab to plan your next action.
              </p>
            </div>
          )}

          {/* CTA Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={handleWorkOnGoal}
              className="w-full gap-2 h-12 text-base"
              size="lg"
            >
              {todaysStep ? (
                <>
                  Work on Today's Goal
                  <ChevronRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  <FlaskConical className="w-5 h-5" />
                  Plan Next Steps
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaysFocusCard;
