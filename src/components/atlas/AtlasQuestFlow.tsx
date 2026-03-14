import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AtlasQuestInteraction } from "./AtlasQuestInteraction";
import { AtlasWinningCard } from "./AtlasWinningCard";
import type { AtlasQuestDefinition, DotInterpretation } from "@/data/atlasQuests";

interface Props {
  quest: AtlasQuestDefinition;
  clusterId: string;
}

export const AtlasQuestFlow = ({ quest, clusterId }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0); // 0-3 = interactions, 4 = winning card
  const [responses, setResponses] = useState<any[]>([]);
  const [dotResult, setDotResult] = useState<DotInterpretation | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleInteractionSubmit = (response: any) => {
    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (step < 3) {
      setStep(step + 1);
    } else {
      // Step 4 complete — interpret and show winning card
      const result = quest.interpret(newResponses);
      setDotResult(result);
      setStep(4);
    }
  };

  const handleConfirm = async () => {
    if (!dotResult) return;
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert dot
      const { data: dot, error: dotErr } = await supabase
        .from("atlas_dots")
        .insert({
          user_id: user.id,
          cluster_id: clusterId,
          title: dotResult.title,
          short_description: dotResult.description,
          dot_type: "quest_discovery",
          confidence_score: 0.8,
        })
        .select("id")
        .single();
      if (dotErr) throw dotErr;

      // Insert quest record
      const { error: questErr } = await supabase
        .from("atlas_quests")
        .insert({
          user_id: user.id,
          cluster_id: clusterId,
          quest_key: quest.questKey,
          interactions: responses as any,
          status: "completed",
          generated_dot_id: dot.id,
          completed_at: new Date().toISOString(),
        });
      if (questErr) throw questErr;

      queryClient.invalidateQueries({ queryKey: ["atlas-dots"] });
      queryClient.invalidateQueries({ queryKey: ["atlas-quests-completed"] });

      toast({ title: "Discovery added to Atlas!", description: dotResult.title });
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
      {/* Header */}
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

      {/* Content */}
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
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};
