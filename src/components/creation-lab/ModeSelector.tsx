import { motion } from "framer-motion";
import { Target, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export type CreationLabMode = "focus" | "purpose";

interface ModeSelectorProps {
  currentMode: CreationLabMode;
  onModeChange: (mode: CreationLabMode) => void;
  hasActiveProject?: boolean;
  needsProblemClarification?: boolean;
  isInClarificationSession?: boolean;
}

const modes = [
  {
    id: "focus" as const,
    label: "Focus",
    icon: Target,
    description: "Execute your current project",
    color: "hsl(var(--primary))",
    bgColor: "bg-primary/10",
    activeColor: "bg-primary text-primary-foreground",
  },
  {
    id: "purpose" as const,
    label: "Business Plan",
    icon: Lightbulb,
    description: "Build your business plan step by step",
    color: "hsl(280 75% 65%)",
    bgColor: "bg-violet-500/10",
    activeColor: "bg-violet-500 text-white",
  },
];

export const ModeSelector = ({
  currentMode,
  onModeChange,
  hasActiveProject,
  needsProblemClarification = false,
  isInClarificationSession = false,
}: ModeSelectorProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 p-1.5 bg-muted/50 rounded-xl border border-border/50">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;
        
        return (
          <motion.button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={cn(
              "relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all flex-1",
              "hover:bg-muted/80",
              isActive ? mode.activeColor : "text-muted-foreground"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isActive && (
              <motion.div
                layoutId="activeMode"
                className="absolute inset-0 rounded-lg"
                style={{ backgroundColor: mode.color }}
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            
            <div className="relative z-10 flex items-center gap-3">
              <Icon className="w-5 h-5" />
              <div className="text-left hidden sm:block">
                <div className="font-medium text-sm">{mode.label}</div>
                <div className={cn(
                  "text-xs",
                  isActive ? "opacity-80" : "text-muted-foreground"
                )}>
                  {mode.description}
                </div>
              </div>
              <span className="sm:hidden font-medium text-sm">{mode.label}</span>
            </div>
            
            {/* Indicators */}
            {mode.id === "focus" && hasActiveProject && !needsProblemClarification && (
              <span className={cn(
                "relative z-10 w-2 h-2 rounded-full ml-auto",
                isActive ? "bg-white/80" : "bg-primary"
              )} />
            )}
            {mode.id === "focus" && needsProblemClarification && !isInClarificationSession && (
              <span className={cn(
                "relative z-10 w-4 h-4 rounded-full ml-auto flex items-center justify-center text-[10px] font-bold animate-pulse",
                isActive ? "bg-white/90 text-primary" : "bg-destructive text-destructive-foreground"
              )}>
                1
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
