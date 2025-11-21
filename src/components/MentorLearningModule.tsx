import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface LearningModule {
  summary: string;
  coreInsight: string;
  skillFocus: string;
  quizQuestions: QuizQuestion[];
  badgeName: string;
  badgeIcon: string;
}

interface MentorLearningModuleProps {
  mentorType: string;
  mentorName: string;
  moduleData: LearningModule;
  onComplete: () => void;
  onClose: () => void;
}

export const MentorLearningModule = ({
  mentorType,
  mentorName,
  moduleData,
  onComplete,
  onClose,
}: MentorLearningModuleProps) => {
  const [step, setStep] = useState<"reflection" | "quiz" | "results">("reflection");
  const [userTakeaway, setUserTakeaway] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [badgeEarned, setBadgeEarned] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleReflectionSubmit = async () => {
    if (!userTakeaway.trim()) {
      toast.error("Please write what you learned");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save user's reflection as an insight dot
      await supabase.from("insight_dots").insert({
        user_id: user.id,
        source_type: "mentor_chat",
        source_mentor: mentorName,
        insight_text: userTakeaway,
        core_theme: moduleData.skillFocus,
        skill_tags: [moduleData.skillFocus],
      });

      toast.success("Reflection saved!");
      setStep("quiz");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) return;

    setUserAnswers([...userAnswers, selectedAnswer]);
    setShowFeedback(true);

    setTimeout(() => {
      if (currentQuestion < moduleData.quizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        // Calculate final score
        const correctCount = userAnswers.reduce((count, answer, idx) => {
          return answer === moduleData.quizQuestions[idx].correctAnswer ? count + 1 : count;
        }, 0) + (selectedAnswer === moduleData.quizQuestions[currentQuestion].correctAnswer ? 1 : 0);

        const score = Math.round((correctCount / moduleData.quizQuestions.length) * 100);
        setQuizScore(score);
        setStep("results");

        // Award badge if passed (70%+)
        if (score >= 70) {
          awardBadge(score);
        }
      }
    }, 1500);
  };

  const awardBadge = async (score: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if badge already earned
      const { data: existingBadge } = await supabase
        .from("user_mentor_badges")
        .select("*")
        .eq("user_id", user.id)
        .eq("mentor_type", mentorType as any)
        .eq("badge_name", moduleData.badgeName)
        .maybeSingle();

      if (!existingBadge) {
        await supabase.from("user_mentor_badges").insert({
          user_id: user.id,
          mentor_type: mentorType as any,
          badge_name: moduleData.badgeName,
          badge_icon: moduleData.badgeIcon,
          quiz_score: score,
        });

        setBadgeEarned(true);
        
        // Confetti celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        toast.success(`🎉 You earned: ${moduleData.badgeName}!`);
      }
    } catch (error: any) {
      console.error("Error awarding badge:", error);
    }
  };

  const currentQ = moduleData.quizQuestions[currentQuestion];
  const isCorrect = selectedAnswer === currentQ?.correctAnswer;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl"
      >
        <Card className="border-2 border-primary/30">
          <CardHeader className="space-y-1 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Learning Module: {mentorName}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
            <CardDescription>
              {step === "reflection" && "Reflect on what you learned"}
              {step === "quiz" && `Question ${currentQuestion + 1} of ${moduleData.quizQuestions.length}`}
              {step === "results" && "Quiz Complete!"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Reflection */}
              {step === "reflection" && (
                <motion.div
                  key="reflection"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Summary</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {moduleData.summary}
                    </p>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="font-medium text-primary">
                      Core Insight: {moduleData.coreInsight}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="takeaway">What did you learn from {mentorName}?</Label>
                    <Textarea
                      id="takeaway"
                      placeholder="Write your key takeaway..."
                      value={userTakeaway}
                      onChange={(e) => setUserTakeaway(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    onClick={handleReflectionSubmit}
                    disabled={!userTakeaway.trim() || saving}
                    className="w-full"
                    size="lg"
                  >
                    {saving ? "Saving..." : "Continue to Quiz"}
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Quiz */}
              {step === "quiz" && currentQ && (
                <motion.div
                  key={`quiz-${currentQuestion}`}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">{currentQ.question}</h3>
                    <RadioGroup
                      value={selectedAnswer?.toString()}
                      onValueChange={(value) => setSelectedAnswer(parseInt(value))}
                      disabled={showFeedback}
                      className="space-y-3"
                    >
                      {currentQ.options.map((option, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-start space-x-3 rounded-lg border p-4 transition-all",
                            showFeedback && idx === currentQ.correctAnswer && "border-green-500 bg-green-50 dark:bg-green-950/20",
                            showFeedback && idx === selectedAnswer && idx !== currentQ.correctAnswer && "border-red-500 bg-red-50 dark:bg-red-950/20",
                            !showFeedback && "hover:bg-accent/50 cursor-pointer"
                          )}
                        >
                          <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                          <Label
                            htmlFor={`option-${idx}`}
                            className="flex-1 cursor-pointer text-sm font-normal leading-relaxed"
                          >
                            {option}
                          </Label>
                          {showFeedback && idx === currentQ.correctAnswer && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {showFeedback && idx === selectedAnswer && idx !== currentQ.correctAnswer && (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {showFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-4 rounded-lg text-sm",
                        isCorrect ? "bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-100" : "bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100"
                      )}
                    >
                      {isCorrect ? "✓ Correct!" : "✗ That's not quite right."}
                    </motion.div>
                  )}

                  <Button
                    onClick={handleAnswerSubmit}
                    disabled={selectedAnswer === null || showFeedback}
                    className="w-full"
                    size="lg"
                  >
                    {showFeedback
                      ? currentQuestion < moduleData.quizQuestions.length - 1
                        ? "Next Question..."
                        : "See Results..."
                      : "Submit Answer"}
                  </Button>
                </motion.div>
              )}

              {/* Step 3: Results */}
              {step === "results" && (
                <motion.div
                  key="results"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-6 text-center"
                >
                  {badgeEarned ? (
                    <>
                      <div className="flex justify-center">
                        <div className="relative">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                          >
                            <Award className="w-24 h-24 text-yellow-500" />
                          </motion.div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, rotate: 360 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <span className="text-4xl">{moduleData.badgeIcon}</span>
                          </motion.div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-primary">Congratulations!</h3>
                        <p className="text-lg">You earned: {moduleData.badgeName}</p>
                        <Badge variant="secondary" className="text-lg px-4 py-1">
                          Score: {quizScore}%
                        </Badge>
                      </div>

                      <p className="text-muted-foreground">
                        You've mastered {moduleData.skillFocus} with {mentorName}.
                        This badge is now visible on your profile!
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">Quiz Complete</h3>
                        <Badge variant="outline" className="text-lg px-4 py-1">
                          Score: {quizScore}%
                        </Badge>
                      </div>

                      <p className="text-muted-foreground">
                        You need 70% or higher to earn the {moduleData.badgeName}.
                        Keep learning with {mentorName} and try again!
                      </p>
                    </>
                  )}

                  <div className="flex gap-3">
                    <Button onClick={onClose} variant="outline" className="flex-1">
                      Close
                    </Button>
                    <Button onClick={onComplete} className="flex-1">
                      Continue Chatting
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
