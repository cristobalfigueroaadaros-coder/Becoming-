import { motion } from "framer-motion";
import { Sparkles, Link2, Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  LifetimeEvent, 
  EVENT_TYPE_CONFIG 
} from "@/hooks/useLifetimeEvents";
import { cn } from "@/lib/utils";

interface LifetimeEventCardProps {
  event: LifetimeEvent;
  onClick: () => void;
  delay?: number;
}

export const LifetimeEventCard = ({ event, onClick, delay = 0 }: LifetimeEventCardProps) => {
  const hasPattern = !!event.pattern_id || !!event.pattern_name;
  const isTransmuted = event.is_transmuted && !!event.gold_outcome;
  
  const eventTypeConfig = event.event_type 
    ? EVENT_TYPE_CONFIG[event.event_type] 
    : null;

  // Color based on state
  const getCardStyle = () => {
    if (isTransmuted) {
      return "bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/40 shadow-amber-500/10";
    }
    if (hasPattern) {
      return "bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border-indigo-500/30";
    }
    return "bg-card/80 border-border/50 hover:border-border";
  };

  const getEventTypeColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      pink: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      green: "bg-green-500/20 text-green-400 border-green-500/30",
      amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      indigo: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      slate: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return colors[color] || colors.slate;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "rounded-lg border p-3 cursor-pointer transition-all duration-200",
        "min-w-[140px] max-w-[160px]",
        getCardStyle()
      )}
    >
      {/* Status indicator */}
      <div className="flex items-center justify-between mb-2">
        {isTransmuted ? (
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-amber-400 font-medium">Transmuted</span>
          </div>
        ) : hasPattern ? (
          <div className="flex items-center gap-1">
            <Link2 className="w-3 h-3 text-indigo-400" />
            <span className="text-[10px] text-indigo-400 font-medium">Pattern</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Leaf className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Event</span>
          </div>
        )}
      </div>

      {/* Event label */}
      <p className={cn(
        "text-sm font-medium line-clamp-2 mb-2",
        isTransmuted && "text-amber-100"
      )}>
        {event.event_label}
      </p>

      {/* Event type badge */}
      {eventTypeConfig && (
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] px-1.5 py-0",
            getEventTypeColor(eventTypeConfig.color)
          )}
        >
          {eventTypeConfig.label}
        </Badge>
      )}

      {/* Gold outcome preview */}
      {isTransmuted && event.gold_outcome && (
        <div className="mt-2 pt-2 border-t border-amber-500/20">
          <p className="text-[10px] text-amber-400/80 italic line-clamp-2">
            "{event.gold_outcome}"
          </p>
        </div>
      )}
    </motion.div>
  );
};
