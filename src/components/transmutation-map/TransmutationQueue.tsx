import { motion } from "framer-motion";
import { Sparkles, Clock, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { InnerPattern } from "@/hooks/useInnerPatterns";
import type { LifetimeEvent } from "@/hooks/useLifetimeEvents";
import { cn } from "@/lib/utils";

interface TransmutationQueueProps {
  activePatternId: string | null;
  patterns: InnerPattern[];
  lifetimeEvents?: LifetimeEvent[];
  onSelectPattern: (id: string) => void;
  onAddNew?: () => void;
}

export const TransmutationQueue = ({
  activePatternId,
  patterns,
  lifetimeEvents = [],
  onSelectPattern,
  onAddNew,
}: TransmutationQueueProps) => {
  // Filter patterns waiting to be transmuted (not transformed)
  const waitingPatterns = patterns.filter(p => 
    p.status !== 'transformed' && p.id !== activePatternId
  );

  // Filter lifetime events not yet transmuted
  const waitingEvents = lifetimeEvents.filter(e => 
    !e.is_transmuted && e.pattern_id !== activePatternId
  );

  const activePattern = patterns.find(p => p.id === activePatternId);

  if (waitingPatterns.length === 0 && waitingEvents.length === 0 && !activePattern) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Active transmutation */}
      {activePattern && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Currently Transmuting
          </p>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{activePattern.pattern_name}</p>
              <Badge 
                variant="secondary" 
                className="text-[10px] bg-amber-500/20 text-amber-600 mt-0.5"
              >
                {activePattern.status === 'transformed' ? 'Complete' : 'In Progress'}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Queue */}
      {(waitingPatterns.length > 0 || waitingEvents.length > 0) && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Waiting to Transmute
          </p>
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {/* Patterns in queue */}
              {waitingPatterns.map((pattern, index) => (
                <motion.button
                  key={pattern.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelectPattern(pattern.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                    "hover:bg-slate-500/10 hover:border-slate-500/30",
                    "bg-card/50 border-border/50"
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-500/20 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm truncate">{pattern.pattern_name}</p>
                    <p className="text-[10px] text-muted-foreground">Pattern</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              ))}

              {/* Life events in queue */}
              {waitingEvents.map((event, index) => (
                <motion.button
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (waitingPatterns.length + index) * 0.05 }}
                  onClick={() => {
                    if (event.pattern_id) {
                      onSelectPattern(event.pattern_id);
                    }
                  }}
                  disabled={!event.pattern_id}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                    event.pattern_id
                      ? "hover:bg-indigo-500/10 hover:border-indigo-500/30 bg-card/50 border-border/50"
                      : "opacity-50 cursor-not-allowed bg-card/30 border-border/30"
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm truncate">{event.event_label}</p>
                    <p className="text-[10px] text-muted-foreground">Life Event</p>
                  </div>
                  {event.pattern_id && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </motion.button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Add new button */}
      {onAddNew && (
        <Button
          onClick={onAddNew}
          variant="outline"
          size="sm"
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Pattern
        </Button>
      )}
    </motion.div>
  );
};
