import { motion } from "framer-motion";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LifetimeEvent, 
  TIME_PERIOD_LABELS,
  EVENT_TYPE_CONFIG,
} from "@/hooks/useLifetimeEvents";
import { 
  Orbit, 
  Sparkles, 
  MessageCircle, 
  Edit, 
  ArrowRight,
  Leaf 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LifetimeEventDetailViewProps {
  event: LifetimeEvent | null;
  open: boolean;
  onClose: () => void;
  onGoToPatternMap: () => void;
  onGoToTransmutation: () => void;
  onTalkToMentor: () => void;
  onEdit: () => void;
}

export const LifetimeEventDetailView = ({
  event,
  open,
  onClose,
  onGoToPatternMap,
  onGoToTransmutation,
  onTalkToMentor,
  onEdit,
}: LifetimeEventDetailViewProps) => {
  if (!event) return null;

  const hasPattern = !!event.pattern_id || !!event.pattern_name;
  const isTransmuted = event.is_transmuted && !!event.gold_outcome;
  const eventTypeConfig = event.event_type 
    ? EVENT_TYPE_CONFIG[event.event_type] 
    : null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
        <SheetHeader className="text-left">
          <div className="flex items-start gap-3">
            {/* Status icon */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              isTransmuted 
                ? "bg-amber-500/20" 
                : hasPattern 
                  ? "bg-indigo-500/20" 
                  : "bg-muted"
            )}>
              {isTransmuted ? (
                <Sparkles className="w-5 h-5 text-amber-500" />
              ) : hasPattern ? (
                <Orbit className="w-5 h-5 text-indigo-500" />
              ) : (
                <Leaf className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            <div className="space-y-1 flex-1">
              <SheetTitle className="text-lg">{event.event_label}</SheetTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {TIME_PERIOD_LABELS[event.time_period]}
                </Badge>
                {eventTypeConfig && (
                  <Badge variant="outline" className="text-xs">
                    {eventTypeConfig.label}
                  </Badge>
                )}
                {isTransmuted && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                    Transmuted ✨
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Description */}
          {event.event_description && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{event.event_description}</p>
            </div>
          )}

          {/* Pattern info */}
          {hasPattern && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-500/10 rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Orbit className="w-4 h-4 text-indigo-400" />
                <p className="text-xs text-indigo-400 font-medium uppercase tracking-wide">
                  Pattern Activated
                </p>
              </div>
              <p className="font-medium">{event.pattern_name}</p>
            </motion.div>
          )}

          {/* Gold outcome */}
          {isTransmuted && event.gold_outcome && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <p className="text-xs text-amber-400 font-medium uppercase tracking-wide">
                  Gold Insight
                </p>
              </div>
              <p className="text-sm italic">"{event.gold_outcome}"</p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            {hasPattern && (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-between border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                  onClick={onGoToPatternMap}
                >
                  <span className="flex items-center gap-2">
                    <Orbit className="w-4 h-4" />
                    Go to Pattern Map
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                {!isTransmuted && (
                  <Button
                    variant="outline"
                    className="w-full justify-between border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                    onClick={onGoToTransmutation}
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Start Transmutation
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}

                {isTransmuted && (
                  <Button
                    variant="outline"
                    className="w-full justify-between border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                    onClick={onGoToTransmutation}
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      View Transmutation Map
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={onTalkToMentor}
            >
              <span className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Talk to Inner Self Mentor
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={onEdit}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Entry
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
