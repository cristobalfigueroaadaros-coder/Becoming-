import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOpportunityDetection(totalDots: number) {
  return useQuery({
    queryKey: ["atlas-opportunity"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.functions.invoke("detect-opportunity", {
        body: { userId: user.id },
      });

      if (error) throw error;
      return data?.opportunity || null;
    },
    enabled: totalDots >= 10,
    staleTime: 1000 * 60 * 30, // 30 min cache
    retry: false,
  });
}
