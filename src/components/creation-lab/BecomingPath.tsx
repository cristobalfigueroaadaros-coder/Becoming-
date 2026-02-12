import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Sparkles } from "lucide-react";
import { useInnerPatterns } from "@/hooks/useInnerPatterns";
import { useLifetimeEvents } from "@/hooks/useLifetimeEvents";
import { useSuperpowers } from "@/hooks/useSuperpowers";
import { BecomingModeSelector, type BecomingMode } from "./BecomingModeSelector";
import { BecomingHome } from "./BecomingHome";
import { BecomingPatternMap } from "./BecomingPatternMap";
import { BecomingTransmutation } from "./BecomingTransmutation";
import { BecomingLifetime } from "./BecomingLifetime";
import type { Json } from "@/integrations/supabase/types";

interface BecomingPathProps {
  initialMode?: BecomingMode;
  onModeChange?: (mode: BecomingMode) => void;
}

export const BecomingPath = ({ initialMode = "becoming", onModeChange }: BecomingPathProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentMode, setCurrentMode] = useState<BecomingMode>(initialMode);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);

  // Load patterns
  const {
    patterns,
    loading: patternsLoading,
    updatePattern,
    updateTransmutationData,
    getTransformedPatterns,
  } = useInnerPatterns();

  // Load lifetime events
  const {
    events: lifetimeEvents,
    loading: lifetimeLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsByPeriod,
    syncGoldOutcome,
  } = useLifetimeEvents();

  // Load superpowers
  const { superpowers } = useSuperpowers();

  // Sync mode with URL param
  useEffect(() => {
    const bmodeParam = searchParams.get("bmode") as BecomingMode | null;
    if (bmodeParam && ["becoming", "pattern-map", "transmutation", "lifetime", "superpowers"].includes(bmodeParam)) {
      setCurrentMode(bmodeParam);
    }
  }, [searchParams]);

  // Auto-select first pattern if none selected
  useEffect(() => {
    if (patterns.length > 0 && !selectedPatternId) {
      setSelectedPatternId(patterns[0].id);
    }
  }, [patterns, selectedPatternId]);

  const handleModeChange = (mode: BecomingMode) => {
    if (mode === "superpowers") {
      navigate("/superpower-map");
      return;
    }
    setCurrentMode(mode);
    onModeChange?.(mode);
  };

  const handleUpdatePatternNodes = async (
    id: string,
    updates: { life_events: Json }
  ): Promise<boolean> => {
    return updatePattern(id, updates);
  };

  const hasTransmuted = getTransformedPatterns().length > 0;

  if (patternsLoading || lifetimeLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Hero Section */}
      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-background">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
              <User className="w-6 h-6 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Becoming Path
                <Sparkles className="w-5 h-5 text-violet-500" />
              </CardTitle>
              <CardDescription>
                Discover who you are becoming through reflection and self-understanding
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Mode Selector (4 tabs) */}
      <BecomingModeSelector
        currentMode={currentMode}
        onModeChange={handleModeChange}
        patternCount={patterns.length}
        hasTransmuted={hasTransmuted}
        superpowerCount={superpowers.length}
      />

      {/* Content based on mode */}
      <motion.div
        key={currentMode}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {currentMode === "becoming" && <BecomingHome />}

        {currentMode === "pattern-map" && (
          <BecomingPatternMap
            patterns={patterns}
            selectedPatternId={selectedPatternId}
            onPatternSelect={setSelectedPatternId}
            onUpdatePattern={handleUpdatePatternNodes}
          />
        )}

        {currentMode === "transmutation" && (
          <BecomingTransmutation
            patterns={patterns}
            selectedPatternId={selectedPatternId}
            onPatternSelect={setSelectedPatternId}
            onUpdateTransmutation={updateTransmutationData}
            onSyncGoldOutcome={syncGoldOutcome}
            onModeChange={handleModeChange}
          />
        )}

        {currentMode === "lifetime" && (
          <BecomingLifetime
            events={lifetimeEvents}
            eventsByPeriod={getEventsByPeriod()}
            onCreateEvent={createEvent}
            onUpdateEvent={updateEvent}
            onDeleteEvent={deleteEvent}
            onModeChange={handleModeChange}
            currentPatternId={selectedPatternId}
          />
        )}
      </motion.div>
    </motion.div>
  );
};
