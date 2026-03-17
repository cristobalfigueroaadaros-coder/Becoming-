import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AtlasQuestInteraction } from "./AtlasQuestInteraction";
import { AtlasWinningCard } from "./AtlasWinningCard";
import { interpretQuestResult, type ExtractedSignal, type DetectedPattern } from "@/lib/atlasSignalEngine";
import { useAtlasQuests } from "@/hooks/useAtlasQuests";
import { useAtlas } from "@/hooks/useAtlas";
import type { AtlasQuestDefinition, DotInterpretation } from "@/data/atlasQuests";

const GROWTH_MESSAGES: Record<string, string> = {
  activated: "This area of your identity is awakening.",
  growing: "This cluster is growing — patterns are forming.",
  resonant: "Deep resonance detected — this area is becoming central to who you are.",
  mature: "This cluster has reached maturity — a core part of your identity map.",
};

interface Props {
  quest: AtlasQuestDefinition;
  clusterId: string;
}

export const AtlasQuestFlow = ({ quest, clusterId }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { aggregatedSignals, detectedPatternKeys } = useAtlasQuests();
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [dotResult, setDotResult] = useState<DotInterpretation | null>(null);
  const [isPatternBased, setIsPatternBased] = useState(false);
  const [isReinforced, setIsReinforced] = useState(false);
  const [newSignals, setNewSignals] = useState<ExtractedSignal[]>([]);
  const [detectedPattern, setDetectedPattern] = useState<DetectedPattern | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleInteractionSubmit = (response: any) => {
    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (step < 3) {
      setStep(step + 1);
    } else {
      // All 4 interactions complete — run signal detection
      const result = interpretQuestResult(
        quest.questKey,
        newResponses,
        aggregatedSignals,
        detectedPatternKeys,
        quest.interpret
      );
      setDotResult(result.dot);
      setIsPatternBased(result.isPatternBased);
      setNewSignals(result.newSignals);
      setDetectedPattern(result.detectedPattern);
      setStep(4);
    }
  };

  const handleConfirm = async () => {
    if (!dotResult) return;
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Determine cluster for the dot
      let dotClusterId = clusterId;
      if (isPatternBased && detectedPattern) {
        const { data: patternCluster } = await supabase
          .from("atlas_clusters")
          .select("id")
          .eq("slug", detectedPattern.pattern.clusterSlug)
          .single();
        if (patternCluster) dotClusterId = patternCluster.id;
      }

      const dotCategory = dotResult.dotCategory || "strength";
      const signalSourceNames = newSignals.map(s => s.signalName);
      const totalStrength = newSignals.reduce((sum, s) => sum + s.strength, 0);

      // Duplicate detection: check for existing dot with same title
      const { data: existingDots } = await supabase
        .from("atlas_dots")
        .select("id, confidence_score, signal_strength")
        .eq("user_id", user.id)
        .eq("title", dotResult.title)
        .limit(1);

      let dotId: string;

      if (existingDots && existingDots.length > 0) {
        // Reinforce existing dot
        const existing = existingDots[0];
        const newConfidence = Math.min(1, (existing.confidence_score || 0.8) + 0.1);
        const newStrength = (existing.signal_strength || 0) + totalStrength;
        await supabase
          .from("atlas_dots")
          .update({
            confidence_score: newConfidence,
            signal_strength: newStrength,
          })
          .eq("id", existing.id);
        dotId = existing.id;
        setIsReinforced(true);
      } else {
        // Insert new dot
        const { data: dot, error: dotErr } = await supabase
          .from("atlas_dots")
          .insert({
            user_id: user.id,
            cluster_id: dotClusterId,
            title: dotResult.title,
            short_description: dotResult.description,
            dot_type: isPatternBased ? "pattern_discovery" : "quest_discovery",
            dot_category: dotCategory,
            signal_sources: signalSourceNames,
            signal_strength: totalStrength,
            source_system: "quest_system",
            confidence_score: isPatternBased ? 0.9 : 0.8,
          })
          .select("id")
          .single();
        if (dotErr) throw dotErr;
        dotId = dot.id;
      }

      // Insert quest record
      const { error: questErr } = await supabase
        .from("atlas_quests")
        .insert({
          user_id: user.id,
          cluster_id: clusterId,
          quest_key: quest.questKey,
          interactions: responses as any,
          status: "completed",
          generated_dot_id: dotId,
          completed_at: new Date().toISOString(),
        });
      if (questErr) throw questErr;

      // Insert signals
      if (newSignals.length > 0) {
        const signalRows = newSignals.map(s => ({
          user_id: user.id,
          signal_name: s.signalName,
          signal_category: s.signalCategory,
          strength: s.strength,
          source_quest_key: s.sourceQuestKey,
          source_interaction_index: s.sourceInteractionIndex,
          cluster_id: clusterId,
        }));
        await supabase.from("atlas_signals").insert(signalRows);
      }

      // Insert pattern if detected
      if (isPatternBased && detectedPattern) {
        await supabase.from("atlas_patterns").insert({
          user_id: user.id,
          pattern_key: detectedPattern.pattern.patternKey,
          pattern_title: detectedPattern.pattern.title,
          pattern_description: detectedPattern.pattern.description,
          signal_names: detectedPattern.pattern.requiredSignals.map(s => s.signalName),
          total_strength: detectedPattern.totalStrength,
          cluster_slug: detectedPattern.pattern.clusterSlug,
          generated_dot_id: dotId,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["atlas-dots"] });
      queryClient.invalidateQueries({ queryKey: ["atlas-quests-completed"] });
      queryClient.invalidateQueries({ queryKey: ["atlas-signals"] });
      queryClient.invalidateQueries({ queryKey: ["atlas-patterns"] });

      toast({ title: isReinforced ? "Discovery reinforced!" : "Discovery added to Atlas!", description: dotResult.title });
      navigate("/atlas");
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error saving discovery", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const progress = Math.min(step + 1, 4);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 pt-5 pb-3 flex items-center gap-3">
        <button onClick={() => navigate("/atlas")} className="text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{quest.clusterName}</p>
          <div className="flex gap-1 mt-1.5">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-colors"
                style={{ backgroundColor: i < progress ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <AnimatePresence mode="wait">
          {step < 4 ? (
            <AtlasQuestInteraction
              key={step}
              interaction={quest.interactions[step]}
              onSubmit={handleInteractionSubmit}
            />
          ) : dotResult ? (
            <AtlasWinningCard
              key="winning"
              dot={dotResult}
              clusterName={quest.clusterName}
              onConfirm={handleConfirm}
              isLoading={isSaving}
              isPatternBased={isPatternBased}
              isReinforced={isReinforced}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};
