import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Sparkles, TrendingUp, Clock, Calendar } from "lucide-react";
import { IntegratorPhaseTimeline } from "@/components/integrator/IntegratorPhaseTimeline";
import { IntegratorCalendar } from "@/components/integrator/IntegratorCalendar";
import { IntegratorDailyStepCard } from "@/components/integrator/IntegratorDailyStepCard";
import { ProjectHeaderEditor } from "@/components/integrator/ProjectHeaderEditor";
import { CatchUpMode } from "@/components/integrator/CatchUpMode";
import type { IntegratorProject, IntegratorPhase, IntegratorDailyStep } from "@/hooks/useIntegratorProjects";

interface FocusModeProps {
  activeProject: IntegratorProject | null;
  phases: IntegratorPhase[];
  steps: IntegratorDailyStep[];
  todaysStep: IntegratorDailyStep | undefined;
  currentPhase: IntegratorPhase | undefined;
  missedSteps: IntegratorDailyStep[];
  onCompleteStep: (stepId: string, insight?: string) => Promise<void>;
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

  // Show catch-up mode if returning after many missed days
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
          onCompress={() => {
            // For now, just resume - compression would require AI regeneration
            setShowCatchUp(false);
          }}
          onSkipMissed={async () => {
            await onSkipMissedSteps();
            setShowCatchUp(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header with Progress */}
      <ProjectHeaderEditor
        project={activeProject}
        currentPhase={currentPhase}
        steps={steps}
        onProjectUpdate={onProjectUpdate}
      />

      {/* Phase Timeline */}
      <Card>
        <CardContent className="pt-6">
          <IntegratorPhaseTimeline
            phases={phases}
            currentDay={activeProject.current_day}
            totalDays={activeProject.timeframe_days}
          />
        </CardContent>
      </Card>

      {/* Today's Step */}
      {todaysStep && currentPhase && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Today's Step
          </h3>
          <IntegratorDailyStepCard
            step={todaysStep}
            phase={currentPhase}
            totalDays={activeProject.timeframe_days}
            onComplete={onCompleteStep}
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
    </div>
  );
};
