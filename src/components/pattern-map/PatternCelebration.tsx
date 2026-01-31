import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Orbit, ArrowRight, Check } from "lucide-react";

interface PatternCelebrationProps {
  patternName: string;
  onContinue: () => void;
}

export const PatternCelebration = ({
  patternName,
  onContinue,
}: PatternCelebrationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <Card className="max-w-md w-full border-indigo-500/40 bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-background overflow-hidden shadow-2xl">
          <CardContent className="pt-10 pb-8">
            <div className="text-center space-y-6">
              {/* Animated checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                className="relative w-20 h-20 mx-auto"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse" />
                <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring" }}
                  >
                    <Check className="w-8 h-8 text-indigo-500" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <h2 className="text-2xl font-bold text-foreground">
                  Pattern Discovered ✅
                </h2>
                <p className="text-lg font-medium text-indigo-400">
                  "{patternName}"
                </p>
              </motion.div>

              {/* Message */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="space-y-3"
              >
                <p className="text-muted-foreground">
                  This is powerful.
                </p>
                <p className="text-sm text-muted-foreground">
                  Awareness is the first shift.
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>✨ Your Pattern Map is now created.</p>
                  <p>🔥 Your Transmutation Map is unlocked.</p>
                  <p>📍 Your Lifetime Map has its first entry.</p>
                </div>
              </motion.div>

              {/* Visual element */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="flex justify-center gap-2 py-4"
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.9 + i * 0.1, type: "spring" }}
                    className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500"
                    style={{ opacity: 0.4 + (i * 0.15) }}
                  />
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <Button
                  onClick={onContinue}
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 gap-2"
                >
                  <Orbit className="w-4 h-4" />
                  Open Pattern Map
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
