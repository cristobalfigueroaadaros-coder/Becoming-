import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Clock, X, MessageSquare, SkipForward, CalendarClock } from "lucide-react";
import { MicroGuide } from "@/components/MicroGuide";
import { format, parseISO, isToday, isBefore } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MandatoryInsightCapture } from "./MandatoryInsightCapture";

interface DailyStep {
  id: string;
  day_number: number;
  scheduled_date: string;
  step_title: string;
  step_description: string;
  encouragement: string;
  estimated_minutes: number;
  status: string;
  insight_text: string | null;
  phase_id: string;
  reflection_question?: string | null;
  user_edited_title?: string | null;
  user_edited_description?: string | null;
  skip_reason?: string | null;
  rescheduled_from?: string | null;
}

interface Phase {
  id: string;
  phase_name: string;
  phase_color: string;
}

interface IntegratorCalendarProps {
  steps: DailyStep[];
  phases: Phase[];
  onCompleteStep: (stepId: string, insight?: string) => Promise<void>;
  currentDay: number;
}

export function IntegratorCalendar({ 
  steps, 
  phases, 
  onCompleteStep,
  currentDay 
}: IntegratorCalendarProps) {
  const [selectedStep, setSelectedStep] = useState<DailyStep | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const getPhaseColor = (phaseId: string): string => {
    const phase = phases.find(p => p.id === phaseId);
    return phase?.phase_color || '#E5E7EB';
  };

  const getPhaseName = (phaseId: string): string => {
    const phase = phases.find(p => p.id === phaseId);
    return phase?.phase_name || 'unknown';
  };

  const getStepStatus = (step: DailyStep): 'completed' | 'today' | 'upcoming' | 'missed' | 'skipped' => {
    if (step.status === 'completed') return 'completed';
    if (step.status === 'skipped') return 'skipped';
    const stepDate = parseISO(step.scheduled_date);
    if (isToday(stepDate)) return 'today';
    if (isBefore(stepDate, new Date()) && step.status !== 'completed') return 'missed';
    return 'upcoming';
  };

  const handleCompleteStep = async (insight: string) => {
    if (!selectedStep) return;
    setIsCompleting(true);
    await onCompleteStep(selectedStep.id, insight);
    setIsCompleting(false);
    setSelectedStep(null);
  };

  // Organize steps into weeks for display
  const weeks: DailyStep[][] = [];
  let currentWeek: DailyStep[] = [];
  
  steps.forEach((step, index) => {
    currentWeek.push(step);
    if ((index + 1) % 7 === 0 || index === steps.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  // Get display values
  const getDisplayTitle = (step: DailyStep) => step.user_edited_title || step.step_title;
  const getDisplayDescription = (step: DailyStep) => step.user_edited_description || step.step_description;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <MicroGuide
          guideKey="journey_calendar"
          title="Your Journey Calendar"
          description={"This calendar shows the tasks you need to complete during the upcoming days.\n\nIt helps you stay accountable and maintain consistent progress."}
        />
      </div>
      {/* Calendar Grid */}
      <div className="space-y-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((step) => {
              const status = getStepStatus(step);
              const phaseColor = getPhaseColor(step.phase_id);
              
              return (
                <motion.button
                  key={step.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedStep(step)}
                  className={`relative aspect-square rounded-lg p-1 transition-all border ${
                    status === 'today' 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  style={{
                    backgroundColor: status === 'completed' ? `${phaseColor}60` : 
                                    status === 'skipped' ? 'hsl(var(--muted))' :
                                    status === 'missed' ? 'hsl(var(--destructive) / 0.1)' : undefined
                  }}
                >
                  {/* Day number */}
                  <div className="text-xs font-medium">{step.day_number}</div>
                  
                  {/* Status icon */}
                  <div className="absolute bottom-1 right-1">
                    {status === 'completed' && (
                      <Check className="w-3 h-3 text-green-600" />
                    )}
                    {status === 'today' && (
                      <Clock className="w-3 h-3 text-primary animate-pulse" />
                    )}
                    {status === 'missed' && (
                      <X className="w-3 h-3 text-destructive/50" />
                    )}
                    {status === 'skipped' && (
                      <SkipForward className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>

                  {/* Insight indicator */}
                  {step.insight_text && (
                    <div className="absolute top-1 right-1">
                      <MessageSquare className="w-2.5 h-2.5 text-primary" />
                    </div>
                  )}

                  {/* Rescheduled indicator */}
                  {step.rescheduled_from && (
                    <div className="absolute top-1 left-1">
                      <CalendarClock className="w-2.5 h-2.5 text-amber-500" />
                    </div>
                  )}
                </motion.button>
              );
            })}
            {/* Fill empty cells for incomplete weeks */}
            {week.length < 7 && [...Array(7 - week.length)].map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Check className="w-3 h-3 text-green-600" />
          <span>Done</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-primary" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <X className="w-3 h-3 text-destructive/50" />
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-1">
          <SkipForward className="w-3 h-3 text-muted-foreground" />
          <span>Skipped</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3 text-primary" />
          <span>Insight</span>
        </div>
      </div>

      {/* Step Detail Dialog */}
      <Dialog open={!!selectedStep} onOpenChange={() => setSelectedStep(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedStep && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getPhaseColor(selectedStep.phase_id) }}
                  />
                  Day {selectedStep.day_number}: {getDisplayTitle(selectedStep)}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-foreground">{getDisplayDescription(selectedStep)}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedStep.estimated_minutes} minutes
                  </p>
                </div>

                {selectedStep.encouragement && (
                  <div className="p-3 rounded-lg bg-primary/10 text-sm italic">
                    "{selectedStep.encouragement}"
                  </div>
                )}

                {selectedStep.skip_reason && (
                  <div className="p-3 rounded-lg bg-muted text-sm">
                    <span className="text-xs font-medium text-muted-foreground">Skip reason: </span>
                    {selectedStep.skip_reason}
                  </div>
                )}

                {getStepStatus(selectedStep) !== 'completed' && getStepStatus(selectedStep) !== 'skipped' && (
                  <MandatoryInsightCapture
                    phaseName={getPhaseName(selectedStep.phase_id)}
                    reflectionQuestion={selectedStep.reflection_question || undefined}
                    onComplete={handleCompleteStep}
                    isLoading={isCompleting}
                  />
                )}

                {selectedStep.insight_text && (
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Your insight:</div>
                    <p className="text-sm">{selectedStep.insight_text}</p>
                  </div>
                )}

                {(getStepStatus(selectedStep) === 'completed' || getStepStatus(selectedStep) === 'skipped') && (
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setSelectedStep(null)}>
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
