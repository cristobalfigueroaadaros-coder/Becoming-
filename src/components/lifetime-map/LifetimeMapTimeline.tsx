import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  LifetimeEvent, 
  TimePeriod, 
  TIME_PERIODS, 
  TIME_PERIOD_LABELS 
} from "@/hooks/useLifetimeEvents";
import { LifetimeEventCard } from "./LifetimeEventCard";
import { cn } from "@/lib/utils";

interface LifetimeMapTimelineProps {
  events: LifetimeEvent[];
  eventsByPeriod: Record<TimePeriod, LifetimeEvent[]>;
  onEventClick: (event: LifetimeEvent) => void;
  onAddEvent: (timePeriod: TimePeriod) => void;
  currentPatternId?: string;
}

export const LifetimeMapTimeline = ({
  events,
  eventsByPeriod,
  onEventClick,
  onAddEvent,
  currentPatternId,
}: LifetimeMapTimelineProps) => {
  const hasEvents = events.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-1"
      >
        <h3 className="text-lg font-semibold">Your Life Journey</h3>
        <p className="text-sm text-muted-foreground">
          Every moment shaped who you're becoming
        </p>
      </motion.div>

      {/* Timeline */}
      <ScrollArea className="w-full">
        <div className="pb-4">
          {/* Timeline line */}
          <div className="relative">
            {/* Horizontal line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-500/20 via-slate-400/40 to-slate-500/20" />
            
            {/* Time period columns */}
            <div className="flex gap-4 min-w-max px-2">
              {TIME_PERIODS.map((period, periodIndex) => {
                const periodEvents = eventsByPeriod[period];
                const hasPatternEvent = currentPatternId 
                  ? periodEvents.some(e => e.pattern_id === currentPatternId)
                  : false;

                return (
                  <motion.div
                    key={period}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: periodIndex * 0.05 }}
                    className="flex flex-col items-center min-w-[160px]"
                  >
                    {/* Period header with dot */}
                    <div className="relative mb-4">
                      <div className={cn(
                        "w-3 h-3 rounded-full border-2 z-10 relative",
                        periodEvents.length > 0 
                          ? "bg-primary border-primary" 
                          : "bg-background border-muted-foreground/30"
                      )} />
                    </div>

                    {/* Period label */}
                    <p className={cn(
                      "text-xs font-medium mb-3",
                      periodEvents.length > 0 
                        ? "text-foreground" 
                        : "text-muted-foreground"
                    )}>
                      {TIME_PERIOD_LABELS[period]}
                    </p>

                    {/* Events stack */}
                    <div className="flex flex-col gap-2 min-h-[100px]">
                      {periodEvents.map((event, eventIndex) => (
                        <LifetimeEventCard
                          key={event.id}
                          event={event}
                          onClick={() => onEventClick(event)}
                          delay={periodIndex * 0.05 + eventIndex * 0.02}
                        />
                      ))}

                      {/* Add event button */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: periodIndex * 0.05 + 0.2 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-full min-w-[140px] max-w-[160px] h-8",
                            "border-dashed border-muted-foreground/30",
                            "text-muted-foreground hover:text-foreground",
                            "hover:border-primary/50 hover:bg-primary/5"
                          )}
                          onClick={() => onAddEvent(period)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Event
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Empty state message */}
      {!hasEvents && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-6 text-muted-foreground"
        >
          <p className="text-sm">
            Start mapping your life journey by adding events to any time period.
          </p>
        </motion.div>
      )}
    </div>
  );
};
