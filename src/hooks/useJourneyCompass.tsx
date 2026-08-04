import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CompassSurface =
  | "atlas_quest"
  | "mentor"
  | "design_thinking"
  | "project_block"
  | "transmutation"
  | "becoming"
  | "creators";

export interface CompassSuggestion {
  surface: CompassSurface;
  targetId: string;
  title: string;
  why: string;
  evidence?: string[];
  leverageInsight?: string;
  ctaLabel: string;
  handoffContext?: string;
}

export interface CompassGuidance {
  stateSummary: string;
  primarySuggestion: CompassSuggestion;
  alternativeSuggestions: CompassSuggestion[];
}

export const useJourneyCompass = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [guidance, setGuidance] = useState<CompassGuidance | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGuidance = useCallback(
    async (opts: { userInput?: string } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnError } = await supabase.functions.invoke("journey-compass", {
          body: {
            userInput: opts.userInput,
            mode: opts.userInput ? "ask" : "proactive",
          },
        });
        if (fnError) throw fnError;
        if (!data?.success) throw new Error(data?.error || "Compass unavailable");
        const next: CompassGuidance = {
          stateSummary: data.stateSummary,
          primarySuggestion: data.primarySuggestion,
          alternativeSuggestions: data.alternativeSuggestions || [],
        };
        setGuidance(next);
        return next;
      } catch (err: any) {
        const msg = err?.message || "Could not load guidance";
        console.error("[useJourneyCompass]", err);
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const executeSuggestion = useCallback(
    async (s: CompassSuggestion) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to continue");
        navigate("/auth");
        return;
      }

      switch (s.surface) {
        case "atlas_quest":
          // Atlas page reads ?cluster= to deep-link into a cluster
          navigate(`/atlas?cluster=${encodeURIComponent(s.targetId)}`);
          break;

        case "mentor": {
          // Create handoff with compass context, mirror useVoiceOfSystem flow
          try {
            const { data: handoff, error: hErr } = await supabase
              .from("conversation_handoffs")
              .insert({
                user_id: user.id,
                source_mentor_type: "journey_compass",
                target_mentor_type: s.targetId,
                source_messages: [],
                voice_context: {
                  source: "journey_compass",
                  why: s.why,
                  handoffContext: s.handoffContext,
                  title: s.title,
                },
                initiated_by: "journey_compass",
              })
              .select()
              .single();
            if (hErr) throw hErr;
            navigate(`/chat/${s.targetId}`, {
              state: {
                voiceHandoffId: handoff?.id,
                voiceContext: s.handoffContext,
              },
            });
          } catch (err) {
            console.error("[compass mentor handoff]", err);
            // Fallback: navigate without handoff
            navigate(`/chat/${s.targetId}`);
          }
          break;
        }

        case "design_thinking":
          navigate(`/creation-lab?dtPhase=${encodeURIComponent(s.targetId)}`);
          break;

        case "project_block":
          navigate(`/creation-lab`);
          break;

        case "transmutation":
          navigate(`/creation-lab?bmode=transmutation`);
          break;

        case "becoming":
          navigate(`/creation-lab?bmode=becoming`);
          break;

        case "creators":
          navigate(`/creators`);
          break;

        default:
          navigate(`/`);
      }
    },
    [navigate]
  );

  const reset = useCallback(() => {
    setGuidance(null);
    setError(null);
    setLoading(false);
  }, []);

  return { fetchGuidance, executeSuggestion, guidance, loading, error, reset };
};
