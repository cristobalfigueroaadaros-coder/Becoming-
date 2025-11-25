import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Target, TrendingUp, Trophy, HelpCircle, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const options = [
  {
    id: "discover_purpose",
    title: "I want to discover my purpose",
    icon: Target,
    color: "bg-primary",
    questions: [
      "What activities make you lose track of time?",
      "If money wasn't an issue, what would you spend your days doing?"
    ]
  },
  {
    id: "grow_purpose",
    title: "I have a purpose and want to grow from it",
    icon: TrendingUp,
    color: "bg-mentor-quantum",
    questions: [
      "What's your current purpose in one sentence?",
      "What's the biggest challenge keeping you from living it fully?"
    ]
  },
  {
    id: "working_goal",
    title: "I have a goal I'm working toward",
    icon: Trophy,
    color: "bg-mentor-mamba",
    questions: [
      "What's your main goal right now?",
      "What's the next step you need to take?"
    ]
  },
  {
    id: "dont_know",
    title: "I don't know yet",
    icon: HelpCircle,
    color: "bg-mentor-sage",
    questions: [
      "What's something you'd like to improve in your life?",
      "What would success look like for you in 6 months?"
    ]
  },
  {
    id: "financial_life",
    title: "I want to improve my financial life",
    icon: DollarSign,
    color: "bg-mentor-creative",
    questions: [
      "What does financial freedom mean to you?",
      "What's one financial habit you'd like to build?"
    ]
  }
];

const OnboardingStep2 = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [answers, setAnswers] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);

  const selectedData = options.find(opt => opt.id === selectedOption);

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    setShowQuestions(false);
    setAnswers(["", ""]);
  };

  const handleContinue = () => {
    if (!selectedOption) {
      toast.error("Please select an option");
      return;
    }
    setShowQuestions(true);
  };

  const handleSubmit = async () => {
    if (answers.some(a => !a.trim())) {
      toast.error("Please answer both questions");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from("insight_dots").insert({
        user_id: user.id,
        source_type: "onboarding",
        core_theme: selectedData?.title || "Onboarding",
        insight_text: `Q1: ${selectedData?.questions[0]}\nA: ${answers[0]}\n\nQ2: ${selectedData?.questions[1]}\nA: ${answers[1]}`,
        emotional_tone: "curious",
        skill_tags: ["onboarding", "intentions"]
      });

      toast.success("Got it! Let's continue");
      navigate("/onboarding/step3");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {!showQuestions ? (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold">What brings you here today?</h1>
              <p className="text-muted-foreground text-lg">
                Choose what resonates most with where you are right now
              </p>
            </div>

            <div className="grid gap-4">
              {options.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedOption === option.id;

                return (
                  <Card
                    key={option.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg",
                      isSelected && "ring-2 ring-primary shadow-xl"
                    )}
                    onClick={() => handleOptionSelect(option.id)}
                  >
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", option.color)}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-xl">{option.title}</CardTitle>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            <Button
              onClick={handleContinue}
              disabled={!selectedOption}
              className="w-full h-12 text-lg"
            >
              Continue →
            </Button>
          </>
        ) : (
          <>
            <div className="text-center space-y-2">
              <div className={cn("w-16 h-16 mx-auto rounded-2xl flex items-center justify-center", selectedData?.color)}>
                {selectedData && <selectedData.icon className="w-8 h-8 text-white" />}
              </div>
              <h1 className="text-3xl font-bold">{selectedData?.title}</h1>
              <p className="text-muted-foreground">
                Just 2 quick questions to get started
              </p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    {selectedData?.questions[0]}
                  </Label>
                  <Input
                    placeholder="Your answer..."
                    value={answers[0]}
                    onChange={(e) => setAnswers([e.target.value, answers[1]])}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    {selectedData?.questions[1]}
                  </Label>
                  <Input
                    placeholder="Your answer..."
                    value={answers[1]}
                    onChange={(e) => setAnswers([answers[0], e.target.value])}
                    className="h-12"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowQuestions(false)}
                className="h-12"
              >
                ← Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 h-12 text-lg"
              >
                {loading ? "Saving..." : "Continue →"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OnboardingStep2;
