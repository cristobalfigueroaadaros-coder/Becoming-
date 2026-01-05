import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Trophy, RefreshCw, Star, AlertCircle, ChevronRight, Sparkles } from "lucide-react";

interface TaskCompletionFlowProps {
  stepTitle: string;
  onComplete: (data: {
    insight: string;
    win: string;
    improvement?: string;
    rating: number;
  }) => void;
  isLoading?: boolean;
}

type FlowStep = 'insight' | 'win' | 'improvement' | 'rating';

const INSIGHT_PROMPTS = [
  "What did you notice while doing this?",
  "What shifted in your thinking?",
  "What surprised you?",
  "What became clearer?",
];

const WIN_PROMPTS = [
  "What was your win today?",
  "What are you proud of from this step?",
  "What did you accomplish?",
];

const MIN_INSIGHT_LENGTH = 20;
const MIN_WIN_LENGTH = 15;

export function TaskCompletionFlow({
  stepTitle,
  onComplete,
  isLoading = false
}: TaskCompletionFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('insight');
  const [insight, setInsight] = useState("");
  const [win, setWin] = useState("");
  const [improvement, setImprovement] = useState("");
  const [rating, setRating] = useState(0);
  const [showError, setShowError] = useState(false);

  // Random prompts for variety
  const insightPrompt = INSIGHT_PROMPTS[Math.floor(Math.random() * INSIGHT_PROMPTS.length)];
  const winPrompt = WIN_PROMPTS[Math.floor(Math.random() * WIN_PROMPTS.length)];

  const handleNextStep = () => {
    if (currentStep === 'insight') {
      if (insight.trim().length < MIN_INSIGHT_LENGTH) {
        setShowError(true);
        return;
      }
      setShowError(false);
      setCurrentStep('win');
    } else if (currentStep === 'win') {
      if (win.trim().length < MIN_WIN_LENGTH) {
        setShowError(true);
        return;
      }
      setShowError(false);
      setCurrentStep('improvement');
    } else if (currentStep === 'improvement') {
      setCurrentStep('rating');
    } else if (currentStep === 'rating') {
      if (rating === 0) {
        setShowError(true);
        return;
      }
      onComplete({
        insight: insight.trim(),
        win: win.trim(),
        improvement: improvement.trim() || undefined,
        rating
      });
    }
  };

  const handleSkipImprovement = () => {
    setCurrentStep('rating');
  };

  const renderStepIndicator = () => {
    const steps = ['insight', 'win', 'improvement', 'rating'];
    const currentIndex = steps.indexOf(currentStep);
    
    return (
      <div className="flex items-center justify-center gap-2 mb-4">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`w-2 h-2 rounded-full transition-all ${
              index <= currentIndex ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6 space-y-4">
          {renderStepIndicator()}

          <AnimatePresence mode="wait">
            {/* Step 1: Insight Capture */}
            {currentStep === 'insight' && (
              <motion.div
                key="insight"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Capture Your Insight</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insightPrompt}
                    </p>
                  </div>
                </div>

                <Textarea
                  value={insight}
                  onChange={(e) => {
                    setInsight(e.target.value);
                    if (showError && e.target.value.length >= MIN_INSIGHT_LENGTH) {
                      setShowError(false);
                    }
                  }}
                  placeholder="What did you discover, learn, or realize?"
                  className={`resize-none ${showError ? 'border-destructive' : ''}`}
                  rows={3}
                />
                
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${insight.length < MIN_INSIGHT_LENGTH ? 'text-muted-foreground' : 'text-green-600'}`}>
                    {insight.length}/{MIN_INSIGHT_LENGTH} min
                  </span>
                  {showError && (
                    <span className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Share a bit more
                    </span>
                  )}
                </div>

                <Button 
                  className="w-full gap-2"
                  onClick={handleNextStep}
                >
                  Next: Capture Your Win
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* Step 2: Win Capture */}
            {currentStep === 'win' && (
              <motion.div
                key="win"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Claim Your Win</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {winPrompt}
                    </p>
                  </div>
                </div>

                <Textarea
                  value={win}
                  onChange={(e) => {
                    setWin(e.target.value);
                    if (showError && e.target.value.length >= MIN_WIN_LENGTH) {
                      setShowError(false);
                    }
                  }}
                  placeholder="Name what you achieved, no matter how small..."
                  className={`resize-none ${showError ? 'border-destructive' : ''}`}
                  rows={3}
                />
                
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${win.length < MIN_WIN_LENGTH ? 'text-muted-foreground' : 'text-green-600'}`}>
                    {win.length}/{MIN_WIN_LENGTH} min
                  </span>
                  {showError && (
                    <span className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Share your win
                    </span>
                  )}
                </div>

                <Button 
                  className="w-full gap-2"
                  onClick={handleNextStep}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* Step 3: Improvement (Optional) */}
            {currentStep === 'improvement' && (
              <motion.div
                key="improvement"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">What Could Be Improved?</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Optional: Anything you'd do differently next time?
                    </p>
                  </div>
                </div>

                <Textarea
                  value={improvement}
                  onChange={(e) => setImprovement(e.target.value)}
                  placeholder="Leave blank to skip..."
                  className="resize-none"
                  rows={2}
                />

                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={handleSkipImprovement}
                  >
                    Skip
                  </Button>
                  <Button 
                    className="flex-1 gap-2"
                    onClick={handleNextStep}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Usefulness Rating */}
            {currentStep === 'rating' && (
              <motion.div
                key="rating"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">How useful was this task?</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      This helps us create better tasks for you.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center gap-3 py-4">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => {
                        setRating(value);
                        setShowError(false);
                      }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${
                        rating === value 
                          ? 'bg-primary text-primary-foreground scale-110' 
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>

                {showError && (
                  <p className="text-xs text-destructive text-center flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Please select a rating
                  </p>
                )}

                <Button 
                  className="w-full gap-2"
                  onClick={handleNextStep}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    'Completing...'
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Complete Task
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
