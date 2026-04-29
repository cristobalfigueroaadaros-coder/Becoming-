import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

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
    loading,
    createEvent,
    createEventFromPattern,
    updateEvent,
    deleteEvent,
    linkPattern,
    syncGoldOutcome,
    getEventsByPeriod,
    getEventsForPattern,
    reload: loadEvents,
  };
}
