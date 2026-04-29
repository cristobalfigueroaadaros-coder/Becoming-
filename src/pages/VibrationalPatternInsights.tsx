/**
 * ❗ CONSCIOUSNESS TRACKING RULES
 * 
 * 1. NEVER display consciousness meters, scores, levels, or numeric progression
 * 2. NEVER show graphs/charts of spiritual/energetic states
 * 3. Consciousness is expressed ONLY through mentor voice, reflections, and task design
 * 4. Frequency references are SYMBOLIC METAPHORS, not metrics
 * 5. The arc is FELT, not displayed
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Sparkles, Zap, Sun, Wind, Feather, Activity } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
          <p className="text-muted-foreground">Reading your patterns...</p>
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
              Capture more moments to unlock pattern insights.
              We need at least 3 snapshots to notice meaningful patterns.
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

  // Extract qualitative patterns without showing numbers
  const peakActivities = summary.peakConditions?.common_peak_activities?.slice(0, 3) || [];
  const peakEmotions = summary.peakConditions?.common_peak_emotions?.slice(0, 3) || [];
  const topActivities = summary.activityResonance?.top_resonance_activities?.slice(0, 3) || [];
  const topEmotions = summary.emotionalSignatures?.top_emotional_states?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container max-w-4xl mx-auto p-4 md:p-8">
        <Button variant="ghost" onClick={() => navigate("/energetic-dashboard")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Inner Weather
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Your Patterns
          </h1>
          <p className="text-muted-foreground">
            Insights from your journey — no scores, just wisdom
          </p>
        </div>

        {/* AI-Generated Insights - The Main Focus */}
        {aiInsights.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              What Your Patterns Reveal
            </h2>
            <div className="space-y-4">
              {aiInsights.map((insight, idx) => (
                <Card key={idx} className={`bg-card/50 backdrop-blur ${priorityColors[insight.priority]} border-2`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{insight.title}</span>
                      {insight.priority === "high" && (
                        <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary">
                          Key Insight
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Heart className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-primary mb-1">Emotional</p>
                        <p className="text-sm text-muted-foreground">{insight.emotional}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Activity className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-accent mb-1">Practical</p>
                        <p className="text-sm text-muted-foreground">{insight.practical}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-secondary mb-1">Energetic</p>
                        <p className="text-sm text-muted-foreground">{insight.energetic}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Qualitative Pattern Cards - No Numbers */}
        <div className="grid gap-4 mb-8">
          {/* What Expands You */}
          {topActivities.length > 0 && (
            <Card className="bg-gradient-to-br from-primary/10 to-card/50 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Sun className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Activities That Expand You</h3>
                    <div className="flex flex-wrap gap-2">
                      {topActivities.map((activity: any, idx: number) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 rounded-full bg-primary/20 text-sm"
                        >
                          {activity.activity}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 italic">
                      These activities consistently bring you into alignment. Prioritize them.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emotional Landscape */}
          {topEmotions.length > 0 && (
            <Card className="bg-card/50 backdrop-blur border-accent/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Heart className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Your Emotional Signature</h3>
                    <div className="flex flex-wrap gap-2">
                      {topEmotions.map((emotion: any, idx: number) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 rounded-full bg-accent/20 text-sm"
                        >
                          {emotion.emotion}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 italic">
                      These emotions show up most in your journey. Each carries wisdom.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Flow Conditions */}
          {summary.flowStatePatterns?.total_flow_states > 0 && (
            <Card className="bg-card/50 backdrop-blur border-secondary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                    <Wind className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">When Flow Happens</h3>
                    {summary.flowStatePatterns.flow_activities?.length > 0 ? (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {summary.flowStatePatterns.flow_activities.slice(0, 3).map((activity: string, idx: number) => (
                            <span 
                              key={idx}
                              className="px-3 py-1 rounded-full bg-secondary/20 text-sm"
                            >
                              {activity}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-3 italic">
                          Flow finds you in these moments. Create more space for them.
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        You've touched flow states. Keep noticing when they happen.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Peak Conditions Summary */}
        {(peakActivities.length > 0 || peakEmotions.length > 0) && (
          <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border-primary/20">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Your Expansion Blueprint</h3>
                <p className="text-sm text-muted-foreground">
                  These conditions help you feel most alive and aligned
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {peakActivities.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-3">Activities</p>
                  <ul className="space-y-2">
                    {peakActivities.map((a: any, idx: number) => (
                      <li key={idx} className="text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        {a.pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {peakEmotions.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-3">Emotional States</p>
                  <ul className="space-y-2">
                    {peakEmotions.map((e: any, idx: number) => (
                      <li key={idx} className="text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent" />
                        {e.pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-card/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Feather className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground italic">
                  This isn't about optimizing your life. It's about noticing what naturally 
                  brings you into alignment, so you can create more space for it.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
