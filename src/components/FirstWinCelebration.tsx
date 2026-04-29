import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, ArrowRight } from "lucide-react";

interface FirstWinCelebrationProps {
  conceptName: string;
  onContinue: () => void;
}

export const FirstWinCelebration = ({
  conceptName,
  onContinue,
}: FirstWinCelebrationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-accent/30 bg-gradient-to-br from-accent/10 via-primary/10 to-background overflow-hidden">
        <CardContent className="pt-8 pb-6">
          <div className="text-center space-y-6">
            {/* Celebration Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative w-20 h-20 mx-auto"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-primary opacity-20 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            {/* Named Concept */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <p className="text-sm text-muted-foreground">
                You've given shape to something meaningful:
              </p>
              <h2 className="text-2xl font-bold text-foreground">
                "{conceptName}"
              </h2>
            </motion.div>

            {/* Anchor Phrase */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="max-w-md mx-auto"
            >
              <div className="p-4 bg-muted/30 rounded-xl border border-accent/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-accent" />
                  <span className="text-xs text-accent font-medium uppercase tracking-wider">
                    Your Future Self
                  </span>
                </div>
                <p className="text-foreground italic leading-relaxed">
                  "Becoming is not about finding answers. It is about building momentum toward meaning."
                </p>
              </div>
            </motion.div>

            {/* Continue Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Button
                onClick={onContinue}
                className="gap-2 bg-gradient-to-r from-accent to-primary hover:opacity-90"
              >
                Continue your journey
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>

            {/* Subtle Message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-xs text-muted-foreground"
            >
              No tasks yet. No pressure. Just clarity.
            </motion.p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};