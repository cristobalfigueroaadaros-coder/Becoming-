import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ChevronRight, ChevronDown, Lightbulb } from "lucide-react";
import { StepActionsMenu } from "./StepActionsMenu";
import { TaskCompletionFlow } from "./TaskCompletionFlow";

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
  why_it_matters?: string | null;
  hint?: string | null;
}

interface Phase {
  phase_name: string;
  phase_color: string;
}

interface IntegratorDailyStepCardProps {
  step: DailyStep;
  phase: Phase;
  totalDays: number;
  onComplete: (stepId: string, insight?: string, feedback?: {
    win: string;
    improvement?: string;
    rating: number;
  }) => Promise<void>;
  onSkip: (stepId: string, reason?: string) => Promise<void>;
  onEdit: (stepId: string, title: string, description: string) => Promise<void>;
  onReschedule: (stepId: string, newDate: Date) => Promise<void>;
  isLoading?: boolean;
}

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
  const [showCompletionFlow, setShowCompletionFlow] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Use edited values if available
  const displayTitle = step.user_edited_title || step.step_title;
  const displayDescription = step.user_edited_description || step.step_description;

  const handleComplete = async (data: {
    insight: string;
    win: string;
    improvement?: string;
    rating: number;
  }) => {
    await onComplete(step.id, data.insight, {
      win: data.win,
      improvement: data.improvement,
      rating: data.rating
    });
    setShowCompletionFlow(false);
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
              <p className="font-medium text-green-700 dark:text-green-400">Today's task completed!</p>
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
              <p className="font-medium text-muted-foreground">Task skipped</p>
              <p className="text-sm text-muted-foreground">Moving to the next one...</p>
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
      <Card className="overflow-hidden border-2 border-primary/20">
        <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
        
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Day {step.day_number} of {totalDays}
            </span>
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
          <CardTitle className="text-lg mt-2">
            {displayTitle}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* What to do */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {displayDescription}
          </p>

          {/* Why it matters */}
          {step.why_it_matters && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm text-primary/80">
                <span className="font-medium">Why this matters:</span> {step.why_it_matters}
              </p>
            </div>
          )}

          {/* Encouragement message */}
          {step.encouragement && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm italic text-muted-foreground">
                  {step.encouragement}
                </p>
              </div>
            </motion.div>
          )}

          {/* Optional Hint (expandable) */}
          {step.hint && (
            <div>
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Need a hint?</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showHint ? 'rotate-180' : ''}`} />
              </button>
              {showHint && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 text-sm text-muted-foreground pl-6"
                >
                  {step.hint}
                </motion.p>
              )}
            </div>
          )}

          {showCompletionFlow ? (
            <TaskCompletionFlow
              stepTitle={displayTitle}
              onComplete={handleComplete}
              isLoading={isLoading}
            />
          ) : (
            <Button 
              className="w-full gap-2"
              onClick={() => setShowCompletionFlow(true)}
            >
              Complete & Reflect
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
