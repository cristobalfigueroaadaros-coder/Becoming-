import { useEffect, useState, useRef } from "react";
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
  snapshotId?: string;
}

// 30 minutes between messages
const MIN_MESSAGE_INTERVAL = 30 * 60 * 1000;

export function useFutureSelfOmnipresence() {
  const [currentMessage, setCurrentMessage] = useState<FutureSelfMessage | null>(null);
  const [recentSnapshots, setRecentSnapshots] = useState<EnergeticSnapshot[]>([]);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const triggeredSnapshotIds = useRef<Set<string>>(new Set());
  const userId = useRef<string | null>(null);

  useEffect(() => {
    initializeFromDatabase();
    loadRecentSnapshots();
    const cleanup = setupRealtimeMonitoring();
    return cleanup;
  }, []);

  const initializeFromDatabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId.current = user.id;

      // Load last message time from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_future_self_message_at")
        .eq("id", user.id)
        .single();

      if (profile?.last_future_self_message_at) {
        setLastMessageTime(new Date(profile.last_future_self_message_at).getTime());
      }

      // Check for any unshown messages (created by edge functions like council unlock)
      const { data: unshownMessage } = await supabase
        .from("future_self_messages")
        .select("*")
        .eq("user_id", user.id)
        .eq("was_received", false)
        .is("dismissed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (unshownMessage) {
        // Show this message to the user
        setCurrentMessage({
          message: unshownMessage.message,
          triggerReason: unshownMessage.trigger_reason,
          emotionalTone: unshownMessage.emotional_tone || "warm",
          timestamp: unshownMessage.created_at,
          snapshotId: unshownMessage.snapshot_id || unshownMessage.id, // Use message ID as fallback
        });
      }

      // Load recent message snapshot IDs to avoid re-triggering
      const { data: recentMessages } = await supabase
        .from("future_self_messages")
        .select("snapshot_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (recentMessages) {
        recentMessages.forEach((m: any) => {
          if (m.snapshot_id) {
            triggeredSnapshotIds.current.add(m.snapshot_id);
          }
        });
      }

      setIsInitialized(true);
    } catch (error) {
      console.error("Error initializing Future Self:", error);
      setIsInitialized(true);
    }
  };

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
          
          // Only analyze if initialized
          if (isInitialized) {
            analyzePatterns([newSnapshot, ...recentSnapshots.slice(0, 9)]);
          }
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  };

  const analyzePatterns = async (snapshots: EnergeticSnapshot[]) => {
    if (snapshots.length === 0 || !isInitialized) return;

    const latest = snapshots[0];
    const timeSinceLastMessage = Date.now() - lastMessageTime;
    
    // 30-minute cooldown between messages
    if (timeSinceLastMessage < MIN_MESSAGE_INTERVAL) return;

    // Skip if this snapshot already triggered a message
    if (triggeredSnapshotIds.current.has(latest.id)) return;

    let shouldTrigger = false;
    let triggerReason = "";

    // Detect low energy (threshold 3 or below)
    if (latest.energy_level <= 3) {
      shouldTrigger = true;
      triggerReason = "low_energy";
    }

    // Detect breakthrough moment (high expansion + high clarity) - raised threshold
    if (latest.expansion_level >= 9 && latest.clarity_level >= 9) {
      shouldTrigger = true;
      triggerReason = "breakthrough";
    }

    // Detect high coherence spike - raised threshold
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
      if (isDecreasing && energyTrend[0] < 4) {
        shouldTrigger = true;
        triggerReason = "energy_decline";
      }
    }

    // Detect expansion moment - raised threshold
    if (latest.expansion_level >= 9) {
      shouldTrigger = true;
      triggerReason = "expansion";
    }

    if (shouldTrigger) {
      // Mark this snapshot as triggered before generating message
      triggeredSnapshotIds.current.add(latest.id);
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
        snapshotId: snapshot.id,
      };

      setCurrentMessage(message);
      setLastMessageTime(Date.now());
    } catch (error: any) {
      console.error("Error generating Future Self message:", error);
    }
  };

  const dismissMessage = async (wasReceived: boolean = false) => {
    if (currentMessage && userId.current) {
      // IMMEDIATELY add to triggered set to prevent re-showing
      if (currentMessage.snapshotId) {
        triggeredSnapshotIds.current.add(currentMessage.snapshotId);
      }
      
      // Update lastMessageTime immediately to enforce cooldown
      const now = Date.now();
      setLastMessageTime(now);
      
      // Clear the message immediately for responsive UI
      setCurrentMessage(null);
      
      // Then save/update in DB asynchronously
      try {
        // First check if this message already exists in DB (from edge function)
        const { data: existingMessage } = await supabase
          .from("future_self_messages")
          .select("id")
          .eq("user_id", userId.current)
          .eq("message", currentMessage.message)
          .eq("trigger_reason", currentMessage.triggerReason)
          .limit(1)
          .single();

        if (existingMessage) {
          // Update existing message
          await supabase
            .from("future_self_messages")
            .update({
              dismissed_at: new Date().toISOString(),
              was_received: wasReceived,
            })
            .eq("id", existingMessage.id);
        } else {
          // Insert new message
          await supabase.from("future_self_messages").insert({
            user_id: userId.current,
            message: currentMessage.message,
            trigger_reason: currentMessage.triggerReason,
            emotional_tone: currentMessage.emotionalTone,
            snapshot_id: currentMessage.snapshotId || null,
            dismissed_at: new Date().toISOString(),
            was_received: wasReceived,
          });
        }

        // Update profile with last message time
        await supabase
          .from("profiles")
          .update({ last_future_self_message_at: new Date().toISOString() })
          .eq("id", userId.current);
      } catch (error) {
        console.error("Error saving Future Self message:", error);
      }
    } else {
      setCurrentMessage(null);
    }
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
    } else {
      // Create a default snapshot if none exist
      await generateFutureSelfMessage(context || "manual_request", {
        id: "manual",
        captured_at: new Date().toISOString(),
        energy_level: 5,
        clarity_level: 5,
        expansion_level: 5,
        coherence_level: 5,
        overall_frequency: null,
        emotional_state: null,
        activity_context: null,
        snapshot_type: "manual",
      });
    }
  };

  return {
    currentMessage,
    dismissMessage,
    manualTrigger,
    recentSnapshots,
  };
}
