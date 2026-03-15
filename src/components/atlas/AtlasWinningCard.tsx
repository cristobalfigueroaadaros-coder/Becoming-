import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import type { DotInterpretation } from "@/data/atlasQuests";

interface Props {
  dot: DotInterpretation;
  clusterName: string;
  onConfirm: () => void;
  isLoading?: boolean;
  isPatternBased?: boolean;
}

export const AtlasWinningCard = ({ dot, clusterName, onConfirm, isLoading, isPatternBased }: Props) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: isPatternBased ? 120 : 80,
        spread: isPatternBased ? 90 : 70,
        origin: { y: 0.6 },
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [isPatternBased]);

  const Icon = isPatternBased ? Zap : Sparkles;
  const label = isPatternBased ? "Pattern Detected" : "New Atlas Signal";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center gap-6 px-6"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
      >
        <Icon className="w-12 h-12 text-primary" />
      </motion.div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground uppercase tracking-wider">{label}</p>
        <h2 className="text-2xl font-bold text-foreground">{dot.title}</h2>
        <p className="text-sm text-muted-foreground">{dot.description}</p>
      </div>

      <div className="px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium">
        {clusterName}
      </div>

      <Button onClick={onConfirm} disabled={isLoading} className="w-full max-w-xs gap-2">
        Add to Atlas <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};
