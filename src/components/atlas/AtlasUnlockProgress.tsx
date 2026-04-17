import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type EntryState = "DISCOVER" | "GROW" | "BUILD";

interface AtlasUnlockProgressProps {
  phase: EntryState;
  completedCount: number;
  councilAlreadyStarted: boolean;
  onGoToCouncil: () => void;
  onKeepExploring: () => void;
}

// Only Phase 1 clusters are always unlocked from the start:
// passions, skills, personal-frustrations, experiments, golden-moments
// All other clusters unlock progressively (Phase 2 needs 3+ dots, Phase 3 needs 6+, etc.)
// Node labels below map exclusively to Phase 1 clusters.
const PHASE_CONFIG: Record<EntryState, {
  label: string;
  required: number;
  nodeLabels: string[];  // maps to: skills, passions, personal-frustrations, experiments (all Phase 1)
  color: string;
  glow: string;
}> = {
  DISCOVER: {
    label: "Discovery",
    required: 4,
    // skills → passions → personal-frustrations → experiments
    nodeLabels: ["What you're good at", "What lights you up", "What you'd change", "What you've tried"],
    color: "hsl(265, 90%, 62%)",
    glow: "hsl(265, 90%, 62%, 0.4)",
  },
  GROW: {
    label: "Growth",
    required: 3,
    // skills → passions → personal-frustrations
    nodeLabels: ["What you're good at", "What lights you up", "What you'd change"],
    color: "hsl(168, 74%, 45%)",
    glow: "hsl(168, 74%, 45%, 0.4)",
  },
  BUILD: {
    label: "Builder",
    required: 2,
    // skills → passions
    nodeLabels: ["What you're good at", "What lights you up"],
    color: "hsl(38, 92%, 55%)",
    glow: "hsl(38, 92%, 55%, 0.4)",
  },
};

export function AtlasUnlockProgress({
  phase,
  completedCount,
  councilAlreadyStarted,
  onGoToCouncil,
  onKeepExploring,
}: AtlasUnlockProgressProps) {
  if (councilAlreadyStarted) return null;

  const config = PHASE_CONFIG[phase] || PHASE_CONFIG.DISCOVER;
  const { required, nodeLabels, color, glow } = config;
  const filled = Math.min(completedCount, required);
  const isUnlocked = completedCount >= required;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-4 mt-3 mb-1 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
    >
      {/* Title row */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Your path to Council
        </p>
        <span className="text-xs text-muted-foreground">
          {filled} / {required}
        </span>
      </div>

      {/* Node progress diagram */}
      <div className="flex items-center gap-0 mb-3">
        {nodeLabels.map((label, i) => {
          const done = i < filled;
          const isCurrent = i === filled && !isUnlocked;
          return (
            <div key={i} className="flex items-center flex-1 min-w-0">
              {/* Node */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <motion.div
                  animate={done ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="relative w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500"
                  style={{
                    backgroundColor: done ? color : "transparent",
                    borderColor: done ? color : isCurrent ? color : "hsl(var(--muted-foreground) / 0.3)",
                    boxShadow: done ? `0 0 12px ${glow}` : isCurrent ? `0 0 6px ${glow}` : "none",
                  }}
                >
                  {done ? (
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: isCurrent ? color : "hsl(var(--muted-foreground) / 0.5)" }}
                    >
                      {i + 1}
                    </span>
                  )}
                  {/* Pulse ring for current */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2"
                      style={{ borderColor: color }}
                      animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                <span
                  className="text-[8px] text-center leading-tight max-w-[52px]"
                  style={{ color: done ? color : "hsl(var(--muted-foreground) / 0.5)" }}
                >
                  {label}
                </span>
              </div>

              {/* Connector line (skip after last node) */}
              {i < nodeLabels.length - 1 && (
                <div className="flex-1 h-[2px] mx-1 mb-4 rounded-full overflow-hidden bg-white/10">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: "0%" }}
                    animate={{ width: done ? "100%" : "0%" }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Council unlock node */}
        <div className="flex items-center flex-shrink-0">
          <div className="flex-shrink-0 w-6 h-[2px] mx-1 mb-4 rounded-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: "0%" }}
              animate={{ width: isUnlocked ? "100%" : "0%" }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <motion.div
              animate={isUnlocked ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
              transition={{ duration: 0.6 }}
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500"
              style={{
                backgroundColor: isUnlocked ? color : "transparent",
                borderColor: isUnlocked ? color : "hsl(var(--muted-foreground) / 0.3)",
                boxShadow: isUnlocked ? `0 0 16px ${glow}` : "none",
              }}
            >
              {isUnlocked ? (
                <Sparkles className="w-3.5 h-3.5 text-white" />
              ) : (
                <span className="text-xs">🔒</span>
              )}
            </motion.div>
            <span
              className="text-[8px] text-center leading-tight max-w-[44px]"
              style={{ color: isUnlocked ? color : "hsl(var(--muted-foreground) / 0.4)" }}
            >
              Council
            </span>
          </div>
        </div>
      </div>

      {/* Unlock message and actions */}
      <AnimatePresence>
        {isUnlocked ? (
          <motion.div
            key="unlocked"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3"
          >
            <div
              className="p-3 rounded-xl border"
              style={{
                backgroundColor: `${color}10`,
                borderColor: `${color}30`,
              }}
            >
              <p className="text-xs font-medium text-foreground mb-0.5">
                You're ready to meet your Council.
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                The more you share with Atlas, the more your mentors can personalize your path. You can always come back and go deeper.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="gap-1.5 flex-1"
                style={{ backgroundColor: color, borderColor: color }}
                onClick={onGoToCouncil}
              >
                Meet my Council <ArrowRight className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={onKeepExploring}
              >
                Keep exploring
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[11px] text-muted-foreground text-center"
          >
            Complete {required - filled} more {required - filled === 1 ? "quest" : "quests"} to unlock your Council
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
