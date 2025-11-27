/**
 * ❗ CONSCIOUSNESS TRACKING RULES
 * 
 * 1. NEVER display consciousness meters, scores, levels, or numeric progression
 * 2. NEVER show graphs/charts of spiritual/energetic states
 * 3. Consciousness is expressed ONLY through mentor voice, reflections, and task design
 * 4. Frequency references are SYMBOLIC METAPHORS, not metrics
 * 5. The arc is FELT, not displayed
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Heart, Sun, Wind, Feather } from "lucide-react";
import { FrequencyMeter } from "@/components/energetic/FrequencyMeter";
import { EnergyCaptureWidget } from "@/components/energetic/EnergyCaptureWidget";
import { toast } from "@/hooks/use-toast";

interface EnergeticSnapshot {
  id: string;
  captured_at: string;
  energy_level: number;
  clarity_level: number;
  expansion_level: number;
  alignment_feeling: number;
  coherence_level: number;
  emotional_state: string | null;
  overall_frequency: string | null;
  activity_context: string | null;
  snapshot_type: string;
}

// Narrative patterns based on recent snapshots - no numbers shown to user
function getNarrativePattern(snapshots: EnergeticSnapshot[]): { pattern: string; guidance: string } {
  if (snapshots.length < 2) {
    return {
      pattern: "Your journey is just beginning",
      guidance: "Capture a few moments to start noticing your patterns."
    };
  }

  const recentSnapshots = snapshots.slice(0, 5);
  const hasHighEnergy = recentSnapshots.some(s => s.overall_frequency === "high" || s.overall_frequency === "very-high");
  const hasFlowStates = recentSnapshots.some(s => s.snapshot_type === "flow_state");
  const recentEmotions = recentSnapshots.map(s => s.emotional_state).filter(Boolean);
  const recentActivities = recentSnapshots.map(s => s.activity_context).filter(Boolean);

  if (hasFlowStates && hasHighEnergy) {
    return {
      pattern: "You've been touching flow states recently",
      guidance: "Notice what activities and conditions brought you there. Trust that alignment."
    };
  }

  if (hasHighEnergy) {
    return {
      pattern: "You've been showing up with openness and curiosity",
      guidance: "Your mentors are noticing. Keep following what expands you."
    };
  }

  if (recentEmotions.length > 0) {
    const emotions = [...new Set(recentEmotions)].slice(0, 2).join(" and ");
    return {
      pattern: `You've been experiencing ${emotions}`,
      guidance: "All feelings are valid. Notice what your body is telling you."
    };
  }

  if (recentActivities.length > 0) {
    return {
      pattern: "You've been actively engaging with life",
      guidance: "Pay attention to which activities leave you feeling expanded."
    };
  }

  return {
    pattern: "You're building awareness of your inner landscape",
    guidance: "Each moment you capture deepens your self-knowledge."
  };
}

// Get qualitative insight about flow states - no counting
function getFlowInsight(snapshots: EnergeticSnapshot[]): string {
  const flowSnapshots = snapshots.filter(s => s.snapshot_type === "flow_state");
  
  if (flowSnapshots.length === 0) {
    return "Flow states are moments when you're fully absorbed and energized. Capture them when they happen.";
  }

  const recentFlow = flowSnapshots[0];
  if (recentFlow.activity_context) {
    return `You recently experienced flow during ${recentFlow.activity_context}. What conditions made that possible?`;
  }

  return "You've touched flow states. Notice what activities and environments bring you there.";
}

// Get qualitative insight about emotional patterns - no numbers
function getEmotionalInsight(snapshots: EnergeticSnapshot[]): string {
  const emotions = snapshots
    .slice(0, 10)
    .map(s => s.emotional_state)
    .filter(Boolean);

  if (emotions.length === 0) {
    return "Start naming your emotional states to build deeper self-awareness.";
  }

  const uniqueEmotions = [...new Set(emotions)];
  if (uniqueEmotions.length === 1) {
    return `You've been consistently feeling ${uniqueEmotions[0]}. What does that tell you?`;
  }

  return `You're experiencing a range of emotions. Each one carries wisdom for you.`;
}

export default function EnergeticDashboard() {
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState<EnergeticSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFrequency, setCurrentFrequency] = useState<string>("medium");

  useEffect(() => {
    loadSnapshots();
    setupRealtimeSubscription();
  }, []);

  const loadSnapshots = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from("energetic_snapshots")
        .select("*")
        .eq("user_id", user.id)
        .order("captured_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setSnapshots((data as EnergeticSnapshot[]) || []);
      
      if (data && data.length > 0) {
        setCurrentFrequency((data[0] as EnergeticSnapshot).overall_frequency || "medium");
      }
    } catch (error: any) {
      console.error("Error loading snapshots:", error);
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = (supabase as any)
      .channel("energetic-snapshots-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "energetic_snapshots",
        },
        (payload: any) => {
          const newSnapshot = payload.new as EnergeticSnapshot;
          setSnapshots((prev) => [newSnapshot, ...prev].slice(0, 50));
          setCurrentFrequency(newSnapshot.overall_frequency || "medium");
          
          // Show narrative toast for significant moments
          const freq = newSnapshot.overall_frequency;
          if (freq === "very-high" || freq === "high") {
            toast({
              title: "✨ Beautiful moment captured",
              description: "You're in an expansive state. Notice how this feels.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  };

  const narrativePattern = getNarrativePattern(snapshots);
  const flowInsight = getFlowInsight(snapshots);
  const emotionalInsight = getEmotionalInsight(snapshots);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center">
          <Sparkles className="w-16 h-16 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Tuning into your inner landscape...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate("/vibrational-insights")}
            className="w-full mb-4 bg-gradient-to-r from-secondary to-accent hover:opacity-90"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            View Your Patterns
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="w-full mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Inner Weather
              </h1>
              <p className="text-muted-foreground">
                Tune into how you're feeling. No tracking, just awareness.
              </p>
            </div>
            
            <FrequencyMeter frequency={currentFrequency} />
          </div>
        </div>

        {/* Narrative Insight Cards - No Numbers */}
        <div className="space-y-4 mb-8">
          {/* Current Pattern */}
          <Card className="bg-gradient-to-br from-primary/10 via-card/50 to-accent/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Sun className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Recent Pattern</h3>
                  <p className="text-foreground mb-2">{narrativePattern.pattern}</p>
                  <p className="text-sm text-muted-foreground italic">{narrativePattern.guidance}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flow Insight */}
          <Card className="bg-card/50 backdrop-blur border-accent/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Wind className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Flow States</h3>
                  <p className="text-sm text-muted-foreground">{flowInsight}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emotional Insight */}
          <Card className="bg-card/50 backdrop-blur border-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                  <Heart className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Emotional Landscape</h3>
                  <p className="text-sm text-muted-foreground">{emotionalInsight}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Somatic Prompt */}
          <Card className="bg-card/50 backdrop-blur border-muted">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Feather className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Body Check</h3>
                  <p className="text-sm text-muted-foreground">
                    Right now, notice your breath. Is it shallow or deep? 
                    Notice your shoulders. Relaxed or tense? 
                    Your body holds wisdom your mind hasn't processed yet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Moments - Qualitative List */}
        {snapshots.length > 0 && (
          <Card className="bg-card/50 backdrop-blur border-primary/20 mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Recent Moments</h3>
              <div className="space-y-3">
                {snapshots.slice(0, 5).map((snapshot) => (
                  <div 
                    key={snapshot.id} 
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      snapshot.overall_frequency === "very-high" ? "bg-secondary" :
                      snapshot.overall_frequency === "high" ? "bg-accent" :
                      snapshot.overall_frequency === "medium" ? "bg-primary" :
                      "bg-muted-foreground"
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {snapshot.emotional_state || "Moment captured"}
                      </p>
                      {snapshot.activity_context && (
                        <p className="text-xs text-muted-foreground">
                          During: {snapshot.activity_context}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(snapshot.captured_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Energy Capture Widget */}
        <EnergyCaptureWidget />
      </div>
    </div>
  );
}
