import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Flame, Target, Heart, Music, Play, Pause, Star, Trash2, ExternalLink } from "lucide-react";
import { MicroGuide } from "@/components/MicroGuide";
import { useAchievements } from "@/hooks/useAchievements";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DailyRitualModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type RitualStep = "check-in" | "meditation" | "visualization" | "affirmation" | "intention" | "complete";

interface Affirmation {
  id: string;
  affirmation_text?: string;
  song_name?: string;
  song_link?: string;
  is_favorite: boolean;
}

export const DailyRitualModal = ({ open, onClose, onComplete }: DailyRitualModalProps) => {
  const [step, setStep] = useState<RitualStep>("check-in");
  const [checkInText, setCheckInText] = useState("");
  const [todayGoal, setTodayGoal] = useState("");
  const [futureMessage, setFutureMessage] = useState("");
  const [streak, setStreak] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { checkMultipleAchievements } = useAchievements();

  // Meditation timer state
  const [meditationTime, setMeditationTime] = useState(60); // 60 seconds
  const [meditationCountdown, setMeditationCountdown] = useState(60);
  const [isMeditating, setIsMeditating] = useState(false);
  
  // Breathing guide state
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathingCount, setBreathingCount] = useState(4);
  
  // Affirmations state
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [newAffirmation, setNewAffirmation] = useState("");
  const [newSongName, setNewSongName] = useState("");
  const [newSongLink, setNewSongLink] = useState("");
  const [selectedAffirmations, setSelectedAffirmations] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadFutureSelfMessage();
      calculateStreak();
      loadAffirmations();
      // Reset state when opening
      setStep("check-in");
      setCheckInText("");
      setTodayGoal("");
      setMeditationCountdown(meditationTime);
      setIsMeditating(false);
      setSelectedAffirmations([]);
    }
  }, [open]);

  // Meditation timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isMeditating && meditationCountdown > 0) {
      interval = setInterval(() => {
        setMeditationCountdown((prev) => {
          if (prev <= 1) {
            setIsMeditating(false);
            toast.success("Meditation complete! 🧘");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMeditating, meditationCountdown]);

  // Breathing guide effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === "visualization") {
      interval = setInterval(() => {
        setBreathingCount((prev) => {
          if (prev <= 1) {
            setBreathingPhase((currentPhase) => {
              if (currentPhase === "inhale") return "hold";
              if (currentPhase === "hold") return "exhale";
              return "inhale";
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, breathingPhase]);

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
          setStreak(1);
        } else {
          setStreak(lastRitual.streak_count);
        }
      }
    } catch (error) {
      console.error("Error calculating streak:", error);
    }
  };

  const loadAffirmations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_affirmations")
        .select("*")
        .eq("user_id", user.id)
        .order("is_favorite", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAffirmations(data || []);
    } catch (error) {
      console.error("Error loading affirmations:", error);
    }
  };

  const addAffirmation = async () => {
    if (!newAffirmation.trim() && !newSongName.trim()) {
      toast.error("Please add an affirmation or song");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_affirmations")
        .insert({
          user_id: user.id,
          affirmation_text: newAffirmation.trim() || null,
          song_name: newSongName.trim() || null,
          song_link: newSongLink.trim() || null,
        });

      if (error) throw error;

      toast.success("Added to your collection!");
      setNewAffirmation("");
      setNewSongName("");
      setNewSongLink("");
      loadAffirmations();
    } catch (error: any) {
      toast.error("Failed to add", { description: error.message });
    }
  };

  const deleteAffirmation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_affirmations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Removed");
      loadAffirmations();
    } catch (error) {
      toast.error("Failed to remove");
    }
  };

  const toggleFavorite = async (id: string, currentFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from("user_affirmations")
        .update({ is_favorite: !currentFavorite })
        .eq("id", id);

      if (error) throw error;
      loadAffirmations();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleNext = () => {
    if (step === "check-in") {
      if (!checkInText.trim()) {
        toast.error("Please share how you're feeling");
        return;
      }
      setStep("meditation");
    } else if (step === "meditation") {
      if (meditationCountdown > 0 && isMeditating) {
        toast.info("Complete your meditation first");
        return;
      }
      setStep("visualization");
    } else if (step === "visualization") {
      setStep("affirmation");
    } else if (step === "affirmation") {
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

      const { error: ritualError } = await supabase
        .from("daily_rituals")
        .insert({
          user_id: user.id,
          check_in_text: checkInText,
          streak_count: streak,
        });

      if (ritualError) throw ritualError;

      const { error: goalError } = await supabase
        .from("daily_goals")
        .insert({
          user_id: user.id,
          goal_text: todayGoal,
        });

      if (goalError) throw goalError;

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

      await checkMultipleAchievements({
        ritualCount: 1,
        ritualStreak: streak,
      });

      setStep("complete");
      setTimeout(() => {
        onComplete();
        onClose();
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
              <MicroGuide
                guideKey="daily_ritual"
                title="Daily Ritual"
                description={"This is a moment for yourself.\n\nHere you take a short pause through breathing, meditation, or visualization to center your focus before taking action."}
              />
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

      case "meditation":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <Heart className="w-5 h-5" />
              <h3 className="text-lg font-semibold">1-Minute Meditation</h3>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Close your eyes. Focus on your breath. Let everything else fall away.
            </p>
            
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-primary transition-all duration-1000"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - (meditationTime - meditationCountdown) / meditationTime)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold">{meditationCountdown}</span>
                </div>
              </div>
              
              <Button
                size="lg"
                variant={isMeditating ? "outline" : "default"}
                onClick={() => {
                  if (isMeditating) {
                    setIsMeditating(false);
                  } else {
                    setMeditationCountdown(meditationTime);
                    setIsMeditating(true);
                  }
                }}
                className="w-40"
              >
                {isMeditating ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : meditationCountdown === 0 ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Restart
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Begin
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case "visualization":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <Target className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Visualize Your Future Self</h3>
            </div>
            
            {/* Breathing Guide */}
            <div className="flex flex-col items-center gap-4 py-6">
              <div className={cn(
                "w-24 h-24 rounded-full border-4 transition-all duration-1000",
                breathingPhase === "inhale" && "scale-125 border-primary bg-primary/10",
                breathingPhase === "hold" && "scale-125 border-accent bg-accent/10",
                breathingPhase === "exhale" && "scale-100 border-muted bg-muted/10"
              )}>
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl font-bold">{breathingCount}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                {breathingPhase === "inhale" && "Breathe In"}
                {breathingPhase === "hold" && "Hold"}
                {breathingPhase === "exhale" && "Breathe Out"}
              </Badge>
            </div>

            <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <p className="text-foreground italic leading-relaxed text-center">
                "{futureMessage || "Loading your vision..."}"
              </p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              See yourself there. Feel it. Embody it.
            </p>
          </div>
        );

      case "affirmation":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Music className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Affirmations & Music</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Select affirmations or songs that energize you for the day ahead
            </p>

            {/* Add New Affirmation/Song */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <div>
                <Label htmlFor="new-affirmation" className="text-xs">New Affirmation</Label>
                <Input
                  id="new-affirmation"
                  placeholder="I am capable and strong..."
                  value={newAffirmation}
                  onChange={(e) => setNewAffirmation(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="song-name" className="text-xs">Song Name</Label>
                  <Input
                    id="song-name"
                    placeholder="Eye of the Tiger"
                    value={newSongName}
                    onChange={(e) => setNewSongName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="song-link" className="text-xs">Song Link (Optional)</Label>
                  <Input
                    id="song-link"
                    placeholder="https://..."
                    value={newSongLink}
                    onChange={(e) => setNewSongLink(e.target.value)}
                  />
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={addAffirmation} className="w-full">
                Add to Collection
              </Button>
            </div>

            {/* Existing Affirmations */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {affirmations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Add your first affirmation or song above
                </p>
              ) : (
                affirmations.map((aff) => (
                  <div
                    key={aff.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all cursor-pointer",
                      selectedAffirmations.includes(aff.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => {
                      setSelectedAffirmations((prev) =>
                        prev.includes(aff.id)
                          ? prev.filter((id) => id !== aff.id)
                          : [...prev, aff.id]
                      );
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {aff.affirmation_text && (
                          <p className="text-sm font-medium">{aff.affirmation_text}</p>
                        )}
                        {aff.song_name && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Music className="w-3 h-3" />
                            <span>{aff.song_name}</span>
                            {aff.song_link && (
                              <a
                                href={aff.song_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-primary"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(aff.id, aff.is_favorite);
                          }}
                        >
                          <Star
                            className={cn(
                              "w-3 h-3",
                              aff.is_favorite && "fill-yellow-500 text-yellow-500"
                            )}
                          />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAffirmation(aff.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
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
            <div className="flex items-center gap-2 p-4 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20">
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
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold">Ritual Complete! 🎉</h3>
            <p className="text-muted-foreground">
              You've set your intention. Now go create your future.
            </p>
          </div>
        );
    }
  };

  const steps: RitualStep[] = ["check-in", "meditation", "visualization", "affirmation", "intention"];
  const currentStepIndex = steps.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Morning Ritual</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {renderStep()}
        </div>

        {step !== "complete" && (
          <div className="flex flex-col gap-4 pt-4 border-t">
            <Progress value={(currentStepIndex / steps.length) * 100} className="h-2" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <Button onClick={handleNext} disabled={isSubmitting}>
                {step === "intention" ? "Complete Ritual" : "Continue →"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
