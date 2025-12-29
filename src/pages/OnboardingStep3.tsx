import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Activity, Briefcase, DollarSign, Heart, Users, Lightbulb, Star, MessageCircle } from "lucide-react";

// PDR Adaptive Questions based on Step 2 selection
const adaptiveQuestions: Record<string, { direction: string; friction: string }> = {
  discover_purpose: {
    direction: "What are you feeling drawn toward lately, even if it's vague or hard to explain?",
    friction: "What makes it hard to see or trust that direction right now?",
  },
  grow_purpose: {
    direction: "How would you describe your purpose right now, in your own words?",
    friction: "What feels hardest or most unclear about growing it?",
  },
  already_working: {
    direction: "What are you currently working on?",
    friction: "Where do you feel most stuck, uncertain, or slowed down with it?",
  },
  stuck_unclear: {
    direction: "What's been taking up most of your mental or emotional space lately?",
    friction: "What feels most heavy or frustrating about your situation right now?",
  },
  dont_know: {
    direction: "What made you open the app today?",
    friction: "What do you feel unsure or hesitant about right now?",
  },
};

const lifeDomains = [
  {
    name: "Health & Energy",
    icon: Activity,
    description: "Physical vitality and well-being"
  },
  {
    name: "Career & Impact",
    icon: Briefcase,
    description: "Professional growth and contribution"
  },
  {
    name: "Money & Finances",
    icon: DollarSign,
    description: "Financial security and abundance"
  },
  {
    name: "Relationships & Love",
    icon: Heart,
    description: "Intimate connections and romance"
  },
  {
    name: "Friends & Community",
    icon: Users,
    description: "Social bonds and belonging"
  },
  {
    name: "Creativity & Personal Growth",
    icon: Lightbulb,
    description: "Self-expression and learning"
  }
];

export default function OnboardingStep3() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userFocus, setUserFocus] = useState<string | null>(null);
  const [phase, setPhase] = useState<"questions" | "domains">("questions");
  
  // Adaptive questions state
  const [directionAnswer, setDirectionAnswer] = useState("");
  const [frictionAnswer, setFrictionAnswer] = useState("");

  // Life domains state
  const [domainScores, setDomainScores] = useState<Record<string, { current: number; future: number }>>({
    "Health & Energy": { current: 5, future: 10 },
    "Career & Impact": { current: 5, future: 10 },
    "Money & Finances": { current: 5, future: 10 },
    "Relationships & Love": { current: 5, future: 10 },
    "Friends & Community": { current: 5, future: 10 },
    "Creativity & Personal Growth": { current: 5, future: 10 }
  });

  useEffect(() => {
    const focus = localStorage.getItem("onboarding_focus");
    setUserFocus(focus);
  }, []);

  const questions = userFocus ? adaptiveQuestions[userFocus] : adaptiveQuestions.dont_know;

  const updateScore = (domain: string, type: 'current' | 'future', value: number) => {
    setDomainScores(prev => ({
      ...prev,
      [domain]: {
        ...prev[domain],
        [type]: value
      }
    }));
  };

  const handleQuestionsSubmit = async () => {
    if (!directionAnswer.trim() || !frictionAnswer.trim()) {
      toast.error("Please answer both questions");
      return;
    }

    // Save answers as insight dots for system intelligence
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("insight_dots").insert({
          user_id: user.id,
          source_type: "onboarding",
          core_theme: "present_moment_orientation",
          insight_text: `Direction: ${directionAnswer}\n\nFriction: ${frictionAnswer}`,
          emotional_tone: "reflective",
          skill_tags: ["onboarding", "self-awareness", "direction", "friction"]
        });
      }
    } catch (error) {
      console.error("Failed to save insight (non-blocking):", error);
    }

    // Move to life domains phase
    setPhase("domains");
  };

  const handleDomainsSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const domainData = Object.entries(domainScores).map(([domain, scores]) => ({
        user_id: user.id,
        domain_name: domain,
        current_score: scores.current,
        future_score: scores.future
      }));

      const { error } = await supabase.from("life_domains").insert(domainData);
      if (error) throw error;

      toast.success("Life areas mapped!");
      navigate("/onboarding/step4");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Phase 1: Adaptive Clarifying Questions
  if (phase === "questions") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <MessageCircle className="w-12 h-12 mx-auto text-primary" />
            <h1 className="text-4xl font-bold">A Few Quick Questions</h1>
            <p className="text-muted-foreground text-lg">
              Help us understand where you are right now
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  {questions.direction}
                </Label>
                <Textarea
                  placeholder="Share what comes to mind..."
                  value={directionAnswer}
                  onChange={(e) => setDirectionAnswer(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">
                  {questions.friction}
                </Label>
                <Textarea
                  placeholder="Be honest with yourself..."
                  value={frictionAnswer}
                  onChange={(e) => setFrictionAnswer(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleQuestionsSubmit}
            disabled={!directionAnswer.trim() || !frictionAnswer.trim()}
            className="w-full h-12 text-lg"
          >
            Continue →
          </Button>
        </div>
      </div>
    );
  }

  // Phase 2: Life Domains
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-mentor-future/5 p-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Your Life Areas</h1>
          <p className="text-muted-foreground text-lg">
            Quick check-in: Where are you today? Where do you want to be?
          </p>
        </div>

        <div className="grid gap-6">
          {lifeDomains.map((domain) => {
            const Icon = domain.icon;
            const scores = domainScores[domain.name];

            return (
              <Card 
                key={domain.name} 
                className="border-2 transition-all hover:border-primary/50"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-primary" />
                    {domain.name}
                  </CardTitle>
                  <CardDescription>{domain.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Where are you today?</Label>
                      <span className="text-xl font-bold text-primary">{scores.current}</span>
                    </div>
                    <Slider
                      value={[scores.current]}
                      onValueChange={([value]) => updateScore(domain.name, 'current', value)}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Where do you want to be?</Label>
                      <span className="text-xl font-bold text-mentor-future">{scores.future}</span>
                    </div>
                    <Slider
                      value={[scores.future]}
                      onValueChange={([value]) => updateScore(domain.name, 'future', value)}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full [&_[role=slider]]:border-mentor-future [&>span>span]:bg-mentor-future"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setPhase("questions")}
            className="h-12"
          >
            ← Back
          </Button>
          <Button
            onClick={handleDomainsSubmit}
            disabled={loading}
            className="flex-1 h-12 text-lg"
          >
            {loading ? "Saving..." : "Continue →"}
          </Button>
        </div>
      </div>
    </div>
  );
}
