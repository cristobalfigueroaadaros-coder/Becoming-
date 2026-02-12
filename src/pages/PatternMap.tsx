import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Orbit, MessageCircle, Sparkles, Clock, Loader2 } from "lucide-react";
import { useInnerPatterns, type InnerPattern } from "@/hooks/useInnerPatterns";
import { useLifetimeEvents, type LifetimeEvent, type TimePeriod, type LifetimeEventInput } from "@/hooks/useLifetimeEvents";
import { PatternMapCanvas, PatternNodeEditModal } from "@/components/pattern-map";
import { 
  TransmutationMapCanvas, 
  TransmutationNodeEditModal, 
  TransmutationCelebration,
  type TransmutationData 
} from "@/components/transmutation-map";
import {
  LifetimeMapTimeline,
  LifetimeEventEditModal,
  LifetimeEventDetailView,
} from "@/components/lifetime-map";
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

const transmutationNodeLabels: Record<string, { label: string; phase: 'black' | 'white' | 'gold' }> = {
  shadow: { label: "The Shadow", phase: 'black' },
  dark_night: { label: "Dark Night", phase: 'black' },
  shift_moment: { label: "The Shift", phase: 'white' },
  protective_purpose: { label: "Protective Role", phase: 'white' },
  lesson_learned: { label: "The Lesson", phase: 'white' },
  gold_insight: { label: "The Gold", phase: 'gold' },
  letter_to_self: { label: "To Younger Me", phase: 'gold' },
  brave_step: { label: "Brave Step", phase: 'gold' },
};

