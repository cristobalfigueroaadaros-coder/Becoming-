import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, Flame, Shield, MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PatternSelector } from "./PatternSelector";
import {
  TransmutationMapCanvas,
  TransmutationCelebration,
  TransmutationNodeEditModal,
  type TransmutationData,
} from "@/components/transmutation-map";
import { WhitePhaseWinCard } from "@/components/transmutation-map/WhitePhaseWinCard";
import { TransmutationQueue } from "@/components/transmutation-map/TransmutationQueue";
import { isWhitePhaseComplete, isGoldPhaseComplete, generateGoldenSummary } from "@/lib/goldenSummaryGenerator";
import { triggerGoldCompleteNotification } from "@/hooks/useTransmutationNotifications";
import type { InnerPattern } from "@/hooks/useInnerPatterns";
import type { LifetimeEvent } from "@/hooks/useLifetimeEvents";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BecomingTransmutationProps {
  patterns: InnerPattern[];
  selectedPatternId: string | null;
  onPatternSelect: (id: string) => void;
  onUpdateTransmutation: (id: string, data: TransmutationData) => Promise<boolean>;
  onSyncGoldOutcome?: (patternId: string, goldText: string) => Promise<boolean>;
  onModeChange: (mode: "lifetime") => void;
  lifetimeEvents?: LifetimeEvent[];
}

