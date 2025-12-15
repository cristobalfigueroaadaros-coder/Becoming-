import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Check, Sparkles, ChevronRight } from "lucide-react";
import { StepActionsMenu } from "./StepActionsMenu";
import { MandatoryInsightCapture } from "./MandatoryInsightCapture";

interface DailyStep {
  id: string;
  day_number: number;
  step_title: string;
  step_description: string;
  encouragement: string;
  estimated_minutes: number;
  status: string;
  scheduled_date: string;
  reflection_question?: string | null;
  user_edited_title?: string | null;
  user_edited_description?: string | null;
}

interface Phase {
  phase_name: string;
  phase_color: string;
}

interface IntegratorDailyStepCardProps {
  step: DailyStep;
  phase: Phase;
  totalDays: number;
  onComplete: (stepId: string, insight?: string) => Promise<void>;
  onSkip: (stepId: string, reason?: string) => Promise<void>;
  onEdit: (stepId: string, title: string, description: string) => Promise<void>;
  onReschedule: (stepId: string, newDate: Date) => Promise<void>;
  isLoading?: boolean;
}

const PHASE_EMOJIS: Record<string, string> = {
  exploration: '🔍',
  validation: '✓',
  creation: '🔨',
  expression: '📢',
  reflection: '💭',
};

export function IntegratorDailyStepCard({
  step,
  phase,
  totalDays,
  onComplete,
  onSkip,
  onEdit,
  onReschedule,
  isLoading = false
}: IntegratorDailyStepCardProps) {
  const [showInsightCapture, setShowInsightCapture] = useState(false);

  // Use edited values if available
  const displayTitle = step.user_edited_title || step.step_title;
  const displayDescription = step.user_edited_description || step.step_description;

  const handleComplete = async (insight: string) => {
    await onComplete(step.id, insight);
    setShowInsightCapture(false);
  };

  if (step.status === 'completed') {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">Today's step completed!</p>
              <p className="text-sm text-muted-foreground">Great work. See you tomorrow.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step.status === 'skipped') {
    return (
      <Card className="border-muted bg-muted/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Step skipped</p>
              <p className="text-sm text-muted-foreground">Moving to the next step...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="overflow-hidden border-2"
        style={{ borderColor: `${phase.phase_color}80` }}
      >
        <div 
          className="h-1"
          style={{ backgroundColor: phase.phase_color }}
        />
        
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{PHASE_EMOJIS[phase.phase_name] || '📍'}</span>
              <span 
                className="text-xs px-2 py-0.5 rounded-full capitalize"
                style={{ 
                  backgroundColor: `${phase.phase_color}40`,
                  color: phase.phase_color === '#FEF9C3' ? '#854D0E' : undefined
                }}
              >
                {phase.phase_name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {step.estimated_minutes} min
              </div>
              <StepActionsMenu
                stepId={step.id}
                stepTitle={displayTitle}
                stepDescription={displayDescription}
                scheduledDate={step.scheduled_date}
                onEdit={onEdit}
                onSkip={onSkip}
                onReschedule={onReschedule}
              />
            </div>
          </div>
          <CardTitle className="text-lg mt-2">
            Day {step.day_number}/{totalDays}: {displayTitle}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {displayDescription}
          </p>

          {step.encouragement && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-3 rounded-lg bg-primary/5 border border-primary/20"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm italic text-primary/80">
                  {step.encouragement}
                </p>
              </div>
            </motion.div>
          )}

          {showInsightCapture ? (
            <MandatoryInsightCapture
              phaseName={phase.phase_name}
              reflectionQuestion={step.reflection_question || undefined}
              onComplete={handleComplete}
              isLoading={isLoading}
            />
          ) : (
            <Button 
              className="w-full gap-2"
              onClick={() => setShowInsightCapture(true)}
            >
              I've completed this step
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
