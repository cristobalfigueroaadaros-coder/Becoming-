import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { IntegratorDailyStep } from "@/hooks/useIntegratorProjects";

interface ProgressNarrativeBlockProps {
  completedSteps: IntegratorDailyStep[];
  totalSteps: number;
  projectTitle: string;
}

const NARRATIVE_TEMPLATES = {
  early: [
    "You're building the foundation. Each step makes the next one clearer.",
    "The beginning is always the hardest. You showed up anyway.",
    "You're in motion now. That matters more than speed.",
  ],
  momentum: [
    "You're moving from ideas into decisions more easily.",
    "Notice how the steps feel more natural now? That's growth.",
    "Because you took action instead of overthinking, clarity came faster.",
    "You're building momentum. Keep going.",
  ],
  strong: [
    "This builds on what you discovered earlier about what matters to you.",
    "Your consistency is becoming visible. So is your capability.",
    "You're proving to yourself that you follow through.",
    "The person who started this project would be proud of where you are now.",
  ],
  final: [
    "You're approaching the finish line. Look how far you've come.",
    "What you've built here is real. You made it happen.",
    "From idea to action to completion. That's who you are now.",
  ],
};

export function ProgressNarrativeBlock({
  completedSteps,
  totalSteps,
  projectTitle
}: ProgressNarrativeBlockProps) {
  const narrative = useMemo(() => {
    const completionRate = completedSteps.length / totalSteps;
    
    let templates: string[];
    if (completionRate < 0.25) {
      templates = NARRATIVE_TEMPLATES.early;
    } else if (completionRate < 0.5) {
      templates = NARRATIVE_TEMPLATES.momentum;
    } else if (completionRate < 0.9) {
      templates = NARRATIVE_TEMPLATES.strong;
    } else {
      templates = NARRATIVE_TEMPLATES.final;
    }
    
    return templates[Math.floor(Math.random() * templates.length)];
  }, [completedSteps.length, totalSteps]);

  // Only show if there's some progress
  if (completedSteps.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-amber-500/5 border border-primary/10"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            {narrative}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            {completedSteps.length} of {totalSteps} steps completed on "{projectTitle}"
          </p>
        </div>
      </div>
    </motion.div>
  );
}
