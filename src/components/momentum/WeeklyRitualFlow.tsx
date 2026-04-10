import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StructuredQuestions, type StructuredAnswers } from "./StructuredQuestions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek } from "date-fns";
import type { WeeklyData } from "@/hooks/useMomentumData";
import { Wind, Loader2 } from "lucide-react";

interface WeeklyRitualFlowProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  weeklyData: WeeklyData;
}

type Step = "grounding" | "questions" | "saving";

export function WeeklyRitualFlow({ open, onClose, onComplete, weeklyData }: WeeklyRitualFlowProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("grounding");
  const [timer, setTimer] = useState(30);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("grounding");
      setTimer(30);
    }
  }, [open]);

  // Grounding timer
  useEffect(() => {
    if (step !== "grounding" || !open) return;
    if (timer <= 0) { setStep("questions"); return; }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [step, timer, open]);

  const detectBehavioralCapabilities = async (userId: string, reports: any[]) => {
    if (reports.length < 3) return;
    try {
      const recentReports = reports.slice(0, 6);
      const capChecks: { name: string; category: string; condition: boolean }[] = [
        {
          name: "Execution Consistency",
          category: "execution",
          condition: recentReports.slice(0, 3).every((r: any) => {
            const rate = r.tasks_total > 0 ? (r.tasks_completed / r.tasks_total) * 100 : 0;
            return rate > 80;
          }),
        },
        {
          name: "Focus Stability",
          category: "strategy",
          condition:
            recentReports.slice(0, 4).length >= 4 &&
            recentReports.slice(0, 4).every(
              (r: any) => !r.sprint_direction?.toLowerCase().includes("pivot")
            ),
        },
        {
          name: "Reflection Discipline",
          category: "reflection",
          condition: recentReports.slice(0, 3).every((r: any) => (r.reflection_rate || 0) > 60),
        },
      ];

      const toInsert = capChecks.filter((c) => c.condition);
      if (toInsert.length === 0) return;

      const { data: existing } = await supabase
        .from("momentum_capabilities")
        .select("capability_name")
        .eq("user_id", userId)
        .in("capability_name", toInsert.map((c) => c.name));

      const existingNames = new Set((existing || []).map((e: any) => e.capability_name));
      const newCaps = toInsert.filter((c) => !existingNames.has(c.name));

      if (newCaps.length > 0) {
        await supabase.from("momentum_capabilities").insert(
          newCaps.map((c) => ({
            user_id: userId,
            capability_name: c.name,
            source_type: "behavioral",
            activation_count: 1,
            level: 1,
            acquisition_channel: "behavioral_detected",
            category: c.category,
            description: `Detected from consistent sprint behavior across ${recentReports.length} weeks.`,
          })) as any
        );
      }
    } catch (err) {
      console.error("Behavioral capability detection error:", err);
    }
  };

  const handleQuestionsComplete = async (answers: StructuredAnswers) => {
    setSaving(true);
    setStep("saving");
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

      await supabase.from("momentum_weekly_reports").insert({
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
        self_ratings: answers as any,
        ritual_completed_at: now.toISOString(),
        streak_weeks: newStreak,
        momentum_score: weeklyData.momentumScore,
        friction_type: answers.frictionType || null,
        biggest_win_type: answers.biggestWin || null,
        usefulness_answer: answers.usefulness || null,
        reflection_rate: weeklyData.reflectionRate,
        active_days: weeklyData.activeDays,
      });

      // Detect behavioral capabilities in the background
      supabase
        .from("momentum_weekly_reports")
        .select("*")
        .eq("user_id", user.id)
        .order("week_start", { ascending: false })
        .limit(6)
        .then(({ data: allReports }) => {
          if (allReports) detectBehavioralCapabilities(user.id, allReports);
        });

      // Close dialog and hand off to the real Console
      onClose();
      onComplete();
      navigate("/council", {
        state: {
          openerType: "sprint_review",
          notificationContext: {
            sprintReviewContext: {
              momentumScore: weeklyData.momentumScore,
              completionRate: weeklyData.completionRate,
              activeDays: weeklyData.activeDays,
              frictionType: answers.frictionType,
              biggestWin: answers.biggestWin,
              usefulness: answers.usefulness,
              directionConfidence: answers.directionConfidence,
              topWins: weeklyData.topWins,
              streak: newStreak,
            },
          },
        },
      });
    } catch (err: any) {
      console.error("Failed to save ritual:", err);
      toast.error("Failed to save. Please try again.");
      setStep("questions");
    } finally {
      setSaving(false);
    }
  };

  const stepTitles: Record<Step, string> = {
    grounding: "Weekly Grounding",
    questions: "Quick Self-Check",
    saving: "Locking in your week...",
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

        {step === "saving" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Saving your week, opening the Console...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
