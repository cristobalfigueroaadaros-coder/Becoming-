import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, ArrowRight, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { useJourneyCompass, type CompassSuggestion } from "@/hooks/useJourneyCompass";
import { cn } from "@/lib/utils";

interface JourneyCompassCardProps {
  open: boolean;
  onAction: () => void; // called when user picks an action so the panel can close
}

const SURFACE_LABEL: Record<string, string> = {
  atlas_quest: "Atlas",
  mentor: "Mentor",
  design_thinking: "Design Thinking",
  project_block: "Projects",
  transmutation: "Transmutation",
  becoming: "Becoming",
  creators: "Creators",
};

export const JourneyCompassCard = ({ open, onAction }: JourneyCompassCardProps) => {
  const { fetchGuidance, executeSuggestion, guidance, loading, error } = useJourneyCompass();

  // Fetch proactive guidance every time the panel opens
  useEffect(() => {
    if (open) {
      fetchGuidance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleAction = async (s: CompassSuggestion) => {
    onAction();
    await executeSuggestion(s);
  };

  return (
    <div
      className="rounded-2xl border p-4 mb-4"
      style={{
        background:
          "linear-gradient(135deg, hsl(265 90% 62% / 0.10), hsl(280 90% 70% / 0.05))",
        borderColor: "hsl(265 90% 62% / 0.25)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
          <Compass className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
            Your next move
          </p>
        </div>
        {guidance && !loading && (
          <button
            onClick={() => fetchGuidance()}
            className="text-muted-foreground/60 hover:text-primary transition-colors"
            title="Re-read my state"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 py-3"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <p className="text-[12px] text-muted-foreground">
              Reading where you are…
            </p>
          </motion.div>
        )}

        {!loading && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="text-[12px] text-muted-foreground">
              {error}
            </p>
            <button
              onClick={() => fetchGuidance()}
              className="text-[11px] text-primary font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Try again
            </button>
          </motion.div>
        )}

        {!loading && !error && guidance && (
          <motion.div
            key="guidance"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* State summary */}
            <p className="text-[12px] text-foreground/80 leading-relaxed">
              {guidance.stateSummary}
            </p>

            {/* Primary suggestion */}
            <div className="rounded-xl bg-background/40 border border-primary/20 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-primary/70 font-semibold">
                      {SURFACE_LABEL[guidance.primarySuggestion.surface] || guidance.primarySuggestion.surface}
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold text-foreground leading-snug">
                    {guidance.primarySuggestion.title}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground mt-1 leading-relaxed">
                    {guidance.primarySuggestion.why}
                  </p>
                  {guidance.primarySuggestion.leverageInsight && (
                    <p className="text-[10.5px] text-primary/70 mt-1.5 italic leading-snug">
                      {guidance.primarySuggestion.leverageInsight}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleAction(guidance.primarySuggestion)}
                className={cn(
                  "w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-2",
                  "rounded-lg bg-primary text-primary-foreground text-[12px] font-medium",
                  "hover:bg-primary/90 transition-colors"
                )}
              >
                {guidance.primarySuggestion.ctaLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alternatives */}
            {guidance.alternativeSuggestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold pl-1">
                  Or try
                </p>
                {guidance.alternativeSuggestions.map((alt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAction(alt)}
                    className="w-full text-left flex items-start gap-2 p-2 rounded-lg hover:bg-primary/5 border border-transparent hover:border-primary/15 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9.5px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                          {SURFACE_LABEL[alt.surface] || alt.surface}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-foreground/85 leading-snug">
                        {alt.title}
                      </p>
                      <p className="text-[10.5px] text-muted-foreground/80 leading-snug mt-0.5">
                        {alt.why}
                      </p>
                    </div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/40 mt-1 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};