export const BecomingTransmutation = ({
  patterns,
  selectedPatternId,
  onPatternSelect,
  onUpdateTransmutation,
  onSyncGoldOutcome,
  onModeChange,
  lifetimeEvents = [],
}: BecomingTransmutationProps) => {
  const navigate = useNavigate();
  const [showCelebration, setShowCelebration] = useState(false);
  const [transmutationData, setTransmutationData] = useState<TransmutationData>({});
  
  // Node edit modal states (RESTORED)
  const [showNodeEditModal, setShowNodeEditModal] = useState(false);
  const [editingNode, setEditingNode] = useState<{id: string; label: string; phase: 'black' | 'white' | 'gold'} | null>(null);
  
  // White win card state
  const [showWhiteWinCard, setShowWhiteWinCard] = useState(false);
  const [pendingWhiteData, setPendingWhiteData] = useState<Partial<TransmutationData>>({});

  const selectedPattern = patterns.find((p) => p.id === selectedPatternId);

  // Derived states for phase completion
  const whiteComplete = isWhitePhaseComplete(transmutationData);
  const goldComplete = isGoldPhaseComplete(transmutationData);

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
        // Initialize with shadow from pattern
        setTransmutationData({
          shadow: selectedPattern.pattern_description || selectedPattern.pattern_name,
        });
      }
    }
  }, [selectedPattern]);

  // Get node label helper
  const getNodeLabel = (nodeId: string): string => {
    const nodeLabels: Record<string, string> = {
      shadow: "The Shadow",
      dark_night: "The Dark Night",
      shift_moment: "The Shift",
      protective_purpose: "The Purpose",
      lesson_learned: "The Lesson",
      gold_insight: "The Gold",
      letter_to_self: "Letter to Younger Self",
      brave_step: "The Brave Step",
    };
    return nodeLabels[nodeId] || nodeId;
  };

  // Handle node click - RESTORED to open edit modal
  const handleNodeClick = (nodeId: string, phase: 'black' | 'white' | 'gold') => {
    if (phase === 'gold' && !whiteComplete) {
      toast.info("Complete the White phase first");
      return;
    }
    
    // Open the node edit modal with the specific node
    const label = getNodeLabel(nodeId);
    setEditingNode({ id: nodeId, label, phase });
    setShowNodeEditModal(true);
  };

  // Handle node save from modal
  const handleNodeSave = async (content: string) => {
    if (!selectedPattern || !editingNode) return;

    const updatedData: TransmutationData = {
      ...transmutationData,
      [editingNode.id]: content,
    };

    // Check if this completes a phase
    if (editingNode.phase === 'white') {
      const wouldCompleteWhite = isWhitePhaseComplete(updatedData);
      if (wouldCompleteWhite && !whiteComplete) {
        setPendingWhiteData({ [editingNode.id]: content });
        setShowNodeEditModal(false);
        setShowWhiteWinCard(true);
        return;
      }
    }

    if (editingNode.phase === 'gold') {
      const wouldCompleteGold = isGoldPhaseComplete(updatedData);
      if (wouldCompleteGold && !goldComplete) {
        // Generate golden summary and complete
        const goldenSummary = generateGoldenSummary(updatedData, selectedPattern.pattern_name);
        const finalData: TransmutationData = {
          ...updatedData,
          golden_summary: goldenSummary,
          phase_completed: 'gold',
          gold_completed_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        };
        
        setTransmutationData(finalData);
        await onUpdateTransmutation(selectedPattern.id, finalData);
        
        await triggerGoldCompleteNotification(
          selectedPattern.id,
          selectedPattern.pattern_name,
          goldenSummary
        );
        
        setShowNodeEditModal(false);
        setShowCelebration(true);
        return;
      }
    }

    // Normal save
    setTransmutationData(updatedData);
    await onUpdateTransmutation(selectedPattern.id, updatedData);
    setShowNodeEditModal(false);
    toast.success("Progress saved");
  };

  // Navigate to mentor with full handoff context
  const navigateToMentorWithHandoff = async (mentorType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedPattern) {
        toast.error("Please select a pattern first");
        return;
      }

      // Fetch recent conversation history across all mentors
      const { data: recentMessages } = await supabase
        .from("chats")
        .select("role, content, mentor_type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      // Build transmutation context
      const phase = !whiteComplete ? 'white' : 'gold';
      const transmutationContext = {
        phase,
        patternId: selectedPattern.id,
        patternName: selectedPattern.pattern_name,
        patternDescription: selectedPattern.pattern_description,
        shadow: transmutationData.shadow || selectedPattern.pattern_description || selectedPattern.pattern_name,
        existingTransmutationData: transmutationData,
        lifeEvents: selectedPattern.life_events,
      };

      // Create handoff with transmutation context
      const handoffPayload = {
        user_id: user.id,
        source_mentor_type: "transmutation_map",
        target_mentor_type: mentorType,
        source_messages: recentMessages?.reverse() || [],
        journey_topic: `Transmutation ${phase === 'white' ? 'White' : 'Gold'} Phase for pattern: ${selectedPattern.pattern_name}`,
        voice_context: transmutationContext as any,
        processed: false,
      };

      const { data: handoff, error } = await supabase
        .from("conversation_handoffs")
        .insert(handoffPayload)
        .select()
        .single();

      if (handoff && !error) {
        navigate(`/council?view=${mentorType}`, {
          state: {
            handoffId: handoff.id,
            transmutationContext,
          }
        });
      } else {
        console.error("Handoff creation error:", error);
        toast.error("Failed to start conversation");
      }
    } catch (error) {
      console.error("Error creating transmutation handoff:", error);
      toast.error("Something went wrong");
    }
  };

  // Confirm White phase
  const handleConfirmWhite = async () => {
    if (!selectedPattern) return;

    const updatedData: TransmutationData = {
      ...transmutationData,
      ...pendingWhiteData,
      phase_completed: 'white',
      white_completed_at: new Date().toISOString(),
    };

    setTransmutationData(updatedData);
    await onUpdateTransmutation(selectedPattern.id, updatedData);
    
    setShowWhiteWinCard(false);
    setPendingWhiteData({});
    toast.success("White phase complete! Gold phase is now unlocked.");
  };

  const handleCelebrationSaveGold = () => {
    setShowCelebration(false);
    toast.success("Gold insight saved to your journey");
  };

  const handleCelebrationViewLifetime = async () => {
    setShowCelebration(false);
    // Sync gold outcome to lifetime events
    if (selectedPattern && transmutationData.golden_summary && onSyncGoldOutcome) {
      await onSyncGoldOutcome(selectedPattern.id, transmutationData.golden_summary);
    }
    onModeChange("lifetime");
    toast.success("View your gold insight in the Lifetime Map");
  };

  const handleAddNewPattern = () => {
    navigate("/transmutation-council");
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
              onClick={() => navigate("/transmutation-council")}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
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
                        : whiteComplete
                          ? "bg-slate-300/20 text-slate-500 mt-1"
                          : "bg-slate-500/20 text-slate-400 mt-1"
                    }
                  >
                    {selectedPattern.status === "transformed"
                      ? "Transmutation Complete ✨"
                      : whiteComplete
                        ? "Gold Phase Ready"
                        : "White Phase"}
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {selectedPattern.status === "transformed"
                ? "Your wisdom is now gold"
                : whiteComplete
                  ? "Click any Gold node to complete your transmutation"
                  : "Click any White node to begin the shift with Phoenix"}
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

      {/* Mentor-Specific CTAs */}
      <div className="space-y-3">
        {!whiteComplete && selectedPattern && (
          <Button
            onClick={() => navigateToMentorWithHandoff('phoenix_mentor')}
            className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600"
            size="lg"
          >
            <Flame className="w-4 h-4 mr-2" />
            Talk to Phoenix Mentor
          </Button>
        )}

        {whiteComplete && !goldComplete && selectedPattern && (
          <Button
            onClick={() => navigateToMentorWithHandoff('stoic_mentor')}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500"
            size="lg"
          >
            <Shield className="w-4 h-4 mr-2" />
            Talk to Stoic Mentor
          </Button>
        )}

        {goldComplete && (
          <Button
            onClick={handleAddNewPattern}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Pattern
          </Button>
        )}
      </div>

      {/* Transmutation Queue */}
      <TransmutationQueue
        activePatternId={selectedPatternId}
        patterns={patterns}
        lifetimeEvents={lifetimeEvents}
        onSelectPattern={onPatternSelect}
        onAddNew={handleAddNewPattern}
      />

      {/* Node Edit Modal (RESTORED) */}
      {selectedPattern && editingNode && (
        <TransmutationNodeEditModal
          open={showNodeEditModal}
          onClose={() => setShowNodeEditModal(false)}
          nodeId={editingNode.id}
          nodeLabel={editingNode.label}
          phase={editingNode.phase}
          currentContent={transmutationData[editingNode.id as keyof TransmutationData] as string || null}
          onSave={handleNodeSave}
          patternName={selectedPattern.pattern_name}
          patternContext={transmutationData.shadow || selectedPattern.pattern_description || selectedPattern.pattern_name}
          onNavigateToMentor={navigateToMentorWithHandoff}
        />
      )}

      {/* White Phase Win Card */}
      <WhitePhaseWinCard
        open={showWhiteWinCard}
        patternName={selectedPattern?.pattern_name || ""}
        shiftMoment={pendingWhiteData.shift_moment || ""}
        lesson={pendingWhiteData.lesson_learned || ""}
        protectivePurpose={pendingWhiteData.protective_purpose}
        onConfirm={handleConfirmWhite}
        onNotNow={() => setShowWhiteWinCard(false)}
      />

      {/* Transmutation Celebration */}
      {showCelebration && selectedPattern && (
        <TransmutationCelebration
          open={showCelebration}
          patternName={selectedPattern.pattern_name}
          goldInsight={transmutationData.gold_insight || ""}
          goldenSummary={transmutationData.golden_summary || ""}
          onSaveGold={handleCelebrationSaveGold}
          onViewLifetime={handleCelebrationViewLifetime}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </motion.div>
  );
};
