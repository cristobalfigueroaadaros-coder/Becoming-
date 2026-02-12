import { motion } from "framer-motion";
import { User, Orbit, Sparkles, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type BecomingMode = "becoming" | "pattern-map" | "transmutation" | "lifetime" | "superpowers";

interface BecomingModeSelectorProps {
  currentMode: BecomingMode;
  onModeChange: (mode: BecomingMode) => void;
  patternCount?: number;
  hasTransmuted?: boolean;
  superpowerCount?: number;
}

const modes = [
  {
    id: "becoming" as const,
    label: "Becoming",
    icon: User,
    description: "Your identity journey",
    color: "violet",
  },
  {
    id: "pattern-map" as const,
    label: "Pattern Map",
    icon: Orbit,
    description: "Map your inner patterns",
    color: "indigo",
  },
  {
    id: "transmutation" as const,
    label: "Transmutation",
    icon: Sparkles,
    description: "Transform pain into gold",
    color: "amber",
  },
  {
    id: "lifetime" as const,
    label: "Lifetime",
    icon: Clock,
    description: "Your life timeline",
    color: "slate",
  },
  {
    id: "superpowers" as const,
    label: "Superpowers",
    icon: Zap,
    description: "Your gained powers",
    color: "amber",
  },
];

export const BecomingModeSelector = ({
  currentMode,
  onModeChange,
  patternCount = 0,
  hasTransmuted = false,
  superpowerCount = 0,
}: BecomingModeSelectorProps) => {
  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;

        return (
          <motion.button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={cn(
              "relative p-4 rounded-xl border transition-all duration-200 text-left",
              isActive
                ? mode.color === "violet"
                  ? "border-violet-500/50 bg-gradient-to-br from-violet-500/15 to-violet-500/5 shadow-lg shadow-violet-500/10"
                  : mode.color === "indigo"
                  ? "border-indigo-500/50 bg-gradient-to-br from-indigo-500/15 to-indigo-500/5 shadow-lg shadow-indigo-500/10"
                  : mode.color === "amber"
                  ? "border-amber-500/50 bg-gradient-to-br from-amber-500/15 to-amber-500/5 shadow-lg shadow-amber-500/10"
                  : "border-slate-500/50 bg-gradient-to-br from-slate-500/15 to-slate-500/5 shadow-lg shadow-slate-500/10"
                : "border-border/50 bg-card/50 hover:border-border hover:bg-card"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Icon and badge row */}
            <div className="flex items-center justify-between mb-2">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  mode.color === "violet"
                    ? "bg-violet-500/20"
                    : mode.color === "indigo"
                    ? "bg-indigo-500/20"
                    : mode.color === "amber"
                    ? "bg-amber-500/20"
                    : "bg-slate-500/20"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    mode.color === "violet"
                      ? "text-violet-500"
                      : mode.color === "indigo"
                      ? "text-indigo-500"
                      : mode.color === "amber"
                      ? "text-amber-500"
                      : "text-slate-500"
                  )}
                />
              </div>

              {/* Badges */}
              {mode.id === "pattern-map" && patternCount > 0 && (
                <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-400 text-xs">
                  {patternCount}
                </Badge>
              )}
              {mode.id === "transmutation" && hasTransmuted && (
                <span className="text-amber-500 text-sm">✨</span>
              )}
              {mode.id === "superpowers" && superpowerCount > 0 && (
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 text-xs">
                  {superpowerCount}
                </Badge>
              )}
            </div>

            {/* Label */}
            <h3
              className={cn(
                "font-semibold text-sm",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {mode.label}
            </h3>

            {/* Description */}
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {mode.description}
            </p>

            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="becoming-mode-indicator"
                className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full",
                  mode.color === "violet"
                    ? "bg-violet-500"
                    : mode.color === "indigo"
                    ? "bg-indigo-500"
                    : mode.color === "amber"
                    ? "bg-amber-500"
                    : "bg-slate-500"
                )}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
