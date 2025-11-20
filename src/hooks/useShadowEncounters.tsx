import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ShadowEncounter {
  id: string;
  shadow_name: string;
  shadow_statement: string;
  reflection_prompts: any; // JSONB from database
  task_description: string;
  mentor_type?: string;
  status: string;
  xp_reward: number;
  created_at: string;
}

export const useShadowEncounters = () => {
  const [activeEncounter, setActiveEncounter] = useState<ShadowEncounter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveEncounter();
    
    // Realtime subscription
    const channel = supabase
      .channel("shadow_encounters_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shadow_encounters",
        },
        () => {
          fetchActiveEncounter();
        }
      )
      .subscribe();

    // Fallback polling every 10 seconds
    const pollingInterval = setInterval(() => {
      fetchActiveEncounter();
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
    };
  }, []);

  const fetchActiveEncounter = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("shadow_encounters")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching shadow encounter:", error);
        return;
      }

      setActiveEncounter(data || null);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return { activeEncounter, loading, refetch: fetchActiveEncounter };
};
