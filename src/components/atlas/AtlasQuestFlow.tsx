import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AtlasQuestInteraction } from "./AtlasQuestInteraction";
import { AtlasWinningCard, type ValidationMode } from "./AtlasWinningCard";
import { GoldMomentCard } from "./GoldMomentCard";
import { ConnectionMomentCard } from "./ConnectionMomentCard";
import { interpretQuestResult, type ExtractedSignal, type DetectedPattern } from "@/lib/atlasSignalEngine";
import { detectConnections, findGoldMoments } from "@/lib/atlasConnectionEngine";
import { useAtlasQuests } from "@/hooks/useAtlasQuests";
import { useAtlas } from "@/hooks/useAtlas";
import type { AtlasQuestDefinition, DotInterpretation } from "@/data/atlasQuests";
import type { DotCategory } from "@/data/atlasSignals";

const GROWTH_MESSAGES: Record<string, string> = {
  activated: "This area of your identity is awakening.",
  growing: "This cluster is growing — patterns are forming.",
  resonant: "Deep resonance detected — this area is becoming central to who you are.",
  mature: "This cluster has reached maturity — a core part of your identity map.",
};

function getGrowthLevelName(dotCount: number): string {
  if (dotCount === 0) return "dormant";
  if (dotCount === 1) return "activated";
  if (dotCount <= 4) return "growing";
  if (dotCount <= 8) return "resonant";
  return "mature";
}

interface Props {
  quest: AtlasQuestDefinition;
  clusterId: string;
  onboardingIndex?: number;
}

