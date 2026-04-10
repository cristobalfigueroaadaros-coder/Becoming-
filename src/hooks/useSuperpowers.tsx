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
  category: string;
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

      const newSuperpowers: Superpower[] = data?.superpowers || [];
      setSuperpowers(prev => [...newSuperpowers, ...prev]);

      // Write each superpower as an Atlas dot so it appears in the user's identity map
      if (newSuperpowers.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const atlasDots = newSuperpowers.map(sp => ({
            user_id: user.id,
            title: sp.name,
            short_description: sp.description,
            dot_category: "strength",
            source_system: "transmutation",
            origin: `transmutation:${patternId}`,
            signal_strength: 85,
            confidence_score: 0.85,
            is_gold_moment: true,
            signal_tags: [sp.category, "superpower", patternName].filter(Boolean),
            signal_sources: { superpower_id: sp.id, pattern_name: patternName, category: sp.category },
          }));

          const { error: dotError } = await supabase.from("atlas_dots").insert(atlasDots);
          if (dotError) console.error("Failed to write superpowers to Atlas:", dotError);
        }
      }

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
