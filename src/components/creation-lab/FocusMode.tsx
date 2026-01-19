import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Sparkles, TrendingUp, Calendar, Target } from "lucide-react";
import { IntegratorCalendar } from "@/components/integrator/IntegratorCalendar";
import { IntegratorDailyStepCard } from "@/components/integrator/IntegratorDailyStepCard";
import { ProjectHeaderEditor } from "@/components/integrator/ProjectHeaderEditor";
import { CatchUpMode } from "@/components/integrator/CatchUpMode";
import { CelebrationMoment } from "@/components/integrator/CelebrationMoment";
import { CreativeSpace } from "@/components/creative-space";
import { DesignThinkingLab } from "@/components/design-thinking-lab";
import type { IntegratorProject, IntegratorPhase, IntegratorDailyStep } from "@/hooks/useIntegratorProjects";

interface FocusModeProps {
  activeProject: IntegratorProject | null;
  phases: IntegratorPhase[];
  steps: IntegratorDailyStep[];
  todaysStep: IntegratorDailyStep | undefined;
  currentPhase: IntegratorPhase | undefined;
  missedSteps: IntegratorDailyStep[];
  onCompleteStep: (stepId: string, insight?: string, feedback?: {
    win: string;
    improvement?: string;
    rating: number;
  }) => Promise<void>;
  onSkipStep: (stepId: string, reason?: string) => Promise<void>;
  onEditStep: (stepId: string, title: string, description: string) => Promise<void>;
  onRescheduleStep: (stepId: string, newDate: Date) => Promise<void>;
  onSkipMissedSteps: () => Promise<void>;
  onProjectUpdate: (updates: Partial<IntegratorProject>) => void;
}

export const FocusMode = ({
  activeProject,
  phases,
  steps,
  todaysStep,
  currentPhase,
  missedSteps,
  onCompleteStep,
  onSkipStep,
  onEditStep,
  onRescheduleStep,
  onSkipMissedSteps,
  onProjectUpdate,
}: FocusModeProps) => {
  const navigate = useNavigate();
  const [showCatchUp, setShowCatchUp] = useState(missedSteps.length >= 3);
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  const completedSteps = steps.filter(s => s.status === 'completed');

  // Calculate overall progress percentage
  const progressPercentage = steps.length > 0 
    ? Math.round((completedSteps.length / steps.length) * 100) 
    : 0;

  const handleStepComplete = async (stepId: string, insight?: string, feedback?: {
    win: string;
    improvement?: string;
    rating: number;
  }) => {
    await onCompleteStep(stepId, insight, feedback);
    
    // Show celebration with XP
    const xp = 25; // Base XP for task completion
    setEarnedXP(xp);
    setShowCelebration(true);
  };

  if (!activeProject) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-16 text-center">
          <Rocket className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Active Journey</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start a journey from a breakthrough in your mentor conversations, or run a dot connection analysis to discover new ideas.
          </p>
          <div className="flex gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={() => navigate("/chat")}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Talk to Mentors
            </Button>
            <Button 
              onClick={() => navigate("/dot-connection-engine")}
              className="gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Analyze Dots
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show catch-up mode if returning after many missed days (without guilt framing)
  if (showCatchUp && missedSteps.length >= 3) {
    return (
      <div className="space-y-6">
        <ProjectHeaderEditor
          project={activeProject}
          currentPhase={currentPhase}
          steps={steps}
          onProjectUpdate={onProjectUpdate}
        />
        
        <CatchUpMode
          missedDays={missedSteps.length}
          onResume={() => setShowCatchUp(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Celebration overlay */}
      {showCelebration && (
        <CelebrationMoment 
          xpEarned={earnedXP} 
          onDismiss={() => setShowCelebration(false)} 
        />
      )}

      {/* Project Header - Clean hierarchy without phases */}
      <ProjectHeaderEditor
        project={activeProject}
        currentPhase={currentPhase}
        steps={steps}
        onProjectUpdate={onProjectUpdate}
      />

      {/* Simple Progress Bar (replaces phase timeline) */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Target className="w-4 h-4" />
                Day {activeProject.current_day} of {activeProject.timeframe_days}
              </span>
              <span className="font-medium text-primary">{progressPercentage}% complete</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Task - Clean naming without phase reference */}
      {todaysStep && currentPhase && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Today's Task
          </h3>
          <IntegratorDailyStepCard
            step={todaysStep}
            phase={currentPhase}
            totalDays={activeProject.timeframe_days}
            onComplete={handleStepComplete}
            onSkip={onSkipStep}
            onEdit={onEditStep}
            onReschedule={onRescheduleStep}
          />
        </div>
      )}

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Your Journey Calendar
          </CardTitle>
          <CardDescription>
            Click any day to see details or add insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IntegratorCalendar
            steps={steps}
            phases={phases}
            onCompleteStep={onCompleteStep}
            currentDay={activeProject.current_day}
          />
        </CardContent>
      </Card>

      {/* Design Thinking Lab */}
      <DesignThinkingLab projectId={activeProject.id} />

      {/* Creative Space */}
      <CreativeSpace 
        projectId={activeProject.id}
        projectTitle={activeProject.project_title}
      />
    </div>
  );
};