export const AtlasQuestFlow = ({ quest, clusterId, onboardingIndex }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { aggregatedSignals, detectedPatternKeys, completedCount, isOnboarding, entryState, shouldShowConnectionMoment, isIdentityMoment } = useAtlasQuests();
  const { clusters, dots: allExistingDots } = useAtlas();
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [dotResult, setDotResult] = useState<DotInterpretation | null>(null);
  const [mirrorFeedback, setMirrorFeedback] = useState<string | undefined>();
  const [isPatternBased, setIsPatternBased] = useState(false);
  const [isReinforced, setIsReinforced] = useState(false);
  const [newSignals, setNewSignals] = useState<ExtractedSignal[]>([]);
  const [detectedPattern, setDetectedPattern] = useState<DetectedPattern | null>(null);
  // suggestedClusterSlug removed — dots always stay in their quest cluster
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationMode, setValidationMode] = useState<ValidationMode>("picking");
  const [variations, setVariations] = useState<DotInterpretation[]>([]);
  const [aiSignalTags, setAiSignalTags] = useState<any>(null);
  const [growthReflection, setGrowthReflection] = useState<string | null>(null);
  const [showGrowthReflection, setShowGrowthReflection] = useState(false);
  const [goldMoment, setGoldMoment] = useState<{ frustrationTitle: string; strengthTitle: string; superpowerName: string; transformationDescription: string } | null>(null);

  // Adaptive follow-up state
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [isCheckingDepth, setIsCheckingDepth] = useState(false);
  const [followUpDone, setFollowUpDone] = useState(false);

  // Connection moment state
  const [showConnectionMoment, setShowConnectionMoment] = useState(false);
  const [dotSaved, setDotSaved] = useState(false);

  // Council unlock celebration
  const [showCouncilUnlocked, setShowCouncilUnlocked] = useState(false);

  // Fuzzy duplicate check: compare first 3 words of title
  const findFuzzyDuplicate = (title: string, clusterDotsInSame: any[]) => {
    const titleWords = title.toLowerCase().split(/\s+/).slice(0, 3).join(" ");
    return clusterDotsInSame.find(d => {
      const existingWords = (d.title || "").toLowerCase().split(/\s+/).slice(0, 3).join(" ");
      return existingWords === titleWords && existingWords.length > 3;
    });
  };

  const generateAIDot = async (
    allResponses: any[],
    patternTitle?: string
  ): Promise<{
    variations: DotInterpretation[];
    mirrorFeedback?: string;
    suggestedClusterSlug?: string;
    emotionalTone?: string;
    dotSubType?: string;
  } | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-atlas-dot", {
        body: { mode: "generate", responses: allResponses, clusterName: quest.clusterName, patternTitle: patternTitle || null },
      });
      if (error) throw error;
      if (data?.variations?.length > 0) return data;
      // Fallback: if old format returns single dot
      if (data?.title && data?.description && data?.dotCategory) {
        return { variations: [{ title: data.title, description: data.description, dotCategory: data.dotCategory }], mirrorFeedback: data.mirrorFeedback, suggestedClusterSlug: data.suggestedClusterSlug };
      }
      return null;
    } catch (err) {
      console.error("AI dot generation failed:", err);
      return null;
    }
  };

  const handleRegenerate = async (feedback?: string) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-atlas-dot", {
        body: { mode: "regenerate", responses, clusterName: quest.clusterName, feedbackText: feedback || "" },
      });
      if (error) throw error;
      if (data?.variations?.length > 0) {
        setVariations(data.variations);
        setMirrorFeedback(data.mirrorFeedback || mirrorFeedback);
        setValidationMode("picking");
      } else {
        toast({ title: "Couldn't generate alternatives", description: "Try editing manually instead." });
        setValidationMode("picking");
      }
    } catch {
      toast({ title: "Generation failed", description: "Try editing manually.", variant: "destructive" });
      setValidationMode("picking");
    } finally {
      setIsGenerating(false);
    }
  };

  // Growth reflection (non-onboarding only) — moved to useEffect to prevent render loops
  const [growthReflectionDismissed, setGrowthReflectionDismissed] = useState(false);

  useState(() => {
    // One-time check on mount
    if (!isOnboarding && completedCount > 0 && completedCount % 8 === 0 && !growthReflectionDismissed && step === 0 && !growthReflection) {
      setShowGrowthReflection(true);
      const recentDots = allExistingDots.slice(0, 6);
      supabase.functions.invoke("generate-atlas-dot", {
        body: { mode: "growth_reflection", recentDots: recentDots.map(d => ({ title: d.title })) },
      }).then(({ data }) => {
        if (data?.reflection) setGrowthReflection(data.reflection);
        else setShowGrowthReflection(false);
      }).catch(() => setShowGrowthReflection(false));
    }
  });

  const processAfterAllInteractions = async (allResponses: any[]) => {
    setIsGenerating(true);
    setStep(5); // generating state

    const result = interpretQuestResult(quest.questKey, allResponses, aggregatedSignals, detectedPatternKeys, quest.interpret);
    setNewSignals(result.newSignals);
    setDetectedPattern(result.detectedPattern);
    setIsPatternBased(result.isPatternBased);

    const aiResult = await generateAIDot(allResponses, result.isPatternBased ? result.detectedPattern?.pattern.title : undefined);

    if (aiResult && aiResult.variations.length > 0) {
      // Cluster override removed — dots stay in quest cluster
      setVariations(aiResult.variations);
      setDotResult(aiResult.variations[0]); // first as fallback
      setMirrorFeedback(aiResult.mirrorFeedback);
      // Store signal tags from the first variation for saving
      const firstVar = aiResult.variations[0] as any;
      if (firstVar?.signalType || firstVar?.actionType) {
        setAiSignalTags({
          signalType: firstVar.signalType,
          actionType: firstVar.actionType,
          emotionalTone: (aiResult as any).emotionalTone,
          dotSubType: (aiResult as any).dotSubType,
        });
      }
    } else {
      setDotResult(result.dot);
      setVariations([]);
    }

    setValidationMode("picking");
    setIsGenerating(false);
  };

  const handleInteractionSubmit = async (response: any) => {
    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (step < 3) {
      setStep(step + 1);
    } else if (step === 3 && !followUpDone) {
      // Step 4 (interaction 4) completed — check depth for onboarding
      if (isOnboarding && typeof response === "string" && response.length > 0) {
        setIsCheckingDepth(true);
        setStep(4); // show loading
        try {
          const { data } = await supabase.functions.invoke("generate-atlas-dot", {
            body: { mode: "check_depth", responses: newResponses, clusterName: quest.clusterName },
          });
          if (data?.isShallow && data?.followUpQuestion) {
            setFollowUpQuestion(data.followUpQuestion);
            setIsCheckingDepth(false);
            return; // Show follow-up, don't process yet
          }
        } catch {
          // On error, skip depth check
        }
        setIsCheckingDepth(false);
      }
      setFollowUpDone(true);
      await processAfterAllInteractions(newResponses);
    } else {
      // Follow-up answer submitted (step === 4 with followUpQuestion)
      setFollowUpDone(true);
      setFollowUpQuestion(null);
      await processAfterAllInteractions(newResponses);
    }
  };

  const handleConfirm = async (editedDot?: DotInterpretation, extras?: DotInterpretation[], userEdited?: boolean) => {
    const finalDot = editedDot || dotResult;
    if (!finalDot) return;
    setIsSaving(true);

    // Store non-selected variations as secondary signal data
    const selectedTitle = finalDot.title;
    const nonSelectedVariations = variations.filter(v => v.title !== selectedTitle);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const selectedVar = variations.find(v => v.title === selectedTitle) as any;

      // Dots always stay in their quest cluster — no cross-cluster reassignment
      const dotClusterId = clusterId;

      const dotCategory = finalDot.dotCategory || "strength";
      const signalSourceNames = newSignals.map(s => s.signalName);
      const totalStrength = newSignals.reduce((sum, s) => sum + s.strength, 0);

      // Build signal tags from the selected variation
      const signalTags: any = {};
      if (selectedVar?.signalType) signalTags.signalType = selectedVar.signalType;
      if (selectedVar?.actionType) signalTags.actionType = selectedVar.actionType;
      if (aiSignalTags?.emotionalTone) signalTags.emotionalTone = aiSignalTags.emotionalTone;
      if (aiSignalTags?.dotSubType) signalTags.dotSubType = aiSignalTags.dotSubType;

      // Duplicate detection — exact title match OR fuzzy match (first 3 words)
      const { data: existingDots } = await supabase.from("atlas_dots").select("id, title, confidence_score, signal_strength").eq("user_id", user.id).eq("cluster_id", dotClusterId);
      let dotId: string;
      let reinforced = false;

      const exactMatch = (existingDots || []).find(d => d.title === finalDot.title);
      const fuzzyMatch = !exactMatch ? findFuzzyDuplicate(finalDot.title, existingDots || []) : null;
      const matchedDot = exactMatch || fuzzyMatch;

      if (matchedDot) {
        await supabase.from("atlas_dots").update({
          confidence_score: Math.min(1, (matchedDot.confidence_score || 0.8) + 0.1),
          signal_strength: (matchedDot.signal_strength || 0) + totalStrength,
          user_validated: true, user_edited: userEdited || false,
          signal_tags: signalTags,
        } as any).eq("id", matchedDot.id);
        dotId = matchedDot.id;
        reinforced = true;
        setIsReinforced(true);
      } else {
        const { data: dot, error: dotErr } = await supabase.from("atlas_dots").insert({
          user_id: user.id, cluster_id: dotClusterId, title: finalDot.title,
          short_description: finalDot.description, dot_type: isPatternBased ? "pattern_discovery" : "quest_discovery",
          dot_category: dotCategory, signal_sources: signalSourceNames,
          signal_strength: totalStrength, source_system: "quest_system",
          confidence_score: isPatternBased ? 0.9 : 0.8, user_validated: true, user_edited: userEdited || false,
          signal_tags: signalTags,
          original_title: finalDot.title,
          original_description: finalDot.description,
        } as any).select("id").single();
        if (dotErr) throw dotErr;
        dotId = dot.id;
      }

      // Insert quest record with non-selected variations stored
      await supabase.from("atlas_quests").insert({
        user_id: user.id, cluster_id: clusterId, quest_key: quest.questKey,
        interactions: { responses, nonSelectedVariations } as any, status: "completed", generated_dot_id: dotId,
        completed_at: new Date().toISOString(),
        is_onboarding: isOnboarding, onboarding_sequence: onboardingIndex ?? null,
      } as any);

      // Save extra selected dots (user picked more than one variation)
      if (extras && extras.length > 0) {
        for (const extra of extras) {
          const { data: existingExtra } = await supabase
            .from("atlas_dots")
            .select("id")
            .eq("user_id", user.id)
            .eq("cluster_id", dotClusterId)
            .eq("title", extra.title)
            .maybeSingle();
          if (!existingExtra) {
            await supabase.from("atlas_dots").insert({
              user_id: user.id, cluster_id: dotClusterId, title: extra.title,
              short_description: extra.description,
              dot_type: isPatternBased ? "pattern_discovery" : "quest_discovery",
              dot_category: extra.dotCategory || dotCategory,
              signal_sources: signalSourceNames, signal_strength: totalStrength,
              source_system: "quest_system", confidence_score: 0.8,
              user_validated: true, original_title: extra.title, original_description: extra.description,
            } as any);
          }
        }
      }

      // Insert signals
      if (newSignals.length > 0) {
        await supabase.from("atlas_signals").insert(newSignals.map(s => ({
          user_id: user.id, signal_name: s.signalName, signal_category: s.signalCategory,
          strength: s.strength, source_quest_key: s.sourceQuestKey,
          source_interaction_index: s.sourceInteractionIndex, cluster_id: clusterId,
        })));
      }

      // Insert pattern
      if (isPatternBased && detectedPattern) {
        await supabase.from("atlas_patterns").insert({
          user_id: user.id, pattern_key: detectedPattern.pattern.patternKey,
          pattern_title: detectedPattern.pattern.title, pattern_description: detectedPattern.pattern.description,
          signal_names: detectedPattern.pattern.requiredSignals.map(s => s.signalName),
          total_strength: detectedPattern.totalStrength, cluster_slug: detectedPattern.pattern.clusterSlug,
          generated_dot_id: dotId,
        });
      }

      // Evolution check (async)
      const savedDot = { id: dotId, title: finalDot.title, short_description: finalDot.description, cluster_id: dotClusterId, dot_category: dotCategory, signal_sources: signalSourceNames, confidence_score: reinforced ? 0.9 : 0.8 };
      supabase.functions.invoke("evolve-atlas-dot", {
        body: { newDot: savedDot, allDots: [...allExistingDots, savedDot] },
      }).then(async ({ data }) => {
        if (data?.evolution) {
          const evo = data.evolution;
          // Two-layer system: preserve original_title, only update title (evolved)
          await supabase.from("atlas_dots").update({
            title: evo.newTitle,
            short_description: evo.newDescription,
            evolution_type: evo.evolutionType,
            evolution_stage: 2,
          } as any).eq("id", evo.dotId);
          await supabase.from("atlas_dot_evolutions").insert({ user_id: user.id, dot_id: evo.dotId, previous_title: evo.previousTitle, new_title: evo.newTitle, previous_description: evo.previousDescription || "", new_description: evo.newDescription, evolution_type: evo.evolutionType, trigger_reason: "auto_detection" });
          queryClient.invalidateQueries({ queryKey: ["atlas-dots"] });
          toast({ title: "A discovery is evolving...", description: `"${evo.previousTitle}" → "${evo.newTitle}"` });
        }
      }).catch(() => {});

      // Connection detection
      const clusterSlugMap: Record<string, string> = {};
      clusters.forEach(c => { clusterSlugMap[c.id] = c.slug; });
      const updatedDots = [...allExistingDots, { ...savedDot, user_id: user.id } as any];
      const { data: existingConns } = await supabase.from("atlas_connections").select("dot_id_a, dot_id_b").eq("user_id", user.id);
      const existingPairs = new Set((existingConns || []).map((c: any) => [c.dot_id_a, c.dot_id_b].sort().join(":")));
      const newConnections = detectConnections(updatedDots, existingPairs, clusterSlugMap);

      if (newConnections.length > 0) {
        await supabase.from("atlas_connections").insert(newConnections.map(c => ({
          user_id: user.id, dot_id_a: c.dotIdA, dot_id_b: c.dotIdB,
          connection_type: c.connectionType, shared_signals: c.sharedSignals,
          strength: c.strength, is_gold_moment: c.isGoldMoment,
        })));

        const goldMoments = findGoldMoments(newConnections);
        if (goldMoments.length > 0) {
          const gm = goldMoments[0];
          const dotA = updatedDots.find(d => d.id === gm.dotIdA);
          const dotB = updatedDots.find(d => d.id === gm.dotIdB);
          if (dotA && dotB) {
            try {
              const { data: gmData } = await supabase.functions.invoke("generate-atlas-dot", {
                body: { mode: "gold_moment", dotA: { title: dotA.title, description: dotA.short_description }, dotB: { title: dotB.title, description: dotB.short_description } },
              });
              if (gmData?.superpowerName) {
                // Save gold moment dot to the golden-moments cluster
                const goldenCluster = clusters.find(c => c.slug === "golden-moments");
                if (goldenCluster) {
                  await supabase.from("atlas_dots").insert({
                    user_id: user.id,
                    cluster_id: goldenCluster.id,
                    title: gmData.superpowerName,
                    short_description: gmData.transformationDescription,
                    dot_type: "gold_moment",
                    dot_category: "strength",
                    is_gold_moment: true,
                    evolved_from_ids: [dotA.id, dotB.id],
                    source_system: "gold_moment",
                    confidence_score: 1.0,
                  } as any);
                }

                await supabase.from("atlas_dots").update({ is_gold_moment: true }).in("id", [dotA.id, dotB.id]);
                setGoldMoment({ frustrationTitle: dotA.title, strengthTitle: dotB.title, superpowerName: gmData.superpowerName, transformationDescription: gmData.transformationDescription });
                queryClient.invalidateQueries({ queryKey: ["atlas-dots"] });
                setDotSaved(true);
                return;
              }
            } catch {}
          }
        }
      }

      // Growth level transition
      const targetCluster = clusters.find(c => c.id === dotClusterId);
      const prevDotCount = targetCluster?.dotCount || 0;
      const newDotCount = reinforced ? prevDotCount : prevDotCount + 1;
      const prevLevel = getGrowthLevelName(prevDotCount);
      const newLevel = getGrowthLevelName(newDotCount);

      queryClient.invalidateQueries({ queryKey: ["atlas-dots"] });
      queryClient.invalidateQueries({ queryKey: ["atlas-quests-completed"] });
      queryClient.invalidateQueries({ queryKey: ["atlas-signals"] });
      queryClient.invalidateQueries({ queryKey: ["atlas-patterns"] });

      toast({ title: reinforced ? "Discovery reinforced!" : "Discovery added to Atlas!", description: finalDot.title });

      if (newLevel !== prevLevel && GROWTH_MESSAGES[newLevel]) {
        setTimeout(() => {
          toast({ title: `${targetCluster?.name || "Cluster"} — ${newLevel.charAt(0).toUpperCase() + newLevel.slice(1)}`, description: GROWTH_MESSAGES[newLevel] });
        }, 1500);
      }

      setDotSaved(true);

      // Check if we should show connection moment (onboarding)
      if (isOnboarding && onboardingIndex !== undefined && shouldShowConnectionMoment(onboardingIndex)) {
        setShowConnectionMoment(true);
        return;
      }

      // If onboarding quest 13 just completed, mark onboarding as done
      if (isOnboarding && onboardingIndex === 12) {
        await supabase.from("profiles").update({ onboarding_quest_completed: true } as any).eq("id", user.id);
        queryClient.invalidateQueries({ queryKey: ["profile-onboarding-status"] });
        setShowConnectionMoment(true);
        return;
      }

      // Check if this dot just completed the pre-council sequence
      if (isOnboarding) {
        const PHASE1_SLUGS: Record<string, string[]> = {
          DISCOVER: ["skills", "passions", "personal-frustrations", "experiments"],
          GROW:     ["skills", "passions", "personal-frustrations"],
          BUILD:    ["skills", "passions"],
        };
        const COUNCIL_THRESHOLDS: Record<string, number> = { DISCOVER: 4, GROW: 3, BUILD: 2 };
        const phase1Slugs = PHASE1_SLUGS[entryState] ?? PHASE1_SLUGS.DISCOVER;
        const councilThreshold = COUNCIL_THRESHOLDS[entryState] ?? 4;

        // Count explored phase1 clusters BEFORE this dot (using stale clusters data)
        const exploredBefore = phase1Slugs.filter(slug => {
          const c = clusters.find(cl => cl.slug === slug);
          return c && c.dotCount > 0;
        }).length;

        // After this dot: the just-saved cluster counts as explored
        const justSavedCluster = clusters.find(c => c.id === dotClusterId);
        const justSavedSlug = justSavedCluster?.slug ?? "";
        const exploredAfter = exploredBefore + (phase1Slugs.includes(justSavedSlug) && (justSavedCluster?.dotCount ?? 0) === 0 ? 1 : 0);

        if (exploredAfter >= councilThreshold && exploredBefore < councilThreshold) {
          setShowCouncilUnlocked(true);
          return;
        }
      }

      // For onboarding, go to next quest; otherwise go to atlas with highlight
      if (isOnboarding) {
        navigate("/atlas/quest");
      } else {
        const targetSlug = clusters.find(c => c.id === dotClusterId)?.slug;
        navigate(targetSlug ? `/atlas?highlight=${targetSlug}` : "/atlas");
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error saving discovery", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectionMomentContinue = async () => {
    if (isOnboarding && onboardingIndex === 12) {
      navigate("/atlas");
    } else if (isOnboarding) {
      navigate("/atlas/quest");
    } else {
      navigate("/atlas");
    }
  };

  const progress = Math.min(step + 1, 4);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 pt-5 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(isOnboarding ? "/atlas/quest" : "/atlas")} className="text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">
            {isOnboarding && onboardingIndex !== undefined
              ? `Quest ${onboardingIndex + 1} of 13 · ${quest.clusterName}`
              : quest.clusterName}
          </p>
          <div className="flex gap-1 mt-1.5">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-1 flex-1 rounded-full transition-colors"
                style={{ backgroundColor: i < progress ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <AnimatePresence mode="wait">
          {/* Growth reflection (non-onboarding) */}
          {showGrowthReflection && growthReflection && step === 0 ? (
            <motion.div key="growth-reflection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 text-center px-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Growth Reflection</p>
              <p className="text-sm text-foreground leading-relaxed max-w-sm">{growthReflection}</p>
              <button onClick={() => { setShowGrowthReflection(false); setGrowthReflection(null); setGrowthReflectionDismissed(true); }} className="text-xs text-primary underline">Continue to quest →</button>
            </motion.div>
          ) : showCouncilUnlocked ? (
            <motion.div
              key="council-unlocked"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6 text-center px-6 max-w-sm"
            >
              <motion.div
                animate={{ rotate: [0, -8, 8, -8, 8, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 1, delay: 0.2 }}
                className="text-5xl"
              >
                🎉
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Your Council is ready</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You've mapped the foundations of who you are. Seven mentors are now ready to help you turn that into something real.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => navigate("/council?view=intake")}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white"
                  style={{ background: "hsl(265, 90%, 62%)" }}
                >
                  Meet my Council →
                </button>
                <button
                  onClick={() => navigate("/atlas/quest")}
                  className="text-sm text-muted-foreground underline"
                >
                  Keep exploring Atlas first
                </button>
              </div>
            </motion.div>
          ) : showConnectionMoment ? (
            <ConnectionMomentCard
              key="connection-moment"
              questIndex={onboardingIndex ?? 0}
              userDots={Array.from(new Map(allExistingDots.map(d => [d.title, { title: d.title, dot_category: d.dot_category, cluster_id: d.cluster_id }])).values())}
              onContinue={handleConnectionMomentContinue}
              isIdentityMoment={onboardingIndex !== undefined && isIdentityMoment(onboardingIndex)}
            />
          ) : goldMoment ? (
            <GoldMomentCard key="gold-moment" {...goldMoment} onContinue={() => navigate("/atlas")} />
          ) : followUpQuestion && !followUpDone ? (
            <motion.div key="follow-up" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-sm">
              <AtlasQuestInteraction
                interaction={{ type: "reflection", prompt: followUpQuestion }}
                onSubmit={(response) => {
                  const newResponses = [...responses, response];
                  setResponses(newResponses);
                  setFollowUpDone(true);
                  setFollowUpQuestion(null);
                  processAfterAllInteractions(newResponses);
                }}
              />
            </motion.div>
          ) : step <= 3 ? (
            <AtlasQuestInteraction key={step} interaction={quest.interactions[step]} onSubmit={handleInteractionSubmit} />
          ) : (isGenerating || isCheckingDepth || validationMode === "regenerating") ? (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{isCheckingDepth ? "Reading your answer…" : "Discovering…"}</p>
            </motion.div>
          ) : dotResult ? (
            <AtlasWinningCard
              key="winning" dot={dotResult} clusterName={quest.clusterName}
              onConfirm={handleConfirm} onRegenerate={handleRegenerate}
              isLoading={isSaving} isPatternBased={isPatternBased} isReinforced={isReinforced}
              mirrorFeedback={mirrorFeedback} variations={variations}
              validationMode={validationMode} onSetValidationMode={setValidationMode}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};
