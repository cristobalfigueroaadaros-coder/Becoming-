import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EvolutionNarrative } from "./EvolutionNarrative";
import { StructuredQuestions, type StructuredAnswers } from "./StructuredQuestions";
import { SprintConsole } from "./SprintConsole";
import { SprintWinnerCard } from "./SprintWinnerCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek } from "date-fns";
import type { WeeklyData } from "@/hooks/useMomentumData";
import { Wind, Sparkles } from "lucide-react";

interface WeeklyRitualFlowProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  weeklyData: WeeklyData;
}

type Step = "grounding" | "questions" | "narrative" | "console" | "confirm" | "winner";

export function WeeklyRitualFlow({ open, onClose, onComplete, weeklyData }: WeeklyRitualFlowProps) {
  const [step, setStep] = useState<Step>("grounding");
  const [timer, setTimer] = useState(30);
  const [answers, setAnswers] = useState<StructuredAnswers | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [sprintDirection, setSprintDirection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (open) {
      setStep("grounding");
      setTimer(30);
      setNarrative(null);
      setAnswers(null);
      setSprintDirection(null);
    }
  }, [open]);

  // Grounding timer
  useEffect(() => {
    if (step !== "grounding" || !open) return;
    if (timer <= 0) { setStep("questions"); return; }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [step, timer, open]);

  const generateNarrative = useCallback(async (structuredAnswers: StructuredAnswers) => {
    setNarrativeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-momentum-narrative", {
        body: {
          weeklyData,
          selfRatings: {
            energy: 5, clarity: 5, confidence: structuredAnswers.directionConfidence, direction: structuredAnswers.directionConfidence,
          },
          structuredAnswers,
        },
      });
      if (error) throw error;
      setNarrative(data?.narrative || "Your momentum is building. Keep going.");
    } catch (err) {
      console.error("Narrative generation failed:", err);
      setNarrative("This week moved you forward. Reflect on what worked and carry it into the next sprint.");
    } finally {
      setNarrativeLoading(false);
    }
  }, [weeklyData]);

  const handleQuestionsComplete = (a: StructuredAnswers) => {
    setAnswers(a);
    setStep("narrative");
    generateNarrative(a);
  };

  const handleDirectionDecided = (direction: string) => {
    setSprintDirection(direction);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const now = new Date();
      const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

      const { data: lastReport } = await supabase
        .from("momentum_weekly_reports")
        .select("streak_weeks, week_end")
        .eq("user_id", user.id)
        .order("week_start", { ascending: false })
        .limit(1);

      let newStreak = 1;
      if (lastReport && lastReport.length > 0) {
        const lastEnd = new Date(lastReport[0].week_end);
        const daysDiff = Math.round((now.getTime() - lastEnd.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 10) newStreak = (lastReport[0].streak_weeks || 0) + 1;
      }

      const { error } = await supabase.from("momentum_weekly_reports").insert({
        user_id: user.id,
        week_start: weekStart,
        week_end: weekEnd,
        tasks_completed: weeklyData.tasksCompleted,
        tasks_total: weeklyData.tasksTotal,
        tasks_skipped: weeklyData.tasksSkipped,
        avg_usefulness_rating: weeklyData.avgUsefulnessRating,
        insights_captured: weeklyData.insightsCaptured,
        wins_captured: weeklyData.topWins.length,
        top_wins: weeklyData.topWins as any,
        top_insights: weeklyData.topInsights as any,
        friction_points: weeklyData.frictionPoints as any,
        phases_active: weeklyData.phasesActive as any,
        evolution_narrative: narrative,
        self_ratings: answers as any,
        ritual_completed_at: now.toISOString(),
        streak_weeks: newStreak,
        momentum_score: weeklyData.momentumScore,
        sprint_direction: sprintDirection,
        friction_type: answers?.frictionType || null,
        biggest_win_type: answers?.biggestWin || null,
        usefulness_answer: answers?.usefulness || null,
      });

      if (error) throw error;
      setStreak(newStreak);
      setStep("winner");
    } catch (err: any) {
      console.error("Failed to save ritual:", err);
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const stepTitles: Record<Step, string> = {
    grounding: "Weekly Grounding",
    questions: "Quick Self-Check",
    narrative: "Your Evolution Narrative",
    console: "Sprint Direction",
    confirm: "Confirm & Continue",
    winner: "🎉",
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stepTitles[step]}</DialogTitle>
        </DialogHeader>

        {step === "grounding" && (
          <div className="text-center space-y-6 py-4">
            <Wind className="h-12 w-12 mx-auto text-primary animate-pulse" />
            <p className="text-sm text-muted-foreground">Take a breath. Let the week settle.</p>
            <p className="text-4xl font-bold">{timer}s</p>
            <Button variant="ghost" size="sm" onClick={() => setStep("questions")}>Skip</Button>
          </div>
        )}

        {step === "questions" && (
          <StructuredQuestions onComplete={handleQuestionsComplete} />
        )}

        {step === "narrative" && (
          <div className="space-y-4 py-2">
            <EvolutionNarrative narrative={narrative} loading={narrativeLoading} />
            {!narrativeLoading && narrative && (
              <Button className="w-full" onClick={() => setStep("console")}>
                <Sparkles className="h-4 w-4 mr-2" /> Continue to Console
              </Button>
            )}
          </div>
        )}

        {step === "console" && answers && (
          <SprintConsole
            weeklyData={weeklyData}
            answers={answers}
            onDirectionDecided={handleDirectionDecided}
          />
        )}

        {step === "confirm" && (
          <div className="space-y-4 py-2 text-center">
            <div className="bg-primary/10 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Sprint Direction</p>
              <p className="font-medium">{sprintDirection}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Ready to lock in this week and carry forward?
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("console")}>
                Adjust
              </Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={saving}>
                {saving ? "Saving..." : "Confirm & Close"}
              </Button>
            </div>
          </div>
        )}

        {step === "winner" && (
          <SprintWinnerCard
            streak={streak}
            direction={sprintDirection || "Continue and deepen"}
            onDismiss={onComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
