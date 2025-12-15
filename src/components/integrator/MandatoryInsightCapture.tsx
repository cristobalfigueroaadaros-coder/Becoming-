import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Lightbulb, AlertCircle } from "lucide-react";

interface MandatoryInsightCaptureProps {
  phaseName: string;
  reflectionQuestion?: string;
  onComplete: (insight: string) => void;
  onReflectionOnly?: () => void;
  isLoading?: boolean;
}

const PHASE_QUESTIONS: Record<string, string> = {
  exploration: "What surprised you or challenged your assumptions today?",
  validation: "What evidence did you gather? What did it tell you?",
  creation: "What did you build or produce? What did you learn from making it?",
  expression: "How did others respond? What feedback resonated with you?",
  reflection: "What would you do differently? What will you carry forward?"
};

const MIN_INSIGHT_LENGTH = 20;

export function MandatoryInsightCapture({
  phaseName,
  reflectionQuestion,
  onComplete,
  onReflectionOnly,
  isLoading = false
}: MandatoryInsightCaptureProps) {
  const [insight, setInsight] = useState("");
  const [showError, setShowError] = useState(false);

  const question = reflectionQuestion || PHASE_QUESTIONS[phaseName] || "What did you learn?";
  const isValid = insight.trim().length >= MIN_INSIGHT_LENGTH;

  const handleComplete = () => {
    if (!isValid) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onComplete(insight);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6 space-y-4">
          {/* Reflection Prompt */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Capture Your Insight</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Learning counts as progress. Take a moment to reflect.
              </p>
            </div>
          </div>

          {/* Question */}
          <div className="p-3 rounded-lg bg-background border">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{question}</p>
            </div>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <Textarea
              value={insight}
              onChange={(e) => {
                setInsight(e.target.value);
                if (showError && e.target.value.length >= MIN_INSIGHT_LENGTH) {
                  setShowError(false);
                }
              }}
              placeholder="Write your insight here... What did you discover, learn, or realize?"
              className={`resize-none ${showError ? 'border-destructive' : ''}`}
              rows={4}
            />
            <div className="flex items-center justify-between">
              <span className={`text-xs ${insight.length < MIN_INSIGHT_LENGTH ? 'text-muted-foreground' : 'text-green-600'}`}>
                {insight.length}/{MIN_INSIGHT_LENGTH} min characters
              </span>
              {showError && (
                <span className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Please share a bit more
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {onReflectionOnly && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onReflectionOnly}
                disabled={insight.length < 100}
                className="text-xs"
              >
                Complete with reflection only
              </Button>
            )}
            <Button 
              className="flex-1"
              onClick={handleComplete}
              disabled={isLoading || !isValid}
            >
              {isLoading ? 'Saving...' : 'Complete Step with Insight'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
