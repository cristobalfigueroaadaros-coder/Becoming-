import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question: string;
  placeholder: string;
  type: "text" | "goal_breakdown";
}

const pathQuestions: Record<string, Question[]> = {
  has_purpose: [
    {
      id: "purpose_statement",
      question: "What is your purpose in one sentence?",
      placeholder: "My purpose is to...",
      type: "text"
    },
    {
      id: "purpose_build",
      question: "Do you want to build something from it? If so, what?",
      placeholder: "I want to create/build...",
      type: "text"
    },
    {
      id: "purpose_success",
      question: "What does success look like for you?",
      placeholder: "Success means...",
      type: "text"
    },
    {
      id: "purpose_steps",
      question: "What steps are you already taking?",
      placeholder: "I am currently...",
      type: "text"
    }
  ],
  discovering_purpose: [
    {
      id: "joy_energy",
      question: "What brings you joy or energy?",
      placeholder: "I feel most alive when...",
      type: "text"
    },
    {
      id: "stuck_areas",
      question: "Where do you feel stuck?",
      placeholder: "I feel stuck in...",
      type: "text"
    },
    {
      id: "help_requests",
      question: "What do others often ask you for help with?",
      placeholder: "People come to me for...",
      type: "text"
    },
    {
      id: "admiration",
      question: "Who do you admire and why?",
      placeholder: "I admire... because...",
      type: "text"
    }
  ],
  has_goal: [
    {
      id: "specific_goal",
      question: "What is your specific goal?",
      placeholder: "My goal is to...",
      type: "text"
    },
    {
      id: "goal_breakdown",
      question: "Let's break it down into timeframes",
      placeholder: "",
      type: "goal_breakdown"
    }
  ],
  not_sure: [
    {
      id: "current_state",
      question: "How would you describe where you are right now?",
      placeholder: "Right now, I feel...",
      type: "text"
    },
    {
      id: "desired_change",
      question: "What would you like to be different in your life?",
      placeholder: "I wish...",
      type: "text"
    },
    {
      id: "curiosities",
      question: "What are you curious about exploring?",
      placeholder: "I'm interested in...",
      type: "text"
    }
  ]
};

export default function PurposeDiscoveryFlow() {
  const navigate = useNavigate();
  const [purposePath, setPurposePath] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Load profile to get purpose path
      const { data: profile } = await supabase
        .from("profiles")
        .select("purpose_path")
        .eq("id", user.id)
        .single();

      if (!profile?.purpose_path) {
        toast.error("Purpose path not found. Please complete onboarding first.");
        navigate("/onboarding/step1");
        return;
      }

      setPurposePath(profile.purpose_path);

      // Load existing progress
      const { data: progress } = await supabase
        .from("self_discovery_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("purpose_path", profile.purpose_path)
        .maybeSingle();

      if (progress) {
        setCurrentStep(progress.current_step);
        const parsedAnswers = typeof progress.answers === 'object' && progress.answers !== null 
          ? progress.answers as Record<string, any>
          : {};
        setAnswers(parsedAnswers);
        
        if (progress.completed) {
          navigate("/dashboard");
          return;
        }
      }

      setLoading(false);
    } catch (error: any) {
      console.error("Error loading progress:", error);
      toast.error("Failed to load progress");
      setLoading(false);
    }
  };

  const questions = pathQuestions[purposePath] || [];
  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (value: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const saveProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("self_discovery_progress")
        .upsert({
          user_id: user.id,
          purpose_path: purposePath,
          current_step: currentStep,
          answers: answers,
          completed: false
        });

      if (error) throw error;
    } catch (error: any) {
      console.error("Error saving progress:", error);
    }
  };

  const handleNext = async () => {
    if (!answers[currentQuestion.id] || 
        (currentQuestion.type === "goal_breakdown" && Object.keys(answers[currentQuestion.id] || {}).length < 4)) {
      toast.error("Please answer the question before continuing");
      return;
    }

    await saveProgress();

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      await completeDiscovery();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeDiscovery = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create insight dots for each answer
      const dotPromises = Object.entries(answers).map(async ([questionId, answer]) => {
        const question = questions.find(q => q.id === questionId);
        if (!question) return;

        if (question.type === "goal_breakdown") {
          // Create goal entries
          const goalData = answer as Record<string, string>;
          const today = new Date();

          if (goalData.week) {
            await supabase.from("weekly_goals").insert({
              user_id: user.id,
              goal_text: goalData.week,
              week_start: today.toISOString().split("T")[0]
            });
          }

          if (goalData.month) {
            await supabase.from("monthly_goals").insert({
              user_id: user.id,
              goal_text: goalData.month,
              month_start: today.toISOString().split("T")[0].substring(0, 7) + "-01"
            });
          }

          if (goalData.sixmonth) {
            await supabase.from("monthly_goals").insert({
              user_id: user.id,
              goal_text: `[6-month] ${goalData.sixmonth}`,
              month_start: today.toISOString().split("T")[0]
            });
          }

          if (goalData.year) {
            await supabase.from("yearly_goals").insert({
              user_id: user.id,
              goal_text: goalData.year,
              year: today.getFullYear()
            });
          }
        }

        // Create insight dot
        await supabase.from("insight_dots").insert({
          user_id: user.id,
          source_type: "purpose_discovery",
          insight_text: typeof answer === "string" ? answer : JSON.stringify(answer),
          core_theme: "Purpose Path",
          skill_tags: [purposePath.replace("_", " ")],
          emotional_tone: "reflective"
        });
      });

      await Promise.all(dotPromises);

      // Mark progress as completed
      await supabase
        .from("self_discovery_progress")
        .upsert({
          user_id: user.id,
          purpose_path: purposePath,
          current_step: currentStep,
          answers: answers,
          completed: true
        });

      toast.success("Purpose discovery completed! 🎉");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error completing discovery:", error);
      toast.error("Failed to save your journey");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <p className="text-muted-foreground">Loading your journey...</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {questions.length}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wide">
                Self Discovery
              </span>
            </div>
            <CardTitle className="text-2xl">{currentQuestion.question}</CardTitle>
            <CardDescription>
              Take your time. Your answers will help shape your personalized journey.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion.type === "text" ? (
              <Textarea
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder={currentQuestion.placeholder}
                rows={6}
                className="resize-none"
              />
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>1-Week Goal</Label>
                  <Input
                    value={answers[currentQuestion.id]?.week || ""}
                    onChange={(e) => handleAnswer({ ...answers[currentQuestion.id], week: e.target.value })}
                    placeholder="What can you achieve this week?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>1-Month Goal</Label>
                  <Input
                    value={answers[currentQuestion.id]?.month || ""}
                    onChange={(e) => handleAnswer({ ...answers[currentQuestion.id], month: e.target.value })}
                    placeholder="What can you achieve this month?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>6-Month Goal</Label>
                  <Input
                    value={answers[currentQuestion.id]?.sixmonth || ""}
                    onChange={(e) => handleAnswer({ ...answers[currentQuestion.id], sixmonth: e.target.value })}
                    placeholder="What can you achieve in 6 months?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>1-Year Goal</Label>
                  <Input
                    value={answers[currentQuestion.id]?.year || ""}
                    onChange={(e) => handleAnswer({ ...answers[currentQuestion.id], year: e.target.value })}
                    placeholder="What can you achieve in 1 year?"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button
                onClick={handleNext}
                disabled={saving}
              >
                {currentStep === questions.length - 1 ? (
                  saving ? "Completing..." : "Complete Journey"
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
