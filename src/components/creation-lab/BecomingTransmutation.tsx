import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PatternSelector } from "./PatternSelector";
import {
  TransmutationMapCanvas,
  TransmutationNodeEditModal,
  TransmutationCelebration,
  type TransmutationData,
} from "@/components/transmutation-map";
import type { InnerPattern } from "@/hooks/useInnerPatterns";
import { toast } from "sonner";

const transmutationNodeLabels: Record<
  string,
  { label: string; phase: "black" | "white" | "gold" }
> = {
  shadow: { label: "The Shadow", phase: "black" },
  dark_night: { label: "Dark Night", phase: "black" },
  shift_moment: { label: "The Shift", phase: "white" },
  protective_purpose: { label: "Protective Role", phase: "white" },
  lesson_learned: { label: "The Lesson", phase: "white" },
  gold_insight: { label: "The Gold", phase: "gold" },
  letter_to_self: { label: "To Younger Me", phase: "gold" },
  brave_step: { label: "Brave Step", phase: "gold" },
};

interface BecomingTransmutationProps {
  patterns: InnerPattern[];
  selectedPatternId: string | null;
  onPatternSelect: (id: string) => void;
  onUpdateTransmutation: (id: string, data: TransmutationData) => Promise<boolean>;
  onSyncGoldOutcome?: (patternId: string, goldText: string) => Promise<boolean>;
  onModeChange: (mode: "lifetime") => void;
}

export const BecomingTransmutation = ({
  patterns,
  selectedPatternId,
  onPatternSelect,
  onUpdateTransmutation,
  onSyncGoldOutcome,
  onModeChange,
}: BecomingTransmutationProps) => {
  const navigate = useNavigate();
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [transmutationData, setTransmutationData] = useState<TransmutationData>({});

  const selectedPattern = patterns.find((p) => p.id === selectedPatternId);

  // Load transmutation data from pattern
  useEffect(() => {
    if (selectedPattern) {
      const transData = selectedPattern.transmutation_data;
      if (transData && typeof transData === "object") {
        setTransmutationData(transData as TransmutationData);

        // Auto-populate protective_purpose from pattern map's protective_role
        const lifeEvents = selectedPattern.life_events;
        if (
          !transData.protective_purpose &&
          lifeEvents &&
          typeof lifeEvents === "object" &&
          !Array.isArray(lifeEvents) &&
          (lifeEvents as Record<string, string>).protective_role
        ) {
          setTransmutationData((prev) => ({
            ...prev,
            protective_purpose: (lifeEvents as Record<string, string>).protective_role,
          }));
        }
      } else {
        setTransmutationData({});
      }
    }
  }, [selectedPattern]);

  const handleNodeClick = (nodeId: string) => {
    setEditingNode(nodeId);
  };

  const handleNodeSave = async (content: string) => {
    if (!selectedPattern || !editingNode) return;

    const updatedData = { ...transmutationData, [editingNode]: content };
    setTransmutationData(updatedData);

    // Check if gold phase is complete
    const isGoldComplete = !!(updatedData.gold_insight && updatedData.letter_to_self);

    if (isGoldComplete && !transmutationData.phase_completed) {
      updatedData.phase_completed = "gold";
      updatedData.completed_at = new Date().toISOString();
    }

    const success = await onUpdateTransmutation(selectedPattern.id, updatedData);

    if (success) {
      toast.success("Transmutation map updated");
      // Show celebration if gold phase just completed
      if (isGoldComplete && !transmutationData.phase_completed) {
        setShowCelebration(true);
      }
    }

    setEditingNode(null);
  };

  const handleCelebrationSaveGold = () => {
    setShowCelebration(false);
    toast.success("Gold insight saved to your journey");
  };

  const handleCelebrationViewLifetime = async () => {
    setShowCelebration(false);
    // Sync gold outcome to lifetime events
    if (selectedPattern && transmutationData.gold_insight && onSyncGoldOutcome) {
      await onSyncGoldOutcome(selectedPattern.id, transmutationData.gold_insight);
    }
    onModeChange("lifetime");
    toast.success("View your gold insight in the Lifetime Map");
  };

  const handleKeepTalking = () => {
    navigate("/council?view=inner_clarity_mentor");
  };

  // Empty state
  if (patterns.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent text-center py-12">
          <CardContent>
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Discover a pattern first</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Before you can transmute pain into gold, you need to first discover and map a
              pattern.
            </p>
            <Button
              onClick={() => navigate("/inner-self-council")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Start Pattern Exploration
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Pattern Selector */}
      <PatternSelector
        patterns={patterns}
        selectedPatternId={selectedPatternId}
        onPatternSelect={onPatternSelect}
      />

      {/* Transmutation Map Canvas */}
      {selectedPattern && (
        <Card
          className={`overflow-hidden ${
            selectedPattern.status === "transformed"
              ? "border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-transparent"
              : "border-slate-500/20 bg-gradient-to-br from-slate-500/5 to-transparent"
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedPattern.status === "transformed"
                      ? "bg-amber-500/20"
                      : "bg-slate-500/20"
                  }`}
                >
                  <Sparkles
                    className={`w-5 h-5 ${
                      selectedPattern.status === "transformed"
                        ? "text-amber-500"
                        : "text-slate-500"
                    }`}
                  />
                </div>
                <div>
                  <CardTitle className="text-lg">{selectedPattern.pattern_name}</CardTitle>
                  <Badge
                    variant="secondary"
                    className={
                      selectedPattern.status === "transformed"
                        ? "bg-amber-500/20 text-amber-400 mt-1"
                        : "bg-slate-500/20 text-slate-400 mt-1"
                    }
                  >
                    {selectedPattern.status === "transformed"
                      ? "Transmutation Complete ✨"
                      : "In Progress"}
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {selectedPattern.status === "transformed"
                ? "Your wisdom is now gold"
                : "Black → White → Gold — Tap nodes to begin your transmutation"}
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <TransmutationMapCanvas
              patternName={selectedPattern.pattern_name}
              transmutationData={transmutationData}
              onNodeClick={handleNodeClick}
              isCompleted={selectedPattern.status === "transformed"}
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Button
        onClick={handleKeepTalking}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
        size="lg"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Talk to the Transmutation Team
      </Button>

      {/* Transmutation Node Edit Modal */}
      {editingNode && (
        <TransmutationNodeEditModal
          open={!!editingNode}
          onClose={() => setEditingNode(null)}
          nodeId={editingNode}
          nodeLabel={transmutationNodeLabels[editingNode]?.label || editingNode}
          phase={transmutationNodeLabels[editingNode]?.phase || "white"}
          currentContent={transmutationData[editingNode as keyof TransmutationData] as string}
          onSave={handleNodeSave}
        />
      )}

      {/* Transmutation Celebration */}
      {showCelebration && selectedPattern && (
        <TransmutationCelebration
          open={showCelebration}
          patternName={selectedPattern.pattern_name}
          goldInsight={transmutationData.gold_insight || ""}
          onSaveGold={handleCelebrationSaveGold}
          onViewLifetime={handleCelebrationViewLifetime}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </motion.div>
  );
};
