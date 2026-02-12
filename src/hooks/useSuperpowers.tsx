import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Superpower {
  id: string;
  user_id: string;
  pattern_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  created_at: string;
}

export function useSuperpowers() {
  const [superpowers, setSuperpowers] = useState<Superpower[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSuperpowers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSuperpowers([]); return; }

      const { data, error } = await supabase
        .from("superpowers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSuperpowers((data || []) as Superpower[]);
    } catch (err: any) {
      console.error("Error loading superpowers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSuperpowers(); }, [loadSuperpowers]);

  const extractSuperpowers = async (
    patternId: string,
    patternName: string,
    transmutationData: Record<string, any>,
    primaryEmotion?: string
  ): Promise<Superpower[]> => {
    try {
      const { data, error } = await supabase.functions.invoke("extract-superpowers", {
        body: { patternId, patternName, transmutationData, primaryEmotion },
      });

      if (error) throw error;

      const newSuperpowers = data?.superpowers || [];
      setSuperpowers(prev => [...newSuperpowers, ...prev]);
      return newSuperpowers;
    } catch (err: any) {
      console.error("Error extracting superpowers:", err);
      toast.error("Could not extract superpowers");
      return [];
    }
  };

  const getSuperpowersByPattern = (patternId: string) =>
    superpowers.filter(sp => sp.pattern_id === patternId);

  return {
    superpowers,
    loading,
    loadSuperpowers,
    extractSuperpowers,
    getSuperpowersByPattern,
  };
}
