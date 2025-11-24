import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface EnergeticSnapshot {
  id: string;
  captured_at: string;
  energy_level: number;
  clarity_level: number;
  expansion_level: number;
  coherence_level: number;
  overall_frequency: string | null;
  emotional_state: string | null;
  activity_context: string | null;
  snapshot_type: string;
}

interface FutureSelfMessage {
  message: string;
  triggerReason: string;
  emotionalTone: string;
  timestamp: string;
}

export function useFutureSelfOmnipresence() {
  const [currentMessage, setCurrentMessage] = useState<FutureSelfMessage | null>(null);
  const [recentSnapshots, setRecentSnapshots] = useState<EnergeticSnapshot[]>([]);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);

  useEffect(() => {
    loadRecentSnapshots();
    setupRealtimeMonitoring();
  }, []);

  const loadRecentSnapshots = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await (supabase as any)
        .from("energetic_snapshots")
        .select("*")
        .eq("user_id", user.id)
        .order("captured_at", { ascending: false })
        .limit(10);

      if (data) {
        setRecentSnapshots(data as EnergeticSnapshot[]);
        analyzePatterns(data as EnergeticSnapshot[]);
      }
    } catch (error) {
      console.error("Error loading snapshots:", error);
    }
  };

  const setupRealtimeMonitoring = () => {
    const channel = (supabase as any)
      .channel("future-self-monitor")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "energetic_snapshots",
        },
        (payload: any) => {
          const newSnapshot = payload.new as EnergeticSnapshot;
          setRecentSnapshots((prev) => [newSnapshot, ...prev.slice(0, 9)]);
          
          // Analyze with new snapshot
          analyzePatterns([newSnapshot, ...recentSnapshots.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  };

  const analyzePatterns = async (snapshots: EnergeticSnapshot[]) => {
    if (snapshots.length === 0) return;

    const latest = snapshots[0];
    const timeSinceLastMessage = Date.now() - lastMessageTime;
    
    // Don't show messages too frequently (minimum 5 minutes between messages)
    if (timeSinceLastMessage < 5 * 60 * 1000) return;

    let shouldTrigger = false;
    let triggerReason = "";

    // Detect low energy
    if (latest.energy_level <= 3) {
      shouldTrigger = true;
      triggerReason = "low_energy";
    }

    // Detect breakthrough moment (high expansion + high clarity)
    if (latest.expansion_level >= 8 && latest.clarity_level >= 8) {
      shouldTrigger = true;
      triggerReason = "breakthrough";
    }

    // Detect high coherence spike
    if (latest.coherence_level >= 9) {
      shouldTrigger = true;
      triggerReason = "high_coherence";
    }

    // Detect flow state
    if (latest.snapshot_type === "flow_state") {
      shouldTrigger = true;
      triggerReason = "flow_state";
    }

    // Detect downward energy trend
    if (snapshots.length >= 3) {
      const energyTrend = snapshots.slice(0, 3).map(s => s.energy_level);
      const isDecreasing = energyTrend[0] < energyTrend[1] && energyTrend[1] < energyTrend[2];
      if (isDecreasing && energyTrend[0] < 5) {
        shouldTrigger = true;
        triggerReason = "energy_decline";
      }
    }

    // Detect expansion moment
    if (latest.expansion_level >= 8) {
      shouldTrigger = true;
      triggerReason = "expansion";
    }

    if (shouldTrigger) {
      await generateFutureSelfMessage(triggerReason, latest);
    }
  };

  const generateFutureSelfMessage = async (reason: string, snapshot: EnergeticSnapshot) => {
    try {
      const { data, error } = await supabase.functions.invoke("future-self-guidance", {
        body: {
          triggerReason: reason,
          energeticSnapshot: {
            energy_level: snapshot.energy_level,
            clarity_level: snapshot.clarity_level,
            expansion_level: snapshot.expansion_level,
            coherence_level: snapshot.coherence_level,
            emotional_state: snapshot.emotional_state,
            activity_context: snapshot.activity_context,
            snapshot_type: snapshot.snapshot_type,
          },
        },
      });

      if (error) throw error;

      const message: FutureSelfMessage = {
        message: data.message,
        triggerReason: reason,
        emotionalTone: data.emotional_tone,
        timestamp: new Date().toISOString(),
      };

      setCurrentMessage(message);
      setLastMessageTime(Date.now());
    } catch (error: any) {
      console.error("Error generating Future Self message:", error);
    }
  };

  const dismissMessage = () => {
    setCurrentMessage(null);
  };

  const manualTrigger = async (context?: string) => {
    const timeSinceLastMessage = Date.now() - lastMessageTime;
    if (timeSinceLastMessage < 2 * 60 * 1000) {
      toast({
        title: "Future Self is resting",
        description: "Give it a moment before calling again.",
      });
      return;
    }

    const latest = recentSnapshots[0];
    if (latest) {
      await generateFutureSelfMessage(context || "manual_request", latest);
    }
  };

  return {
    currentMessage,
    dismissMessage,
    manualTrigger,
    recentSnapshots,
  };
}
