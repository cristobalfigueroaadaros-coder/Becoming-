import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { LifetimeCandidateSeed } from "@/lib/lifetimeCandidates";

export type TimePeriod = 
  | 'childhood' 
  | 'teen' 
  | 'early_20s' 
  | 'mid_20s' 
  | 'late_20s' 
  | '30s' 
  | 'current';

export type EventType = 
  | 'family' 
  | 'love' 
  | 'health' 
  | 'money' 
  | 'work' 
  | 'friendship' 
  | 'identity' 
  | 'loss' 
  | 'change';

export interface LifetimeEvent {
  id: string;
  user_id: string;
  time_period: TimePeriod;
  event_label: string;
  event_description: string | null;
  event_type: EventType | null;
  pattern_id: string | null;
  pattern_name: string | null;
  gold_outcome: string | null;
  is_transmuted: boolean;
  created_at: string;
  updated_at: string;
}

export interface LifetimeEventInput {
  time_period: TimePeriod;
  event_label: string;
  event_description?: string;
  event_type?: EventType;
  pattern_id?: string;
  pattern_name?: string;
}

export interface LifetimeEventCandidate {
  id: string;
  user_id: string;
  candidate_key: string;
  event_label: string;
  event_description: string | null;
  suggested_time_period: TimePeriod;
  suggested_event_type: EventType | null;
  source_quest_id: string | null;
  source_evidence: string[];
  status: "available" | "locked" | "added" | "dismissed";
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type LifetimeEventCandidateInput = LifetimeCandidateSeed & {
  source_quest_id?: string | null;
};

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  childhood: 'Childhood',
  teen: 'Teen Years',
  early_20s: 'Early 20s',
  mid_20s: 'Mid 20s',
  late_20s: 'Late 20s',
  '30s': '30s',
  current: 'Current Life',
};

export const TIME_PERIODS: TimePeriod[] = [
  'childhood',
  'teen',
  'early_20s',
  'mid_20s',
  'late_20s',
  '30s',
  'current',
];

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string }> = {
  family: { label: 'Family', color: 'blue' },
  love: { label: 'Love/Relationship', color: 'pink' },
  health: { label: 'Health/Body', color: 'green' },
  money: { label: 'Money/Survival', color: 'amber' },
  work: { label: 'School/Work', color: 'indigo' },
  friendship: { label: 'Friendship', color: 'cyan' },
  identity: { label: 'Identity', color: 'purple' },
  loss: { label: 'Loss/Grief', color: 'slate' },
  change: { label: 'Big Change', color: 'orange' },
};

export const EVENT_TYPES: EventType[] = [
  'family',
  'love',
  'health',
  'money',
  'work',
  'friendship',
  'identity',
  'loss',
  'change',
];

