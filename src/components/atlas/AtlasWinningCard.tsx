import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, ArrowRight, Shield, Star, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOT_TYPE_COLORS } from "@/hooks/useAtlas";
import confetti from "canvas-confetti";
import type { DotInterpretation } from "@/data/atlasQuests";

interface Props {
  dot: DotInterpretation;
  clusterName: string;
  onConfirm: () => void;
  isLoading?: boolean;
  isPatternBased?: boolean;
  isReinforced?: boolean;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Sparkles; label: string }> = {
  strength: { icon: Sparkles, label: "Strength" },
  shadow: { icon: Shield, label: "Shadow" },
  life_imprint: { icon: Star, label: "Life Imprint" },
};

export const AtlasWinningCard = ({ dot, clusterName, onConfirm, isLoading, isPatternBased, isReinforced }: Props) => {
  const dotCategory = dot.dotCategory || "strength";
  const dotColor = DOT_TYPE_COLORS[dotCategory] || DOT_TYPE_COLORS.strength;
  const catConfig = CATEGORY_CONFIG[dotCategory] || CATEGORY_CONFIG.strength;

  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: isPatternBased ? 120 : isReinforced ? 60 : 80,
        spread: isPatternBased ? 90 : 70,
        origin: { y: 0.6 },
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [isPatternBased, isReinforced]);

  let headerLabel: string;
  let HeaderIcon: typeof Sparkles;

  if (isReinforced) {
    headerLabel = "Pattern Reinforced";
    HeaderIcon = RefreshCw;
  } else if (isPatternBased) {
    headerLabel = "Pattern Detected";
    HeaderIcon = Zap;
  } else {
    headerLabel = "New Atlas Signal";
    HeaderIcon = catConfig.icon;
  }

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
        <HeaderIcon className="w-12 h-12" style={{ color: dotColor }} />
      </motion.div>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground uppercase tracking-wider">{headerLabel}</p>
        <h2 className="text-2xl font-bold text-foreground">{dot.title}</h2>
        <p className="text-base text-muted-foreground leading-relaxed max-w-sm">{dot.description}</p>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${dotColor}20`, color: dotColor }}
        >
          {catConfig.label}
        </div>
        <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          {clusterName}
        </div>
      </div>

      <Button onClick={onConfirm} disabled={isLoading} className="w-full max-w-xs gap-2">
        {isReinforced ? "Reinforce Discovery" : "Add to Atlas"} <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};
