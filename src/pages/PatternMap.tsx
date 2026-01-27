import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Orbit, MessageCircle, Sparkles, Lock, Loader2 } from "lucide-react";
import { useInnerPatterns, type InnerPattern } from "@/hooks/useInnerPatterns";
import { PatternMapCanvas, PatternNodeEditModal } from "@/components/pattern-map";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

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

const PatternMap = () => {
  const { patternId } = useParams<{ patternId: string }>();
  const navigate = useNavigate();
  const { patterns, loading, updatePattern } = useInnerPatterns();
  
  const [pattern, setPattern] = useState<InnerPattern | null>(null);
  const [nodeData, setNodeData] = useState<PatternNodeData>({});
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pattern-map");

  // Find the pattern
  useEffect(() => {
    if (patterns.length > 0 && patternId) {
      const found = patterns.find(p => p.id === patternId);
      if (found) {
        setPattern(found);
        // Parse life_events as node data
        const lifeEvents = found.life_events;
        if (lifeEvents && typeof lifeEvents === 'object' && !Array.isArray(lifeEvents)) {
          setNodeData(lifeEvents as PatternNodeData);
        }
      }
    }
  }, [patterns, patternId]);

  const handleNodeClick = (nodeType: string) => {
    setEditingNode(nodeType);
  };

  const handleNodeSave = async (content: string) => {
    if (!pattern) return;
    
    const updatedNodeData = { ...nodeData, [editingNode!]: content };
    setNodeData(updatedNodeData);
    
    // Save to database
    const success = await updatePattern(pattern.id, { 
      life_events: updatedNodeData as unknown as Json 
    });
    
    if (success) {
      toast.success("Pattern map updated");
    }
    
    setEditingNode(null);
  };

  const handleKeepTalking = () => {
    navigate('/council?view=inner_clarity_mentor');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500/5 via-background to-purple-500/5">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!pattern) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 bg-gradient-to-br from-indigo-500/5 via-background to-purple-500/5">
        <Orbit className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">Pattern not found</p>
        <Button variant="outline" onClick={() => navigate('/creation-lab?type=becoming')}>
          Back to Inner Work Lab
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500/5 via-background to-purple-500/5 p-4 pb-28">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/creation-lab?type=becoming')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Orbit className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{pattern.pattern_name}</h1>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={pattern.status === 'transformed' 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "bg-indigo-500/20 text-indigo-400"
                    }
                  >
                    {pattern.status === 'transformed' ? 'Transformed' : 'Exploring'}
                  </Badge>
                  {pattern.primary_emotion && (
                    <Badge variant="outline" className="text-xs">
                      {pattern.primary_emotion}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pattern-map" className="gap-1">
              <Orbit className="w-3 h-3" />
              Pattern Map
            </TabsTrigger>
            <TabsTrigger value="transmutation" className="gap-1" disabled>
              <Sparkles className="w-3 h-3" />
              Transmutation
              <Lock className="w-3 h-3 ml-1" />
            </TabsTrigger>
            <TabsTrigger value="lifetime" className="gap-1" disabled>
              Lifetime
              <Lock className="w-3 h-3 ml-1" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Pattern Map Canvas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Tap any node to explore deeper
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <PatternMapCanvas
                patternName={pattern.pattern_name}
                nodeData={nodeData}
                onNodeClick={handleNodeClick}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Pattern description */}
        {pattern.pattern_description && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground italic">
                  {pattern.pattern_description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <Button
            onClick={handleKeepTalking}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
            size="lg"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Keep talking with Inner Self Mentor
          </Button>
          
          <Button
            variant="outline"
            className="w-full border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
            size="lg"
            disabled
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Start Transmutation Journey
            <Badge variant="secondary" className="ml-2 text-xs">Coming Soon</Badge>
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => navigate('/creation-lab?type=becoming')}
            className="w-full"
          >
            Back to Inner Work Lab
          </Button>
        </motion.div>
      </div>

      {/* Edit Modal */}
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
    </div>
  );
};

export default PatternMap;