export function useLifetimeEvents() {
  const [events, setEvents] = useState<LifetimeEvent[]>([]);
  const [candidates, setCandidates] = useState<LifetimeEventCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadEvents = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("lifetime_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      setEvents((data || []) as LifetimeEvent[]);
    } catch (error) {
      console.error("Error loading lifetime events:", error);
      toast({
        title: "Error",
        description: "Failed to load lifetime events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadCandidates = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCandidates([]);
        return;
      }

      const [{ data: questRows, error: questError }, { data: eventRows, error: eventError }] = await Promise.all([
        supabase
          .from("atlas_quests")
          .select("id, interactions")
          .eq("user_id", user.id)
          .like("quest_key", "future_self_%")
          .order("completed_at", { ascending: true }),
        supabase
          .from("lifetime_events")
          .select("event_label")
          .eq("user_id", user.id),
      ]);
      if (questError) throw questError;
      if (eventError) throw eventError;

      const savedLabels = new Set((eventRows || []).map((event) => event.event_label.trim().toLowerCase()));
      const uniqueSeeds = new Map<string, LifetimeCandidateSeed & { source_quest_id: string | null }>();

      (questRows || []).forEach((quest) => {
        const interactions = quest.interactions as {
          privateSignalMap?: { timelineCandidates?: unknown };
        } | null;
        const timelineCandidates = interactions?.privateSignalMap?.timelineCandidates;
        if (!Array.isArray(timelineCandidates)) return;

        timelineCandidates.forEach((candidate) => {
          if (!candidate || typeof candidate !== "object") return;
          const item = candidate as Partial<LifetimeCandidateSeed>;
          if (typeof item.candidate_key !== "string" || typeof item.event_label !== "string") return;
          if (!uniqueSeeds.has(item.candidate_key)) {
            uniqueSeeds.set(item.candidate_key, {
              candidate_key: item.candidate_key,
              event_label: item.event_label,
              event_description: typeof item.event_description === "string" ? item.event_description : "",
              suggested_time_period: TIME_PERIODS.includes(item.suggested_time_period as TimePeriod)
                ? item.suggested_time_period as TimePeriod
                : "current",
              suggested_event_type: EVENT_TYPES.includes(item.suggested_event_type as EventType)
                ? item.suggested_event_type as EventType
                : "identity",
              source_evidence: Array.isArray(item.source_evidence)
                ? item.source_evidence.filter((value): value is string => typeof value === "string")
                : [],
              sort_order: typeof item.sort_order === "number" ? item.sort_order : uniqueSeeds.size * 10,
              source_quest_id: quest.id,
            });
          }
        });
      });

      let availableAssigned = false;
      const hydrated = Array.from(uniqueSeeds.values())
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((seed) => {
          const isAdded = savedLabels.has(seed.event_label.trim().toLowerCase());
          const status: LifetimeEventCandidate["status"] = isAdded
            ? "added"
            : !availableAssigned
              ? (availableAssigned = true, "available")
              : "locked";
          return {
            ...seed,
            id: `timeline-candidate:${seed.candidate_key}`,
            user_id: user.id,
            status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as LifetimeEventCandidate;
        });

      setCandidates(hydrated);
    } catch (error) {
      console.error("Error loading lifetime event candidates:", error);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    loadCandidates();
  }, [loadCandidates, loadEvents]);

  const createEvent = async (input: LifetimeEventInput): Promise<LifetimeEvent | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("lifetime_events")
        .insert({
          user_id: user.id,
          time_period: input.time_period,
          event_label: input.event_label,
          event_description: input.event_description || null,
          event_type: input.event_type || null,
          pattern_id: input.pattern_id || null,
          pattern_name: input.pattern_name || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newEvent = data as LifetimeEvent;
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (error) {
      console.error("Error creating lifetime event:", error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateEvent = async (id: string, updates: Partial<LifetimeEventInput>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("lifetime_events")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setEvents(prev => prev.map(e => 
        e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
      ));
      return true;
    } catch (error) {
      console.error("Error updating lifetime event:", error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteEvent = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("lifetime_events")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setEvents(prev => prev.filter(e => e.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting lifetime event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
      return false;
    }
  };

  const upsertCandidates = async (
    inputs: LifetimeEventCandidateInput[],
    sourceQuestId?: string | null,
  ): Promise<LifetimeEventCandidate[]> => {
    if (inputs.length === 0) return candidates;

    const existingKeys = new Set(candidates.map((candidate) => candidate.candidate_key));
    const hasAvailableCandidate = candidates.some((candidate) => candidate.status === "available");
    const localUserId = candidates[0]?.user_id || "local";
    const newCandidates = inputs
      .filter((input) => !existingKeys.has(input.candidate_key))
      .map((input, index) => ({
        ...input,
        id: `timeline-candidate:${input.candidate_key}`,
        user_id: localUserId,
        source_quest_id: sourceQuestId || input.source_quest_id || null,
        status: !hasAvailableCandidate && index === 0 ? "available" : "locked",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as LifetimeEventCandidate));

    const nextCandidates = [...candidates, ...newCandidates]
      .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
    setCandidates(nextCandidates);
    return nextCandidates;
  };

  const markCandidateAdded = async (candidateId: string): Promise<boolean> => {
    try {
      const nextLocked = candidates
        .filter((candidate) => candidate.status === "locked")
        .sort((a, b) => a.sort_order - b.sort_order)[0];

      setCandidates((current) => current.map((candidate) => {
        if (candidate.id === candidateId) return { ...candidate, status: "added" };
        if (nextLocked && candidate.id === nextLocked.id) return { ...candidate, status: "available" };
        return candidate;
      }));
      return true;
    } catch (error) {
      console.error("Error updating lifetime event candidate:", error);
      return false;
    }
  };

  const linkPattern = async (eventId: string, patternId: string, patternName: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("lifetime_events")
        .update({
          pattern_id: patternId,
          pattern_name: patternName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);

      if (error) throw error;

      setEvents(prev => prev.map(e => 
        e.id === eventId 
          ? { ...e, pattern_id: patternId, pattern_name: patternName, updated_at: new Date().toISOString() } 
          : e
      ));
      return true;
    } catch (error) {
      console.error("Error linking pattern:", error);
      return false;
    }
  };

  const syncGoldOutcome = async (patternId: string, goldOutcome: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("lifetime_events")
        .update({
          gold_outcome: goldOutcome,
          is_transmuted: true,
          updated_at: new Date().toISOString(),
        })
        .eq("pattern_id", patternId);

      if (error) throw error;

      setEvents(prev => prev.map(e => 
        e.pattern_id === patternId 
          ? { ...e, gold_outcome: goldOutcome, is_transmuted: true, updated_at: new Date().toISOString() } 
          : e
      ));
      return true;
    } catch (error) {
      console.error("Error syncing gold outcome:", error);
      return false;
    }
  };

  const getEventsByPeriod = useCallback((): Record<TimePeriod, LifetimeEvent[]> => {
    const grouped: Record<TimePeriod, LifetimeEvent[]> = {
      childhood: [],
      teen: [],
      early_20s: [],
      mid_20s: [],
      late_20s: [],
      '30s': [],
      current: [],
    };

    events.forEach(event => {
      if (grouped[event.time_period]) {
        grouped[event.time_period].push(event);
      }
    });

    return grouped;
  }, [events]);

  const getEventsForPattern = useCallback((patternId: string): LifetimeEvent[] => {
    return events.filter(e => e.pattern_id === patternId);
  }, [events]);

  // Helper to create a lifetime event from a pattern
  const createEventFromPattern = async (
    patternId: string,
    patternName: string,
    timePeriod: TimePeriod = 'current'
  ): Promise<LifetimeEvent | null> => {
    return createEvent({
      time_period: timePeriod,
      event_label: patternName,
      pattern_id: patternId,
      pattern_name: patternName,
    });
  };

  return {
    events,
    candidates,
    loading,
    createEvent,
    createEventFromPattern,
    updateEvent,
    deleteEvent,
    upsertCandidates,
    markCandidateAdded,
    linkPattern,
    syncGoldOutcome,
    getEventsByPeriod,
    getEventsForPattern,
    reload: loadEvents,
  };
}
