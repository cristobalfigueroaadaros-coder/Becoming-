import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Heart, ArrowRight, CheckCircle } from "lucide-react";

interface SecondWinCelebrationProps {
  problemStatement: string;
  onAccept: () => void;
}

export const SecondWinCelebration = ({
  problemStatement,
  onAccept,
}: SecondWinCelebrationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <Card className="max-w-lg w-full border-primary/30 bg-gradient-to-br from-primary/10 via-accent/10 to-background overflow-hidden">
        <CardContent className="pt-8 pb-6">
          <div className="text-center space-y-6">
            {/* Celebration Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative w-20 h-20 mx-auto"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent opacity-20 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Target className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-center gap-2 text-primary">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-wider">
                  Second Win
                </span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                You've clarified the problem you're solving.
              </h2>
            </motion.div>

            {/* Problem Statement */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="max-w-md mx-auto"
            >
              <div className="p-4 bg-muted/30 rounded-xl border border-primary/20">
                <p className="text-foreground leading-relaxed text-left">
                  "{problemStatement}"
                </p>
              </div>
            </motion.div>

            {/* Anchor Phrase */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="max-w-md mx-auto"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-accent" />
                <span className="text-xs text-accent font-medium uppercase tracking-wider">
                  Why This Matters
                </span>
              </div>
              <p className="text-sm text-muted-foreground italic">
                Now every step you take connects back to meaning.
              </p>
            </motion.div>

            {/* Continue Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Button
                onClick={onAccept}
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Accept and continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>

            {/* Subtle Message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="text-xs text-muted-foreground"
            >
              This problem can evolve as you learn more.
            </motion.p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
