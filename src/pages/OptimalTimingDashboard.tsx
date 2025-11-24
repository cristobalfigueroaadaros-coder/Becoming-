import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Zap, Target, TrendingUp, Brain, Heart, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TimingRecommendation {
  action_type: string;
  optimal_time: string;
  emotional_guidance: string;
  practical_guidance: string;
  energetic_guidance: string;
  confidence: string;
  avg_energy: number;
  avg_coherence: number;
}

export default function OptimalTimingDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [correlations, setCorrelations] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<TimingRecommendation[]>([]);
  const [currentHour] = useState(new Date().getHours());

  useEffect(() => {
    loadCorrelations();
  }, []);

  const loadCorrelations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("analyze-optimal-timing");

      if (error) throw error;

      setCorrelations(data.correlations);
      setRecommendations(data.correlations.recommendations || []);
    } catch (error: any) {
      console.error("Error loading correlations:", error);
      toast({
        title: "Error loading optimal timing",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center">
          <Clock className="w-16 h-16 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing your optimal timing patterns...</p>
        </div>
      </div>
    );
  }

  if (!correlations || correlations.total_tasks + correlations.total_challenges < 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-8">
        <div className="container max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card className="p-12 text-center">
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Not Enough Data Yet</h2>
            <p className="text-muted-foreground mb-6">
              Complete more tasks and daily challenges to unlock optimal timing insights.
              We need at least 5 completed actions with energetic data.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const optimalWindowsData = correlations.optimalWindows.map((w: any) => ({
    hour: w.hour,
    time: w.time_label,
    Energy: parseFloat(w.avg_energy),
    Clarity: parseFloat(w.avg_clarity),
    Coherence: parseFloat(w.avg_coherence),
    Expansion: parseFloat(w.avg_expansion),
  }));

  const actionTypeIcons: Record<string, any> = {
    creative_work: Brain,
    shadow_work: Heart,
    strategic_planning: Target,
    physical_tasks: Zap,
    social_interaction: Sparkles,
    learning: TrendingUp,
  };

  const confidenceColors = {
    high: "border-primary bg-primary/5",
    medium: "border-accent bg-accent/5",
    low: "border-muted bg-muted/5",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container max-w-7xl mx-auto p-4 md:p-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Optimal Timing Intelligence
          </h1>
          <p className="text-muted-foreground">
            AI-powered insights on when to take action based on your energetic patterns
          </p>
        </div>

        {/* Current Time Indicator */}
        <Card className="mb-8 border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Clock className="w-12 h-12 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Current Time</p>
                <p className="text-2xl font-bold">{currentHour}:00 - {currentHour + 1}:00</p>
              </div>
              {correlations.optimalWindows.find((w: any) => w.hour === currentHour) && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">This is an optimal window!</p>
                  <p className="text-lg font-semibold text-primary">Great time for action</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tasks Analyzed</p>
                  <p className="text-3xl font-bold text-primary">{correlations.total_tasks}</p>
                </div>
                <Target className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-accent/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Challenges</p>
                  <p className="text-3xl font-bold text-accent">{correlations.total_challenges}</p>
                </div>
                <Zap className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">High Energy %</p>
                  <p className="text-3xl font-bold text-secondary">
                    {correlations.energeticCorrelation.high_energy_percentage}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-muted">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Flow State %</p>
                  <p className="text-3xl font-bold">
                    {correlations.energeticCorrelation.flow_state_percentage}%
                  </p>
                </div>
                <Sparkles className="w-8 h-8" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Optimal Windows Chart */}
        <Card className="p-6 bg-card/50 backdrop-blur mb-8">
          <h3 className="text-xl font-semibold mb-4">Your Peak Performance Windows</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={optimalWindowsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                domain={[0, 10]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="Energy" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="Clarity" stroke="hsl(var(--accent))" strokeWidth={2} />
              <Line type="monotone" dataKey="Coherence" stroke="hsl(var(--secondary))" strokeWidth={2} />
              <Line type="monotone" dataKey="Expansion" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* AI Recommendations */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Timing Recommendations by Action Type
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recommendations.map((rec, idx) => {
              const Icon = actionTypeIcons[rec.action_type] || Clock;
              return (
                <Card 
                  key={idx} 
                  className={`bg-card/50 backdrop-blur border-2 ${confidenceColors[rec.confidence as keyof typeof confidenceColors]}`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span className="capitalize">{rec.action_type.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="text-sm font-normal text-muted-foreground">
                        {rec.optimal_time}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{rec.avg_energy.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Energy</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-accent">{rec.avg_coherence.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Coherence</p>
                      </div>
                      <div className="flex-1 text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rec.confidence === "high" ? "bg-primary/20 text-primary" :
                          rec.confidence === "medium" ? "bg-accent/20 text-accent" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {rec.confidence} confidence
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-primary flex items-center gap-2 mb-1">
                        <Heart className="w-4 h-4" />
                        Emotional
                      </p>
                      <p className="text-sm text-muted-foreground">{rec.emotional_guidance}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-accent flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4" />
                        Practical
                      </p>
                      <p className="text-sm text-muted-foreground">{rec.practical_guidance}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-secondary flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4" />
                        Energetic
                      </p>
                      <p className="text-sm text-muted-foreground">{rec.energetic_guidance}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Reference Guide */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border-primary/20">
          <h3 className="text-xl font-semibold mb-4">Quick Reference: Your Best Times</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Top Task Completion Hours</p>
              <ul className="space-y-2">
                {correlations.taskPatterns.top_completion_hours.map((h: any, idx: number) => (
                  <li key={idx} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      {h.hour}:00 - {h.hour + 1}:00
                    </span>
                    <span className="text-muted-foreground">
                      {h.completions} tasks • Energy: {h.avgEnergy}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Top Challenge Completion Hours</p>
              <ul className="space-y-2">
                {correlations.challengePatterns.top_completion_hours.map((h: any, idx: number) => (
                  <li key={idx} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent" />
                      {h.hour}:00 - {h.hour + 1}:00
                    </span>
                    <span className="text-muted-foreground">
                      {h.completions} challenges • Energy: {h.avgEnergy}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
