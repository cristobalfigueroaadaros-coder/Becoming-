import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface TransmutationData {
  shadow?: string;
  dark_night?: string;
  shift_moment?: string;
  protective_purpose?: string;
  lesson_learned?: string;
  gold_insight?: string;
  letter_to_self?: string;
  brave_step?: string;
  phase_completed?: 'black' | 'white' | 'gold';
  completed_at?: string;
}

export interface InnerPattern {
  id: string;
  user_id: string;
  pattern_name: string;
  pattern_description: string | null;
  pattern_type: string;
  source_council_meeting_id: string | null;
  source_mentor: string | null;
  trigger_context: string | null;
  primary_emotion: string | null;
  related_emotions: string[] | null;
  body_sensation: string | null;
  earliest_memory_age: number | null;
  life_events: Json;
  transmutation_data?: TransmutationData;
  status: string;
  gold_shift_text: string | null;
  transformed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatternInput {
  pattern_name: string;
  pattern_description?: string;
  pattern_type?: string;
  source_council_meeting_id?: string;
  source_mentor?: string;
  trigger_context?: string;
  primary_emotion?: string;
  related_emotions?: string[];
  body_sensation?: string;
}

export function useInnerPatterns() {
  const [patterns, setPatterns] = useState<InnerPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatterns = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPatterns([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("inner_patterns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setPatterns((data || []) as InnerPattern[]);
      setError(null);
    } catch (err: any) {
      console.error("Error loading inner patterns:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatterns();
  }, [loadPatterns]);

  const createPattern = async (input: PatternInput): Promise<InnerPattern | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to save patterns");
        return null;
      }

      const { data, error: insertError } = await supabase
        .from("inner_patterns")
        .insert({
          user_id: user.id,
          pattern_name: input.pattern_name,
          pattern_description: input.pattern_description || null,
          pattern_type: input.pattern_type || "limiting_belief",
          source_council_meeting_id: input.source_council_meeting_id || null,
          source_mentor: input.source_mentor || null,
          trigger_context: input.trigger_context || null,
          primary_emotion: input.primary_emotion || null,
          related_emotions: input.related_emotions || null,
          body_sensation: input.body_sensation || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newPattern = data as InnerPattern;
      setPatterns(prev => [newPattern, ...prev]);
      toast.success("Pattern saved to Inner Work Lab");
      return newPattern;
    } catch (err: any) {
      console.error("Error creating pattern:", err);
      toast.error("Failed to save pattern");
      return null;
    }
  };

  const updatePatternStatus = async (id: string, status: string, goldShiftText?: string) => {
    try {
      const updateData: any = { status };
      if (status === "transformed" && goldShiftText) {
        updateData.gold_shift_text = goldShiftText;
        updateData.transformed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("inner_patterns")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      setPatterns(prev => 
        prev.map(p => p.id === id ? { ...p, ...updateData } : p)
      );
      return true;
    } catch (err: any) {
      console.error("Error updating pattern:", err);
      toast.error("Failed to update pattern");
      return false;
    }
  };

  const updatePattern = async (id: string, updates: Partial<Omit<InnerPattern, 'transmutation_data'>> & { transmutation_data?: TransmutationData }) => {
    try {
      // Cast for Supabase - transmutation_data needs to be Json
      const dbUpdates = updates as Record<string, unknown>;
      
      const { error: updateError } = await supabase
        .from("inner_patterns")
        .update(dbUpdates)
        .eq("id", id);

      if (updateError) throw updateError;

      setPatterns(prev => 
        prev.map(p => p.id === id ? { ...p, ...updates } : p)
      );
      return true;
    } catch (err: any) {
      console.error("Error updating pattern:", err);
      toast.error("Failed to update pattern");
      return false;
    }
  };

  const updatePatternNodes = async (id: string, nodes: Record<string, string | undefined>) => {
    try {
      const { error: updateError } = await supabase
        .from("inner_patterns")
        .update({ life_events: nodes })
        .eq("id", id);

      if (updateError) throw updateError;

      setPatterns(prev => 
        prev.map(p => p.id === id ? { ...p, life_events: nodes } : p)
      );
      return true;
    } catch (err: any) {
      console.error("Error updating pattern nodes:", err);
      toast.error("Failed to update pattern map");
      return false;
    }
  };

  const deletePattern = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("inner_patterns")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setPatterns(prev => prev.filter(p => p.id !== id));
      toast.success("Pattern removed");
      return true;
    } catch (err: any) {
      console.error("Error deleting pattern:", err);
      toast.error("Failed to remove pattern");
      return false;
    }
  };

  const updateTransmutationData = async (id: string, data: TransmutationData) => {
    try {
      const pattern = patterns.find(p => p.id === id);
      if (!pattern) return false;

      // Check if gold phase is complete
      const isGoldComplete = !!(data.gold_insight && data.letter_to_self);
      
      const updatePayload: Record<string, any> = {
        transmutation_data: data as unknown as Json,
      };

      // If gold phase complete, also update pattern status
      if (isGoldComplete && data.phase_completed === 'gold') {
        updatePayload.gold_shift_text = data.gold_insight;
        updatePayload.status = 'transformed';
        updatePayload.transformed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("inner_patterns")
        .update(updatePayload)
        .eq("id", id);

      if (updateError) throw updateError;

      setPatterns(prev => 
        prev.map(p => p.id === id ? { 
          ...p, 
          transmutation_data: data,
          ...(isGoldComplete && data.phase_completed === 'gold' ? {
            gold_shift_text: data.gold_insight,
            status: 'transformed',
            transformed_at: new Date().toISOString(),
          } : {})
        } : p)
      );
      return true;
    } catch (err: any) {
      console.error("Error updating transmutation data:", err);
      toast.error("Failed to update transmutation map");
      return false;
    }
  };

  // Helper to get transmutation phase status
  const getTransmutationStatus = (data: TransmutationData | undefined) => {
    if (!data) return { black: false, white: false, gold: false };
    return {
      black: !!data.shadow,
      white: !!(data.shift_moment && data.protective_purpose && data.lesson_learned),
      gold: !!(data.gold_insight && data.letter_to_self),
    };
  };

  // Get patterns by status
  const getExploringPatterns = () => patterns.filter(p => p.status === "exploring");
  const getTransformedPatterns = () => patterns.filter(p => p.status === "transformed");
  const getInTransmutationPatterns = () => patterns.filter(p => {
    const transData = p.transmutation_data;
    if (!transData) return false;
    const status = getTransmutationStatus(transData);
    return (status.black || status.white) && !status.gold;
  });

  return {
    patterns,
    loading,
    error,
    loadPatterns,
    createPattern,
    updatePatternStatus,
    updatePattern,
    updatePatternNodes,
    updateTransmutationData,
    deletePattern,
    getExploringPatterns,
    getTransformedPatterns,
    getInTransmutationPatterns,
    getTransmutationStatus,
  };
}
