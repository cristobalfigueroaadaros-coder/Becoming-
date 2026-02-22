import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

interface SprintWinnerCardProps {
  streak: number;
  direction: string;
  onDismiss: () => void;
}

export function SprintWinnerCard({ streak, direction, onDismiss }: SprintWinnerCardProps) {
  useEffect(() => {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="text-center space-y-5 py-4"
    >
      <motion.div
        initial={{ rotate: -10 }}
        animate={{ rotate: 0 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        <Trophy className="h-14 w-14 mx-auto text-primary" />
      </motion.div>

      <div className="space-y-1">
        <h3 className="text-xl font-bold">Weekly Review Complete</h3>
        <p className="text-sm text-muted-foreground">
          Streak: {streak} week{streak !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="bg-primary/10 rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-1">Next Sprint Focus</p>
        <p className="text-sm font-medium flex items-center justify-center gap-1">
          <ArrowRight className="h-3 w-3" /> {direction}
        </p>
      </div>

      <Button className="w-full" onClick={onDismiss}>
        Let's Go
      </Button>
    </motion.div>
  );
}
