import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Orbit, MessageCircle } from "lucide-react";
import { MicroGuide } from "@/components/MicroGuide";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PatternSelector } from "./PatternSelector";
import { PatternMapCanvas, PatternNodeEditModal } from "@/components/pattern-map";
import type { InnerPattern } from "@/hooks/useInnerPatterns";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

interface PatternNodeData {
  trigger_event?: string;
  old_story?: string;
  mental_loop?: string;
  cost?: string;
  protective_role?: string;
  life_event?: string;
  life_event_age_category?: string;
}

const nodeLabels: Record<string, string> = {
  trigger_event: "Trigger Event",
  old_story: "Old Story",
  mental_loop: "Mental Loop",
  cost: "Cost",
  protective_role: "Protective Role",
  life_event: "Life Event",
};

interface BecomingPatternMapProps {
  patterns: InnerPattern[];
  selectedPatternId: string | null;
  onPatternSelect: (id: string) => void;
  onUpdatePattern: (id: string, updates: { life_events: Json }) => Promise<boolean>;
}

export const BecomingPatternMap = ({
  patterns,
  selectedPatternId,
  onPatternSelect,
  onUpdatePattern,
}: BecomingPatternMapProps) => {
  const navigate = useNavigate();
  const [editingNode, setEditingNode] = useState<string | null>(null);

  const selectedPattern = patterns.find((p) => p.id === selectedPatternId);

  const nodeData: PatternNodeData =
    selectedPattern?.life_events &&
    typeof selectedPattern.life_events === "object" &&
    !Array.isArray(selectedPattern.life_events)
      ? (selectedPattern.life_events as PatternNodeData)
      : {};

  const handleNodeClick = (nodeType: string) => {
    setEditingNode(nodeType);
  };

  const handleNodeSave = async (content: string) => {
    if (!selectedPattern || !editingNode) return;

    const updatedNodeData = { ...nodeData, [editingNode]: content };

    const success = await onUpdatePattern(selectedPattern.id, {
      life_events: updatedNodeData as unknown as Json,
    });

    if (success) {
      toast.success("Pattern map updated");
    }

    setEditingNode(null);
  };

  const handleKeepTalking = () => {
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
        <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent text-center py-12">
          <CardContent>
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <Orbit className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No patterns discovered yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Explore your inner landscape with the Transmutation Council to discover and map your
              patterns.
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

      {/* Pattern Map Canvas */}
      {selectedPattern && (
        <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Orbit className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {selectedPattern.pattern_name}
                    <MicroGuide
                      guideKey="pattern_profile"
                      title="Your Pattern Profile"
                      description={"This profile helps identify recurring behaviors or challenges in your life.\n\nRecognizing patterns is the first step toward transformation."}
                    />
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className={
                        selectedPattern.status === "transformed"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-indigo-500/20 text-indigo-400"
                      }
                    >
                      {selectedPattern.status === "transformed" ? "Transformed" : "Exploring"}
                    </Badge>
                    {selectedPattern.primary_emotion && (
                      <Badge variant="outline" className="text-xs">
                        {selectedPattern.primary_emotion}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Tap any node to explore deeper
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <PatternMapCanvas
              patternName={selectedPattern.pattern_name}
              nodeData={nodeData}
              onNodeClick={handleNodeClick}
            />
          </CardContent>
        </Card>
      )}

      {/* Pattern description */}
      {selectedPattern?.pattern_description && (
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground italic">
              {selectedPattern.pattern_description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Button
        onClick={handleKeepTalking}
        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
        size="lg"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Continue with Transmutation Council
      </Button>

      {/* Pattern Node Edit Modal */}
      {editingNode && (
        <PatternNodeEditModal
          open={!!editingNode}
          onClose={() => setEditingNode(null)}
          nodeType={editingNode}
          nodeLabel={nodeLabels[editingNode] || editingNode}
          currentContent={nodeData[editingNode as keyof PatternNodeData] || null}
          onSave={handleNodeSave}
        />
      )}
    </motion.div>
  );
};
