import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Target, TrendingUp, Rocket, CloudFog, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// PDR-aligned options
const options = [
  {
    id: "discover_purpose",
    title: "I want to discover my purpose",
    icon: Target,
    color: "bg-primary",
  },
  {
    id: "grow_purpose",
    title: "I have a sense of my purpose and want to grow it",
    icon: TrendingUp,
    color: "bg-mentor-quantum",
  },
  {
    id: "already_working",
    title: "I have something I'm already working on",
    icon: Rocket,
    color: "bg-mentor-mamba",
  },
  {
    id: "stuck_unclear",
    title: "I feel stuck and unclear",
    icon: CloudFog,
    color: "bg-mentor-sage",
  },
  {
    id: "dont_know",
    title: "I don't know yet",
    icon: HelpCircle,
    color: "bg-muted-foreground",
  }
];

const OnboardingStep2 = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleContinue = () => {
    if (!selectedOption) {
      toast.error("Please select an option");
      return;
    }
    
    // Store selection for Step 3 (adaptive questions) and Step 4 (mentor suggestions)
    localStorage.setItem("onboarding_focus", selectedOption);
    
    navigate("/onboarding/step3");
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
      </div>
    </div>
  );
};

export default OnboardingStep2;
