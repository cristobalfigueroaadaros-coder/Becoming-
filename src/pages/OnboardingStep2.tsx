import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Target, TrendingUp, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const options = [
  {
    id: "discover_purpose",
    title: "Discover",
    description: "I want to discover my meaning or direction. I'm exploring and need help connecting the dots.",
    icon: Target,
    color: "bg-primary",
    entryState: "DISCOVER",
  },
  {
    id: "grow_purpose",
    title: "Grow",
    description: "I have a sense of my direction and want to develop it. I need clarity, refinement, or expansion.",
    icon: TrendingUp,
    color: "bg-mentor-quantum",
    entryState: "GROW",
  },
  {
    id: "already_working",
    title: "Build",
    description: "I already have a project or business. I want to move it forward and reach the next stage.",
    icon: Rocket,
    color: "bg-mentor-mamba",
    entryState: "BUILD",
  },
];

const OnboardingStep2 = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleContinue = async () => {
    if (!selectedOption) {
      toast.error("Please select an option");
      return;
    }

    const selected = options.find(o => o.id === selectedOption);
    if (!selected) return;

    setSaving(true);
    try {
      localStorage.setItem("onboarding_focus", selectedOption);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ entry_state: selected.entryState } as any)
          .eq("id", user.id);
      }

      navigate("/onboarding/step4");
    } catch (error) {
      console.error("Failed to save entry state:", error);
      navigate("/onboarding/step4");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">What brings you here right now?</h1>
          <p className="text-muted-foreground text-lg">
            Choose what resonates most. There's no right answer.
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
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", option.color)}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{option.title}</CardTitle>
                    <CardDescription className="mt-1">{option.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selectedOption || saving}
          className="w-full h-12 text-lg"
        >
          {saving ? "Saving..." : "Continue →"}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingStep2;
