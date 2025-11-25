import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Activity, Briefcase, DollarSign, Heart, Users, Lightbulb, Star } from "lucide-react";

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

  useEffect(() => {
    const focus = localStorage.getItem("onboarding_focus");
    setUserFocus(focus);
  }, []);

  const [domainScores, setDomainScores] = useState<Record<string, { current: number; future: number }>>({
    "Health & Energy": { current: 5, future: 10 },
    "Career & Impact": { current: 5, future: 10 },
    "Money & Finances": { current: 5, future: 10 },
    "Relationships & Love": { current: 5, future: 10 },
    "Friends & Community": { current: 5, future: 10 },
    "Creativity & Personal Growth": { current: 5, future: 10 }
  });

  const updateScore = (domain: string, type: 'current' | 'future', value: number) => {
    setDomainScores(prev => ({
      ...prev,
      [domain]: {
        ...prev[domain],
        [type]: value
      }
    }));
  };

  const handleSubmit = async () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-mentor-future/5 p-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Your Life Areas</h1>
          <p className="text-muted-foreground text-lg">
            Quick check-in: Where are you today? Where do you want to be?
          </p>
          {userFocus === "financial_life" && (
            <div className="mt-4 p-4 bg-mentor-creative/10 border-2 border-mentor-creative rounded-lg">
              <p className="text-sm text-mentor-creative font-medium">
                💰 We've highlighted Money & Finances based on your focus. Rate all areas to get the full picture!
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-6">
          {lifeDomains.map((domain) => {
            const Icon = domain.icon;
            const scores = domainScores[domain.name];
            const isFinancialFocus = userFocus === "financial_life" && domain.name === "Money & Finances";

            return (
              <Card 
                key={domain.name} 
                className={`border-2 transition-all ${
                  isFinancialFocus 
                    ? "border-mentor-creative shadow-lg ring-2 ring-mentor-creative/50" 
                    : "hover:border-primary/50"
                }`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${isFinancialFocus ? "text-mentor-creative" : "text-primary"}`} />
                    {domain.name}
                    {isFinancialFocus && (
                      <Badge className="ml-auto bg-mentor-creative hover:bg-mentor-creative">
                        <Star className="w-3 h-3 mr-1" />
                        Your Focus
                      </Badge>
                    )}
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

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-12 text-lg"
        >
          {loading ? "Saving..." : "Continue →"}
        </Button>
      </div>
    </div>
  );
}
