import { motion } from "framer-motion";
import { Orbit, Plus, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { InnerPattern } from "@/hooks/useInnerPatterns";

interface PatternSelectorProps {
  patterns: InnerPattern[];
  selectedPatternId: string | null;
  onPatternSelect: (patternId: string) => void;
}

export const PatternSelector = ({
  patterns,
  selectedPatternId,
  onPatternSelect,
}: PatternSelectorProps) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "transformed":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "in_transmutation":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "transformed":
        return "Transmuted ✨";
      case "in_transmutation":
        return "In Progress";
      default:
        return "Exploring";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Select a pattern to view</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/transmutation-council")}
          className="text-indigo-400 hover:text-indigo-300 gap-1"
        >
          <Plus className="w-3 h-3" />
          New pattern
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2">
          {patterns.map((pattern) => {
            const isSelected = selectedPatternId === pattern.id;

            return (
              <motion.button
                key={pattern.id}
                onClick={() => onPatternSelect(pattern.id)}
                className={cn(
                  "relative flex-shrink-0 p-3 rounded-xl border transition-all duration-200 text-left min-w-[180px] max-w-[220px]",
                  isSelected
                    ? "border-indigo-500/50 bg-gradient-to-br from-indigo-500/15 to-indigo-500/5 shadow-lg shadow-indigo-500/10"
                    : "border-border/50 bg-card/50 hover:border-border hover:bg-card"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Selected check */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Icon */}
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-2">
                  <Orbit className="w-4 h-4 text-indigo-500" />
                </div>

                {/* Pattern name */}
                <h4 className="font-medium text-sm text-foreground truncate pr-6">
                  {pattern.pattern_name}
                </h4>

                {/* Status badge */}
                <Badge
                  variant="outline"
                  className={cn("text-xs mt-2", getStatusColor(pattern.status))}
                >
                  {getStatusLabel(pattern.status)}
                </Badge>

                {/* Primary emotion if exists */}
                {pattern.primary_emotion && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {pattern.primary_emotion}
                  </p>
                )}
              </motion.button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
