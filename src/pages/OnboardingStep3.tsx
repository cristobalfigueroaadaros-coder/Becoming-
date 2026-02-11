import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";

// Branch-aligned questions based on entry_state
const branchQuestions: Record<string, { direction: string; friction: string }> = {
  discover_purpose: {
    direction: "What have you spent years learning or doing?",
    friction: "What kinds of problems or themes keep showing up in your life?",
  },
  grow_purpose: {
    direction: "What is the current idea or direction you're exploring?",
    friction: "What feels unclear, underdeveloped, or blocked about it?",
  },
  already_working: {
    direction: "What stage are you in? (idea, MVP, live, revenue)",
    friction: "What is currently blocking or missing?",
  },
};

export default function OnboardingStep3() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userFocus, setUserFocus] = useState<string | null>(null);
  const [directionAnswer, setDirectionAnswer] = useState("");
  const [frictionAnswer, setFrictionAnswer] = useState("");

  useEffect(() => {
    const focus = localStorage.getItem("onboarding_focus");
    setUserFocus(focus);
  }, []);

  const questions = userFocus ? branchQuestions[userFocus] : branchQuestions.discover_purpose;

  const handleSubmit = async () => {
    if (!directionAnswer.trim() || !frictionAnswer.trim()) {
      toast.error("Please answer both questions");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Determine entry_state tag for metadata
        const entryStateMap: Record<string, string> = {
          discover_purpose: "DISCOVER",
          grow_purpose: "GROW",
          already_working: "BUILD",
        };
        const entryState = userFocus ? entryStateMap[userFocus] || "DISCOVER" : "DISCOVER";

        await supabase.from("insight_dots").insert({
          user_id: user.id,
          source_type: "onboarding",
          core_theme: "present_moment_orientation",
          insight_text: `Direction: ${directionAnswer}\n\nFriction: ${frictionAnswer}`,
          emotional_tone: "reflective",
          skill_tags: ["onboarding", "self-awareness", entryState.toLowerCase(), "direction", "friction"]
        });
      }

      toast.success("Answers saved!");
      navigate("/onboarding/step4");
    } catch (error: any) {
      console.error("Failed to save (non-blocking):", error);
      // Navigate even if save fails
      navigate("/onboarding/step4");
    } finally {
      setLoading(false);
    }
  };

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
          onClick={handleSubmit}
          disabled={!directionAnswer.trim() || !frictionAnswer.trim() || loading}
          className="w-full h-12 text-lg"
        >
          {loading ? "Saving..." : "Continue →"}
        </Button>
      </div>
    </div>
  );
}
