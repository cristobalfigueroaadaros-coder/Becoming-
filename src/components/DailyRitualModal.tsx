import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Flame, Target } from "lucide-react";

interface DailyRitualModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type RitualStep = "check-in" | "visualization" | "intention" | "complete";

export const DailyRitualModal = ({ open, onClose, onComplete }: DailyRitualModalProps) => {
  const [step, setStep] = useState<RitualStep>("check-in");
  const [checkInText, setCheckInText] = useState("");
  const [todayGoal, setTodayGoal] = useState("");
  const [futureMessage, setFutureMessage] = useState("");
  const [streak, setStreak] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadFutureSelfMessage();
      calculateStreak();
    }
  }, [open]);

  const loadFutureSelfMessage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("future_lifestyle, main_mission")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFutureMessage(
          `You are living ${profile.future_lifestyle || "your ideal life"}. Your mission: ${profile.main_mission || "to grow and evolve every day"}. Today is another step toward becoming me.`
        );
      }
    } catch (error) {
      console.error("Error loading future self:", error);
    }
  };

  const calculateStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rituals } = await supabase
        .from("daily_rituals")
        .select("completed_at, streak_count")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(1);

      if (rituals && rituals.length > 0) {
        const lastRitual = rituals[0];
        const lastDate = new Date(lastRitual.completed_at);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          setStreak(lastRitual.streak_count + 1);
        } else if (diffDays > 1) {
          setStreak(1); // Streak broken
        } else {
          setStreak(lastRitual.streak_count);
        }
      }
    } catch (error) {
      console.error("Error calculating streak:", error);
    }
  };

  const handleNext = () => {
    if (step === "check-in") {
      if (!checkInText.trim()) {
        toast.error("Please share how you're feeling");
        return;
      }
      setStep("visualization");
    } else if (step === "visualization") {
      setStep("intention");
    } else if (step === "intention") {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!todayGoal.trim()) {
      toast.error("Please set your intention for today");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save ritual
      const { error: ritualError } = await supabase
        .from("daily_rituals")
        .insert({
          user_id: user.id,
          check_in_text: checkInText,
          streak_count: streak,
        });

      if (ritualError) throw ritualError;

      // Save daily goal
      const { error: goalError } = await supabase
        .from("daily_goals")
        .insert({
          user_id: user.id,
          goal_text: todayGoal,
        });

      if (goalError) throw goalError;

      // Award streak bonus XP if applicable
      if (streak >= 7) {
        const bonusXP = Math.floor(streak / 7) * 50;
        const { data: progress } = await supabase
          .from("future_self_progress")
          .select("global_xp")
          .eq("user_id", user.id)
          .single();

        if (progress) {
          await supabase
            .from("future_self_progress")
            .update({ global_xp: progress.global_xp + bonusXP })
            .eq("user_id", user.id);

          toast.success(`🔥 ${streak}-day streak! Bonus +${bonusXP} XP!`);
        }
      }

      setStep("complete");
      setTimeout(() => {
        onComplete();
        onClose();
        // Reset state
        setStep("check-in");
        setCheckInText("");
        setTodayGoal("");
      }, 2000);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "check-in":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-lg font-semibold">How are you feeling right now?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Take a moment to check in with yourself. No judgment, just awareness.
            </p>
            <Textarea
              value={checkInText}
              onChange={(e) => setCheckInText(e.target.value)}
              placeholder="I'm feeling..."
              className="min-h-[120px]"
              autoFocus
            />
          </div>
        );

      case "visualization":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Target className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Your Future Self Speaks</h3>
            </div>
            <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-foreground italic leading-relaxed">
                "{futureMessage || "Loading your vision..."}"
              </p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Take a deep breath. See yourself there. Feel it.
            </p>
          </div>
        );

      case "intention":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Target className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Set Today's Intention</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              What ONE thing will you accomplish today to move closer to your future self?
            </p>
            <Textarea
              value={todayGoal}
              onChange={(e) => setTodayGoal(e.target.value)}
              placeholder="Today, I will..."
              className="min-h-[100px]"
              autoFocus
            />
            <div className="flex items-center gap-2 p-4 rounded-lg bg-accent/50">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium">
                Current Streak: {streak} day{streak !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        );

      case "complete":
        return (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Ritual Complete! 🎉</h3>
            <p className="text-muted-foreground">
              You've set your intention. Now go create your future.
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Morning Ritual</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {renderStep()}
        </div>

        {step !== "complete" && (
          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-1">
              {["check-in", "visualization", "intention"].map((s, i) => (
                <div
                  key={s}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    ["check-in", "visualization", "intention"].indexOf(step) >= i
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <Button onClick={handleNext} disabled={isSubmitting}>
              {step === "intention" ? "Complete Ritual" : "Continue"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
