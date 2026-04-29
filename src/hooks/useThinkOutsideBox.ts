import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProjectContext {
  name: string;
  description?: string;
  phase?: string;
}

interface OpportunityIdea {
  type: "obvious" | "interesting" | "out_of_the_box";
  text: string;
}

export interface ThinkOutsideBoxResult {
  setup: string;
  question: string;
  ideas: OpportunityIdea[];
  mentor_stage: string;
  mentor_type: string;
}

export function useThinkOutsideBox() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThinkOutsideBoxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async (projectContext: ProjectContext) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("detect-opportunity", {
        body: { projectContext },
      });
      if (fnError) throw fnError;
      if (data?.opportunity) {
        setResult(data.opportunity);
      } else {
        setError("Not enough Atlas data yet. Keep exploring to unlock richer insights.");
      }
    } catch (_e) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { generate, loading, result, error, reset };
}
