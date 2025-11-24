import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, TrendingUp, Heart, Target, Waves } from "lucide-react";
import { EnergyTimeline } from "@/components/energetic/EnergyTimeline";
import { CoherenceRadar } from "@/components/energetic/CoherenceRadar";
import { FlowStateTracker } from "@/components/energetic/FlowStateTracker";
import { VibrationPatterns } from "@/components/energetic/VibrationPatterns";
import { FrequencyMeter } from "@/components/energetic/FrequencyMeter";
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
      
      // Set current frequency from most recent snapshot
      if (data && data.length > 0) {
        setCurrentFrequency((data[0] as EnergeticSnapshot).overall_frequency || "medium");
      }
    } catch (error: any) {
      console.error("Error loading snapshots:", error);
      toast({
        title: "Error loading energetic data",
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
          console.log("New energetic snapshot:", payload);
          const newSnapshot = payload.new as EnergeticSnapshot;
          setSnapshots((prev) => [newSnapshot, ...prev].slice(0, 50));
          setCurrentFrequency(newSnapshot.overall_frequency || "medium");
          
          // Show toast for significant moments
          const freq = newSnapshot.overall_frequency;
          if (freq === "very-high" || freq === "high") {
            toast({
              title: "✨ High Frequency Moment Detected",
              description: `${newSnapshot.emotional_state || ''} - ${newSnapshot.activity_context || ''}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  };

  // Calculate current stats
  const avgEnergy = snapshots.length > 0 
    ? snapshots.slice(0, 10).reduce((acc, s) => acc + s.energy_level, 0) / Math.min(10, snapshots.length)
    : 0;
  
  const avgCoherence = snapshots.length > 0
    ? snapshots.slice(0, 10).reduce((acc, s) => acc + s.coherence_level, 0) / Math.min(10, snapshots.length)
    : 0;

  const flowStateCount = snapshots.filter(s => s.snapshot_type === "flow_state").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center">
          <Waves className="w-16 h-16 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your energetic field...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Energetic Intelligence
              </h1>
              <p className="text-muted-foreground">
                Real-time tracking of your vibrational field, flow states, and coherence patterns
              </p>
            </div>
            
            <FrequencyMeter frequency={currentFrequency} />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-card/50 backdrop-blur border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Energy</p>
                <p className="text-3xl font-bold text-primary">{avgEnergy.toFixed(1)}</p>
              </div>
              <Zap className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-accent/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Coherence</p>
                <p className="text-3xl font-bold text-accent">{avgCoherence.toFixed(1)}</p>
              </div>
              <Heart className="w-8 h-8 text-accent" />
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-secondary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Flow States</p>
                <p className="text-3xl font-bold text-secondary">{flowStateCount}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-secondary" />
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-muted">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Captures</p>
                <p className="text-3xl font-bold">{snapshots.length}</p>
              </div>
              <Target className="w-8 h-8 text-foreground" />
            </div>
          </Card>
        </div>

        {/* Main Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <EnergyTimeline snapshots={snapshots} />
          <CoherenceRadar snapshots={snapshots.slice(0, 1)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FlowStateTracker snapshots={snapshots} />
          <VibrationPatterns snapshots={snapshots} />
        </div>
      </div>
    </div>
  );
}
