import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Sparkles, Check, Loader2 } from "lucide-react";
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
  const [showRefinement, setShowRefinement] = useState(false);
  const [refinementData, setRefinementData] = useState<any>(null);
  const [loadingRefinement, setLoadingRefinement] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [customPurpose, setCustomPurpose] = useState("");
  const [showProgression, setShowProgression] = useState(false);

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

  const saveDiscoveryAsBackground = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save answers as background data in profiles for Council to access
      await supabase
        .from("profiles")
        .update({ 
          constellation_insights: { discovery_answers: answers }
        })
        .eq("id", user.id);

      // Create insight dots for each answer
      const dotPromises = Object.entries(answers).map(async ([questionId, answer]) => {
        const question = questions.find(q => q.id === questionId);
        if (!question) return;

        await supabase.from("insight_dots").insert({
          user_id: user.id,
          source_type: "Purpose Discovery",
          source_mentor: "future_self",
          insight_text: typeof answer === "string" ? answer : JSON.stringify(answer),
          core_theme: "Self Discovery",
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

      setShowProgression(true);
    } catch (error: any) {
      console.error("Error saving discovery:", error);
      toast.error("Failed to save your journey");
    } finally {
      setSaving(false);
    }
  };

  const getRefinedPurpose = async () => {
    setLoadingRefinement(true);
    try {
      const { data, error } = await supabase.functions.invoke("refine-purpose", {
        body: { purposePath, answers },
      });

      if (error) throw error;

      setRefinementData(data.refinement);
      setShowRefinement(true);
    } catch (error: any) {
      console.error("Error getting refinement:", error);
      toast.error("Failed to generate purpose refinement");
    } finally {
      setLoadingRefinement(false);
    }
  };

  const completeDiscovery = async () => {
    if (currentStep === questions.length - 1) {
      // For discovering/exploring paths, skip refinement and show progression
      if (purposePath === "discovering_purpose" || purposePath === "not_sure") {
        await saveDiscoveryAsBackground();
        return;
      }
      
      // For has_purpose or has_goal paths, show refinement
      await getRefinedPurpose();
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save selected or custom purpose
      const finalPurpose = customPurpose || selectedPurpose;
      if (finalPurpose) {
        await supabase
          .from("profiles")
          .update({ main_mission: finalPurpose })
          .eq("id", user.id);

        // Add to purpose history
        await supabase.from("purpose_history").insert({
          user_id: user.id,
          purpose_text: finalPurpose,
        });
      }

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

  if (showProgression) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-2 border-primary/20">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">
              You've Planted the Seed
            </CardTitle>
            <CardDescription className="text-lg leading-relaxed">
              Your journey starts now. Your Council will guide you step by step as you uncover your purpose over time. 
              Keep showing up, keep reflecting, and your path will become clearer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/5 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-lg">What happens next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Your Council will use your answers to guide you personally</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Complete missions, tasks, and reflections at your own pace</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Track your progress and unlock insights gradually</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Your purpose will emerge naturally through your journey</span>
                </li>
              </ul>
            </div>
            
            <Button 
              onClick={() => navigate("/dashboard")}
              className="w-full h-12 text-lg"
            >
              Continue My Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showRefinement && refinementData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Your Refined Purpose
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Based on your journey, here are focused purpose statements crafted for you
            </p>
          </div>

          {/* Purpose Options */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Choose Your Purpose Statement</h2>
            {refinementData.refinedPurposes?.map((purpose: any, idx: number) => (
              <Card
                key={idx}
                className={`cursor-pointer transition-all hover:scale-[1.02] ${
                  selectedPurpose === purpose.statement
                    ? "border-2 border-primary shadow-lg"
                    : "border-2 border-transparent hover:border-primary/50"
                }`}
                onClick={() => {
                  setSelectedPurpose(purpose.statement);
                  setCustomPurpose("");
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge className="mb-2">{purpose.focus}</Badge>
                      <CardTitle className="text-xl leading-relaxed">
                        {purpose.statement}
                      </CardTitle>
                    </div>
                    {selectedPurpose === purpose.statement && (
                      <Check className="w-6 h-6 text-primary flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{purpose.rationale}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Custom Purpose Option */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Or Write Your Own</CardTitle>
              <CardDescription>
                Feel free to craft your own purpose statement or modify one above
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customPurpose}
                onChange={(e) => {
                  setCustomPurpose(e.target.value);
                  setSelectedPurpose(null);
                }}
                placeholder="Write your own purpose statement..."
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Insights Section */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Themes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {refinementData.keyThemes?.map((theme: string) => (
                    <Badge key={theme} variant="secondary">{theme}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {refinementData.strengthsIdentified?.map((strength: string) => (
                    <Badge key={strength} variant="outline">{strength}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {refinementData.insights && (
            <Alert className="bg-primary/5 border-primary/20">
              <Sparkles className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Insight:</strong> {refinementData.insights}
              </AlertDescription>
            </Alert>
          )}

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps to Live Your Purpose</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {refinementData.nextSteps?.map((step: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary font-bold">{idx + 1}.</span>
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowRefinement(false)}
              className="h-12"
            >
              ← Back to Questions
            </Button>
            <Button
              onClick={completeDiscovery}
              disabled={!selectedPurpose && !customPurpose.trim() || saving}
              className="flex-1 h-12 text-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Journey 🚀"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
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
                disabled={saving || loadingRefinement}
              >
                {currentStep === questions.length - 1 ? (
                  loadingRefinement ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get Purpose Refinement
                    </>
                  )
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
