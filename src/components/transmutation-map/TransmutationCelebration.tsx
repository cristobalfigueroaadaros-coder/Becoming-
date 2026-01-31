import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, BookOpen, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

interface TransmutationCelebrationProps {
  open: boolean;
  patternName: string;
  goldInsight: string;
  goldenSummary?: string;
  onSaveGold: () => void;
  onViewLifetime: () => void;
  onClose: () => void;
}

export const TransmutationCelebration = ({
  open,
  patternName,
  goldInsight,
  goldenSummary,
  onSaveGold,
  onViewLifetime,
  onClose,
}: TransmutationCelebrationProps) => {
  useEffect(() => {
    if (open) {
      // Gold-themed confetti
      const goldColors = ['#fbbf24', '#f59e0b', '#d97706', '#fcd34d', '#fef3c7'];
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: goldColors,
      });

      // Second burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: goldColors,
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: goldColors,
        });
      }, 300);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <Card className="w-full max-w-md border-amber-500/40 bg-gradient-to-br from-amber-500/20 via-background to-amber-600/10 shadow-2xl shadow-amber-500/20">
              <CardContent className="pt-8 pb-6 text-center space-y-6">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30"
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                    Transmutation Complete ✨
                  </h2>
                  <p className="text-muted-foreground">
                    You turned a difficult moment into wisdom.
                  </p>
                </motion.div>

                {/* Pattern info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-amber-500/10 rounded-lg p-4 space-y-2"
                >
                  <p className="text-xs text-amber-400 font-medium uppercase tracking-wide">
                    Pattern Transmuted
                  </p>
                  <p className="font-semibold">{patternName}</p>
                </motion.div>

                {/* Gold insight preview */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-r from-amber-500/5 to-amber-600/5 border border-amber-500/20 rounded-lg p-4 space-y-3"
                >
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Your Gold Insight</p>
                    <p className="text-sm italic">"{goldInsight}"</p>
                  </div>
                  
                  {goldenSummary && (
                    <div className="pt-2 border-t border-amber-500/20">
                      <p className="text-xs text-muted-foreground mb-1">Your Journey Summary</p>
                      <p className="text-sm text-amber-100/90">{goldenSummary}</p>
                    </div>
                  )}
                </motion.div>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-muted-foreground"
                >
                  This is now part of who you are becoming.
                </motion.p>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-3 pt-2"
                >
                  <Button
                    onClick={onSaveGold}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white"
                    size="lg"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Save Gold Insight
                  </Button>
                  
                  <Button
                    onClick={onViewLifetime}
                    variant="outline"
                    className="w-full border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    View in Lifetime Map
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
