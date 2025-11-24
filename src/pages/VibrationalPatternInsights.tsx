import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Clock, Activity, Heart, Sparkles, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface PatternInsight {
  title: string;
  emotional: string;
  practical: string;
  energetic: string;
  priority: "high" | "medium" | "low";
}

export default function VibrationalPatternInsights() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<PatternInsight[]>([]);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("analyze-vibrational-patterns");

      if (error) throw error;

      setInsights(data.insights);
      setAiInsights(data.insights.ai_insights || []);
    } catch (error: any) {
      console.error("Error loading insights:", error);
      toast({
        title: "Error loading insights",
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
          <Sparkles className="w-16 h-16 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing your vibrational patterns...</p>
        </div>
      </div>
    );
  }

  if (!insights || insights.total_snapshots < 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-8">
        <div className="container max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/energetic-dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card className="p-12 text-center">
            <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Not Enough Data Yet</h2>
            <p className="text-muted-foreground mb-6">
              Capture more energetic moments to unlock pattern insights.
              We need at least 3 snapshots to detect meaningful patterns.
            </p>
            <Button onClick={() => navigate("/energetic-dashboard")}>
              Capture Moments
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const summary = insights.analysis_summary;
  const priorityColors = {
    high: "border-secondary",
    medium: "border-accent",
    low: "border-muted",
  };

  // Prepare chart data
  const peakHoursData = summary.timeBasedPatterns.peak_hours.map((h: any) => ({
    hour: `${h.hour}:00`,
    energy: parseFloat(h.avgEnergy),
  }));

  const activityData = summary.activityResonance.top_resonance_activities.map((a: any) => ({
    activity: a.activity.slice(0, 20),
    resonance: parseFloat(a.avgResonance),
  }));

  const emotionalData = summary.emotionalSignatures.top_emotional_states.slice(0, 5).map((e: any) => ({
    emotion: e.emotion,
    energy: parseFloat(e.avgEnergy),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container max-w-7xl mx-auto p-4 md:p-8">
        <Button variant="ghost" onClick={() => navigate("/energetic-dashboard")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Vibrational Pattern Insights
          </h1>
          <p className="text-muted-foreground">
            AI-powered analysis of {insights.total_snapshots} energetic moments
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Flow States</p>
                  <p className="text-3xl font-bold text-primary">{summary.flowStatePatterns.total_flow_states}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-accent/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Peak Hours</p>
                  <p className="text-3xl font-bold text-accent">{summary.timeBasedPatterns.total_hours_tracked}</p>
                </div>
                <Clock className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Activities</p>
                  <p className="text-3xl font-bold text-secondary">{summary.activityResonance.unique_activities}</p>
                </div>
                <Activity className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-muted">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Emotional States</p>
                  <p className="text-3xl font-bold">{summary.emotionalSignatures.unique_emotions}</p>
                </div>
                <Heart className="w-8 h-8" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI-Generated Insights */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Your Unique Pattern Insights
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {aiInsights.map((insight, idx) => (
              <Card key={idx} className={`bg-card/50 backdrop-blur ${priorityColors[insight.priority]} border-2`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{insight.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      insight.priority === "high" ? "bg-secondary/20 text-secondary" :
                      insight.priority === "medium" ? "bg-accent/20 text-accent" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {insight.priority}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-primary flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Emotional
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{insight.emotional}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-accent flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Practical
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{insight.practical}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-secondary flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Energetic
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{insight.energetic}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Peak Hours */}
          <Card className="p-6 bg-card/50 backdrop-blur">
            <h3 className="text-xl font-semibold mb-4">Your Peak Energy Hours</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 10]} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="energy" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Emotional Energy Map */}
          <Card className="p-6 bg-card/50 backdrop-blur">
            <h3 className="text-xl font-semibold mb-4">Emotional Energy Signature</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={emotionalData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="emotion" stroke="hsl(var(--muted-foreground))" />
                <PolarRadiusAxis domain={[0, 10]} stroke="hsl(var(--muted-foreground))" />
                <Radar name="Energy" dataKey="energy" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Activity Resonance */}
        <Card className="p-6 bg-card/50 backdrop-blur mb-6">
          <h3 className="text-xl font-semibold mb-4">Highest Resonance Activities</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 10]} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="activity" stroke="hsl(var(--muted-foreground))" width={150} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="resonance" fill="hsl(var(--secondary))" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Peak Conditions Summary */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border-primary/20">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Your Peak Performance Blueprint
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Common Peak Activities</p>
              <ul className="space-y-1">
                {summary.peakConditions.common_peak_activities.map((a: any, idx: number) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {a.pattern} ({a.count} times)
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Common Peak Emotions</p>
              <ul className="space-y-1">
                {summary.peakConditions.common_peak_emotions.map((e: any, idx: number) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    {e.pattern} ({e.count} times)
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-6 p-4 bg-card/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Avg Peak Energy:</strong> {summary.peakConditions.avg_peak_energy.toFixed(1)}/10 • 
              <strong className="ml-4">Avg Peak Coherence:</strong> {summary.peakConditions.avg_peak_coherence.toFixed(1)}/10
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