const PatternMap = () => {
  const { patternId } = useParams<{ patternId: string }>();
  const navigate = useNavigate();
  const { patterns, loading, updatePattern, updateTransmutationData } = useInnerPatterns();
  const { 
    events: lifetimeEvents, 
    loading: lifetimeLoading, 
    createEvent, 
    updateEvent, 
    deleteEvent,
    getEventsByPeriod,
    syncGoldOutcome,
  } = useLifetimeEvents();
  
  const [pattern, setPattern] = useState<InnerPattern | null>(null);
  const [nodeData, setNodeData] = useState<PatternNodeData>({});
  const [transmutationData, setTransmutationData] = useState<TransmutationData>({});
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editingTransmutationNode, setEditingTransmutationNode] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeTab, setActiveTab] = useState("pattern-map");

  // Lifetime map state
  const [editingLifetimeEvent, setEditingLifetimeEvent] = useState<LifetimeEvent | null>(null);
  const [showLifetimeEditModal, setShowLifetimeEditModal] = useState(false);
  const [defaultTimePeriod, setDefaultTimePeriod] = useState<TimePeriod>('current');
  const [selectedLifetimeEvent, setSelectedLifetimeEvent] = useState<LifetimeEvent | null>(null);
  const [showLifetimeDetailView, setShowLifetimeDetailView] = useState(false);

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
        // Parse transmutation_data
        const transData = (found as any).transmutation_data;
        if (transData && typeof transData === 'object') {
          setTransmutationData(transData as TransmutationData);
          // Auto-populate from pattern map data if transmutation is empty
          if (!transData.protective_purpose && lifeEvents && (lifeEvents as PatternNodeData).protective_role) {
            setTransmutationData(prev => ({
              ...prev,
              protective_purpose: (lifeEvents as PatternNodeData).protective_role,
            }));
          }
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

  const handleTransmutationNodeClick = (nodeId: string, phase?: 'black' | 'white' | 'gold') => {
    const nodePhase = phase || transmutationNodeLabels[nodeId]?.phase || 'white';
    
    if (nodePhase === 'black') {
      return; // View-only
    }
    
    // Check if white is complete for gold access
    const whiteComplete = !!(transmutationData.shift_moment && transmutationData.lesson_learned);
    if (nodePhase === 'gold' && !whiteComplete) {
      toast.info("Complete the White phase first");
      return;
    }
    
    // Route to mentor
    if (nodePhase === 'white') {
      navigate('/council?view=phoenix_mentor');
    } else if (nodePhase === 'gold') {
      navigate('/council?view=stoic_mentor');
    }
  };

  const handleTransmutationNodeSave = async (content: string) => {
    if (!pattern || !editingTransmutationNode) return;
    
    const updatedData = { ...transmutationData, [editingTransmutationNode]: content };
    setTransmutationData(updatedData);
    
    // Check if gold phase is complete
    const isGoldComplete = !!(
      updatedData.gold_insight && 
      updatedData.letter_to_self
    );
    
    if (isGoldComplete && !transmutationData.phase_completed) {
      updatedData.phase_completed = 'gold';
      updatedData.completed_at = new Date().toISOString();
    }
    
    const success = await updateTransmutationData(pattern.id, updatedData);
    
    if (success) {
      toast.success("Transmutation map updated");
      // Show celebration if gold phase just completed
      if (isGoldComplete && !transmutationData.phase_completed) {
        setShowCelebration(true);
      }
    }
    
    setEditingTransmutationNode(null);
  };

  const handleCelebrationSaveGold = () => {
    setShowCelebration(false);
    toast.success("Gold insight saved to your journey");
  };

  const handleCelebrationViewLifetime = async () => {
    setShowCelebration(false);
    // Sync gold outcome to lifetime events
    if (pattern && transmutationData.gold_insight) {
      await syncGoldOutcome(pattern.id, transmutationData.gold_insight);
    }
    setActiveTab("lifetime");
    toast.success("View your gold insight in the Lifetime Map");
  };

  const handleKeepTalking = () => {
    navigate('/council?view=inner_clarity_mentor');
  };

  // Lifetime map handlers
  const handleLifetimeEventClick = (event: LifetimeEvent) => {
    setSelectedLifetimeEvent(event);
    setShowLifetimeDetailView(true);
  };

  const handleAddLifetimeEvent = (timePeriod: TimePeriod) => {
    setDefaultTimePeriod(timePeriod);
    setEditingLifetimeEvent(null);
    setShowLifetimeEditModal(true);
  };

  const handleLifetimeEventSave = async (data: LifetimeEventInput) => {
    if (editingLifetimeEvent) {
      await updateEvent(editingLifetimeEvent.id, data);
      toast.success("Event updated");
    } else {
      // Link to current pattern if we're viewing one
      const eventData = pattern 
        ? { ...data, pattern_id: pattern.id, pattern_name: pattern.pattern_name }
        : data;
      await createEvent(eventData);
      toast.success("Event added to your timeline");
    }
  };

  const handleLifetimeEventDelete = async () => {
    if (editingLifetimeEvent) {
      await deleteEvent(editingLifetimeEvent.id);
      toast.success("Event removed");
    }
  };

  const handleGoToPatternMap = () => {
    setShowLifetimeDetailView(false);
    setActiveTab("pattern-map");
  };

  const handleGoToTransmutation = () => {
    setShowLifetimeDetailView(false);
    setActiveTab("transmutation");
  };

  const handleTalkToMentor = () => {
    setShowLifetimeDetailView(false);
    navigate('/council?view=inner_clarity_mentor');
  };

  const handleEditLifetimeEvent = () => {
    if (selectedLifetimeEvent) {
      setEditingLifetimeEvent(selectedLifetimeEvent);
      setShowLifetimeDetailView(false);
      setShowLifetimeEditModal(true);
    }
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
        <Button variant="outline" onClick={() => navigate('/creation-lab?type=becoming&bmode=pattern-map')}>
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/creation-lab?type=becoming&bmode=pattern-map')}>
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
            <TabsTrigger value="transmutation" className="gap-1">
              <Sparkles className="w-3 h-3" />
              Transmutation
              {pattern.status === 'transformed' && (
                <span className="ml-1 text-amber-500">✨</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="lifetime" className="gap-1">
              <Clock className="w-3 h-3" />
              Lifetime
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Pattern Map Canvas */}
        {activeTab === "pattern-map" && (
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
        )}

        {/* Transmutation Map Canvas */}
        {activeTab === "transmutation" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`overflow-hidden ${
              pattern.status === 'transformed' 
                ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-transparent'
                : 'border-slate-500/20 bg-gradient-to-br from-slate-500/5 to-transparent'
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${pattern.status === 'transformed' ? 'text-amber-500' : 'text-slate-400'}`} />
                  {pattern.status === 'transformed' 
                    ? 'Transmutation Complete — Your wisdom is now gold'
                    : 'Black → White → Gold — Tap nodes to begin your transmutation'
                  }
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <TransmutationMapCanvas
                  patternName={pattern.pattern_name}
                  transmutationData={transmutationData}
                  onNodeClick={handleTransmutationNodeClick}
                  isCompleted={pattern.status === 'transformed'}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Lifetime Map */}
        {activeTab === "lifetime" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-slate-500/20 bg-gradient-to-br from-slate-500/5 to-transparent overflow-hidden">
              <CardContent className="pt-6">
                <LifetimeMapTimeline
                  events={lifetimeEvents}
                  eventsByPeriod={getEventsByPeriod()}
                  onEventClick={handleLifetimeEventClick}
                  onAddEvent={handleAddLifetimeEvent}
                  currentPatternId={pattern.id}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pattern description (only on pattern-map tab) */}
        {activeTab === "pattern-map" && pattern.pattern_description && (
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
          
          {activeTab !== "transmutation" && pattern.status !== 'transformed' && (
            <Button
              variant="outline"
              className="w-full border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
              size="lg"
              onClick={() => setActiveTab("transmutation")}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Transmutation Journey
            </Button>
          )}
          
          <Button
            variant="ghost"
            onClick={() => navigate('/creation-lab?type=becoming&bmode=pattern-map')}
            className="w-full"
          >
            Back to Inner Work Lab
          </Button>
        </motion.div>
      </div>

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

      {/* Transmutation Node Edit Modal */}
      {editingTransmutationNode && (
        <TransmutationNodeEditModal
          open={!!editingTransmutationNode}
          onClose={() => setEditingTransmutationNode(null)}
          nodeId={editingTransmutationNode}
          nodeLabel={transmutationNodeLabels[editingTransmutationNode]?.label || editingTransmutationNode}
          phase={transmutationNodeLabels[editingTransmutationNode]?.phase || 'white'}
          currentContent={transmutationData[editingTransmutationNode as keyof TransmutationData] as string || null}
          onSave={handleTransmutationNodeSave}
        />
      )}

      {/* Lifetime Event Edit Modal */}
      <LifetimeEventEditModal
        open={showLifetimeEditModal}
        onClose={() => {
          setShowLifetimeEditModal(false);
          setEditingLifetimeEvent(null);
        }}
        event={editingLifetimeEvent}
        defaultTimePeriod={defaultTimePeriod}
        onSave={handleLifetimeEventSave}
        onDelete={editingLifetimeEvent ? handleLifetimeEventDelete : undefined}
      />

      {/* Lifetime Event Detail View */}
      <LifetimeEventDetailView
        event={selectedLifetimeEvent}
        open={showLifetimeDetailView}
        onClose={() => {
          setShowLifetimeDetailView(false);
          setSelectedLifetimeEvent(null);
        }}
        onGoToPatternMap={handleGoToPatternMap}
        onGoToTransmutation={handleGoToTransmutation}
        onTalkToMentor={handleTalkToMentor}
        onEdit={handleEditLifetimeEvent}
      />

      {/* Transmutation Celebration */}
      <TransmutationCelebration
        open={showCelebration}
        patternName={pattern?.pattern_name || ''}
        goldInsight={transmutationData.gold_insight || ''}
        onSaveGold={handleCelebrationSaveGold}
        onViewLifetime={handleCelebrationViewLifetime}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
};

export default PatternMap;
