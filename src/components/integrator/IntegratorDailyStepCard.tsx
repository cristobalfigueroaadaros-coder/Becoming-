import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Check, Sparkles, ChevronRight } from "lucide-react";

interface DailyStep {
  id: string;
  day_number: number;
  step_title: string;
  step_description: string;
  encouragement: string;
  estimated_minutes: number;
  status: string;
}

interface Phase {
  phase_name: string;
  phase_color: string;
}

interface IntegratorDailyStepCardProps {
  step: DailyStep;
  phase: Phase;
  totalDays: number;
  onComplete: (stepId: string, insight?: string) => void;
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
  isLoading = false
}: IntegratorDailyStepCardProps) {
  const [showInsight, setShowInsight] = useState(false);
  const [insight, setInsight] = useState("");

  const handleComplete = () => {
    onComplete(step.id, insight);
    setInsight("");
    setShowInsight(false);
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
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {step.estimated_minutes} min
            </div>
          </div>
          <CardTitle className="text-lg mt-2">
            Day {step.day_number}/{totalDays}: {step.step_title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.step_description}
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

          {showInsight ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <Textarea
                value={insight}
                onChange={(e) => setInsight(e.target.value)}
                placeholder="What did you learn or discover? This insight will be shared with your mentors..."
                className="resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowInsight(false)}
                >
                  Skip
                </Button>
                <Button 
                  size="sm"
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Saving...' : 'Complete with Insight'}
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => setShowInsight(true)}
              >
                Add Insight First
              </Button>
              <Button 
                className="flex-1 gap-2"
                onClick={() => onComplete(step.id)}
                disabled={isLoading}
              >
                {isLoading ? 'Completing...' : (
                  <>
                    Complete Step
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
