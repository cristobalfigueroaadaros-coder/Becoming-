import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowRight, Compass, Sparkles, RefreshCw } from "lucide-react";
import { useVoiceOfSystem, VoiceGuidance } from "@/hooks/useVoiceOfSystem";

interface VoiceOfSystemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Stage = 'grounding' | 'processing' | 'guidance';

const QUICK_OPTIONS = [
  { label: "Don't know what's next", value: "I don't know what to do next" },
  { label: "Feeling overwhelmed", value: "I feel overwhelmed and can't focus" },
  { label: "Questioning direction", value: "I'm not sure if I'm on the right path" },
  { label: "Stuck on execution", value: "I know what to do but can't seem to start" },
];

export const VoiceOfSystemModal = ({ open, onOpenChange }: VoiceOfSystemModalProps) => {
  const [stage, setStage] = useState<Stage>('grounding');
  const [userInput, setUserInput] = useState("");
  const { analyzeAndGuide, executeHandoff, isProcessing, guidance, error, reset } = useVoiceOfSystem();

  const handleSubmit = async () => {
    if (!userInput.trim()) return;
    
    setStage('processing');
    const result = await analyzeAndGuide(userInput.trim());
    
    if (result) {
      setStage('guidance');
    } else {
      // Error occurred, go back to grounding
      setStage('grounding');
    }
  };

  const handleHandoff = async () => {
    if (guidance) {
      await executeHandoff(guidance);
      handleClose();
    }
  };

  const handleClose = () => {
    setStage('grounding');
    setUserInput("");
    reset();
    onOpenChange(false);
  };

  const handleQuickOption = (value: string) => {
    setUserInput(value);
  };

  const handleRetry = () => {
    setStage('grounding');
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <AnimatePresence mode="wait">
          {stage === 'grounding' && (
            <motion.div
              key="grounding"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Compass className="w-5 h-5 text-primary" />
                  </div>
                  <DialogTitle className="text-xl">What's Next?</DialogTitle>
                </div>
              </DialogHeader>

              <p className="text-muted-foreground">
                What feels unclear or heavy right now?
              </p>

              <Textarea
                placeholder="I'm feeling stuck because..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="min-h-[100px] resize-none"
              />

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Or choose one:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_OPTIONS.map((option) => (
                    <Button
                      key={option.label}
                      variant={userInput === option.value ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleQuickOption(option.value)}
                      className="text-xs"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button 
                onClick={handleSubmit} 
                disabled={!userInput.trim() || isProcessing}
                className="w-full gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Help me move forward
              </Button>
            </motion.div>
          )}

          {stage === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-12 space-y-4"
            >
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              </div>
              <div>
                <p className="font-medium">I know where you are.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Let me find what's needed...
                </p>
              </div>
            </motion.div>
          )}

          {stage === 'guidance' && guidance && (
            <motion.div
              key="guidance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle className="text-lg">I see what's happening</DialogTitle>
              </DialogHeader>

              {/* Detected blocker */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                <p className="text-sm font-medium leading-relaxed">{guidance.blockerMessage}</p>
              </div>

              {/* Recommended action */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Recommended Next Step
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {guidance.actionExplanation}
                </p>
              </div>

              {/* Handoff CTA */}
              <Button 
                onClick={handleHandoff}
                className="w-full gap-2 h-12"
                size="lg"
              >
                {guidance.ctaLabel}
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                className="w-full gap-2 text-muted-foreground"
              >
                <RefreshCw className="w-3 h-3" />
                Try a different approach
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
