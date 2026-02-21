import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { EvolutionNarrative } from "./EvolutionNarrative";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek } from "date-fns";
import type { WeeklyData } from "@/hooks/useMomentumData";
import { Wind, Sparkles, Check } from "lucide-react";

interface WeeklyRitualFlowProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  weeklyData: WeeklyData;
}

type Step = "grounding" | "ratings" | "narrative" | "confirm";

export function WeeklyRitualFlow({ open, onClose, onComplete, weeklyData }: WeeklyRitualFlowProps) {
  const [step, setStep] = useState<Step>("grounding");
  const [timer, setTimer] = useState(30);
  const [ratings, setRatings] = useState({ energy: 5, clarity: 5, confidence: 5, direction: 5 });
  const [narrative, setNarrative] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("grounding");
      setTimer(30);
      setNarrative(null);
      setRatings({ energy: 5, clarity: 5, confidence: 5, direction: 5 });
    }
  }, [open]);

  // Grounding timer
  useEffect(() => {
    if (step !== "grounding" || !open) return;
    if (timer <= 0) {
      setStep("ratings");
      return;
    }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [step, timer, open]);

  const generateNarrative = useCallback(async () => {
    setNarrativeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-momentum-narrative", {
        body: { weeklyData, selfRatings: ratings },
      });
      if (error) throw error;
      setNarrative(data?.narrative || "Your momentum is building. Keep going.");
    } catch (err) {
      console.error("Narrative generation failed:", err);
      setNarrative("This week moved you forward. Reflect on what worked and carry it into the next sprint.");
    } finally {
      setNarrativeLoading(false);
    }
  }, [weeklyData, ratings]);

  const handleRatingsNext = async () => {
    setStep("narrative");
    await generateNarrative();
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const now = new Date();
      const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

      // Get current streak
      const { data: lastReport } = await supabase
        .from("momentum_weekly_reports")
        .select("streak_weeks, week_end")
        .eq("user_id", user.id)
        .order("week_start", { ascending: false })
        .limit(1);

      let streak = 1;
      if (lastReport && lastReport.length > 0) {
        const lastEnd = new Date(lastReport[0].week_end);
        const daysDiff = Math.round((now.getTime() - lastEnd.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 10) {
          streak = (lastReport[0].streak_weeks || 0) + 1;
        }
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
        self_ratings: ratings as any,
        ritual_completed_at: now.toISOString(),
        streak_weeks: streak,
      });

      if (error) throw error;

      toast.success("Weekly ritual complete! Streak: " + streak + " week" + (streak !== 1 ? "s" : ""));
      onComplete();
    } catch (err: any) {
      console.error("Failed to save ritual:", err);
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "grounding" && "Weekly Grounding"}
            {step === "ratings" && "Quick Self-Check"}
            {step === "narrative" && "Your Evolution Narrative"}
            {step === "confirm" && "Confirm & Continue"}
          </DialogTitle>
        </DialogHeader>

        {step === "grounding" && (
          <div className="text-center space-y-6 py-4">
            <Wind className="h-12 w-12 mx-auto text-primary animate-pulse" />
            <p className="text-sm text-muted-foreground">Take a breath. Let the week settle.</p>
            <p className="text-4xl font-bold">{timer}s</p>
            <Button variant="ghost" size="sm" onClick={() => setStep("ratings")}>
              Skip
            </Button>
          </div>
        )}

        {step === "ratings" && (
          <div className="space-y-5 py-2">
            {(["energy", "clarity", "confidence", "direction"] as const).map((key) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between">
                  <Label className="capitalize">{key}</Label>
                  <span className="text-sm font-medium">{ratings[key]}</span>
                </div>
                <Slider
                  value={[ratings[key]]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={([v]) => setRatings((r) => ({ ...r, [key]: v }))}
                />
              </div>
            ))}
            <Button className="w-full" onClick={handleRatingsNext}>Continue</Button>
          </div>
        )}

        {step === "narrative" && (
          <div className="space-y-4 py-2">
            <EvolutionNarrative narrative={narrative} loading={narrativeLoading} />
            {!narrativeLoading && narrative && (
              <Button className="w-full" onClick={() => setStep("confirm")}>
                <Sparkles className="h-4 w-4 mr-2" /> Continue
              </Button>
            )}
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4 py-2 text-center">
            <Check className="h-12 w-12 mx-auto text-accent" />
            <p className="text-sm text-muted-foreground">
              Ready to lock in this week and carry forward?
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                I want to adjust
              </Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={saving}>
                {saving ? "Saving..." : "Confirm & Close"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
