import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Activity, Briefcase, Heart, Users, Lightbulb, Sparkles } from "lucide-react";

const lifeDomains = [
  {
    name: "Health & Energy",
    icon: Activity,
    description: "Physical vitality, fitness, and well-being"
  },
  {
    name: "Career & Impact",
    icon: Briefcase,
    description: "Professional growth and meaningful contribution"
  },
  {
    name: "Relationships & Love",
    icon: Heart,
    description: "Intimate connections and romantic fulfillment"
  },
  {
    name: "Friends & Community",
    icon: Users,
    description: "Social bonds and sense of belonging"
  },
  {
    name: "Creativity & Learning",
    icon: Lightbulb,
    description: "Personal growth and self-expression"
  },
  {
    name: "Spiritual Growth",
    icon: Sparkles,
    description: "Inner peace, purpose, and meaning"
  }
];

export default function OnboardingStep3() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [domainScores, setDomainScores] = useState<Record<string, { current: number; future: number }>>({
    "Health & Energy": { current: 5, future: 10 },
    "Career & Impact": { current: 5, future: 10 },
    "Relationships & Love": { current: 5, future: 10 },
    "Friends & Community": { current: 5, future: 10 },
    "Creativity & Learning": { current: 5, future: 10 },
    "Spiritual Growth": { current: 5, future: 10 }
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

      // Insert all domain assessments
      const domainData = Object.entries(domainScores).map(([domain, scores]) => ({
        user_id: user.id,
        domain_name: domain,
        current_score: scores.current,
        future_score: scores.future
      }));

      const { error } = await supabase
        .from("life_domains")
        .insert(domainData);

      if (error) throw error;

      toast({
        title: "Life domains assessed! 🎯",
        description: "Your journey map is ready. Let's begin your transformation."
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error saving life domains:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-mentor-future/5 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-mentor-future bg-clip-text text-transparent">
            Map Your Life Domains
          </h1>
          <p className="text-lg text-muted-foreground">
            For each domain, rate your current satisfaction and your vision for the future
          </p>
          <div className="flex items-center justify-center gap-8 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary/20 border-2 border-primary" />
              <span className="text-sm font-medium">Current State</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-mentor-future/20 border-2 border-mentor-future" />
              <span className="text-sm font-medium">Future Vision</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {lifeDomains.map((domain) => {
            const Icon = domain.icon;
            const scores = domainScores[domain.name];

            return (
              <Card key={domain.name} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-primary" />
                    {domain.name}
                  </CardTitle>
                  <CardDescription>{domain.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current State Section */}
                  <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <Label className="text-sm font-semibold text-primary">📍 Where You Are Today</Label>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Current satisfaction level</span>
                      <span className="text-2xl font-bold text-primary">{scores.current}</span>
                    </div>
                    <Slider
                      value={[scores.current]}
                      onValueChange={([value]) => updateScore(domain.name, 'current', value)}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>

                  {/* Future Vision Section */}
                  <div className="space-y-3 p-4 rounded-lg bg-mentor-future/5 border border-mentor-future/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-mentor-future" />
                      <Label className="text-sm font-semibold text-mentor-future">🎯 Where You Want To Be (10 Years)</Label>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Future vision level</span>
                      <span className="text-2xl font-bold text-mentor-future">{scores.future}</span>
                    </div>
                    <Slider
                      value={[scores.future]}
                      onValueChange={([value]) => updateScore(domain.name, 'future', value)}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full [&_[role=slider]]:border-mentor-future [&>span>span]:bg-mentor-future"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>

                  {/* Growth Indicator */}
                  <div className="flex items-center justify-between pt-2 px-2">
                    <span className="text-sm text-muted-foreground">Growth Potential:</span>
                    <span className="text-lg font-bold text-foreground bg-gradient-to-r from-primary to-mentor-future bg-clip-text text-transparent">
                      +{scores.future - scores.current} levels
                    </span>
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
          {loading ? "Creating your journey map..." : "Begin My Transformation 🚀"}
        </Button>
      </div>
    </div>
  );
}
