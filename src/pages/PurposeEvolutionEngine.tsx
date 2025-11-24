import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Target, TrendingUp, Lightbulb, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PurposeEvolution {
  evolved_purpose: string;
  key_insights: string[];
  alignment_evidence: string[];
  recommended_focus: string;
  integration_path: string;
  data_summary: {
    completed_tasks: number;
    energetic_snapshots: number;
    insight_dots: number;
    dot_connections: number;
  };
}

export default function PurposeEvolutionEngine() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [evolution, setEvolution] = useState<PurposeEvolution | null>(null);
  const [adopting, setAdopting] = useState(false);

  const analyzeEvolution = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('evolve-purpose');

      if (error) throw error;

      setEvolution(data);
      toast({
        title: "Purpose Evolution Complete",
        description: "AI has analyzed your patterns and generated insights.",
      });
    } catch (error) {
      console.error('Error analyzing purpose evolution:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze purpose evolution",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const adoptPurpose = async () => {
    if (!evolution?.evolved_purpose) return;

    setAdopting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current purpose to save to history
      const { data: profile } = await supabase
        .from('profiles')
        .select('main_mission')
        .eq('id', user.id)
        .single();

      // Save current purpose to history if it exists
      if (profile?.main_mission) {
        await supabase.from('purpose_history').insert({
          user_id: user.id,
          purpose_text: profile.main_mission
        });
      }

      // Update profile with new purpose
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ main_mission: evolution.evolved_purpose })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Purpose Evolved! 🌟",
        description: "Your purpose has been updated to reflect your growth.",
      });

      // Reload after a moment
      setTimeout(() => {
        analyzeEvolution();
      }, 1500);
    } catch (error) {
      console.error('Error adopting purpose:', error);
      toast({
        title: "Failed to Adopt Purpose",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setAdopting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Purpose Evolution Engine
          </h1>
          <p className="text-muted-foreground text-lg">
            AI-powered purpose refinement based on your lived experience
          </p>
        </div>

        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Analyze Your Evolution
            </CardTitle>
            <CardDescription>
              Evolve your purpose based on completed tasks, energetic patterns, and dot connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={analyzeEvolution}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Your Patterns...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Purpose Evolution
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {evolution && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Evolved Purpose Statement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg font-medium leading-relaxed">
                  {evolution.evolved_purpose}
                </p>
                <Button
                  onClick={adoptPurpose}
                  disabled={adopting}
                  className="gap-2"
                  size="lg"
                >
                  {adopting ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Adopting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Adopt This Purpose
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Key Insights from Your Journey
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {evolution.key_insights.map((insight, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-primary font-bold">→</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alignment Evidence</CardTitle>
                <CardDescription>
                  Patterns from your lived experience that support this evolution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {evolution.alignment_evidence.map((evidence, idx) => (
                    <li key={idx} className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{evidence}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Focus</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{evolution.recommended_focus}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Integration Path</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{evolution.integration_path}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-muted">
              <CardHeader>
                <CardTitle className="text-sm">Data Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{evolution.data_summary.completed_tasks}</div>
                    <div className="text-xs text-muted-foreground">Completed Tasks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{evolution.data_summary.energetic_snapshots}</div>
                    <div className="text-xs text-muted-foreground">Energy Patterns</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{evolution.data_summary.insight_dots}</div>
                    <div className="text-xs text-muted-foreground">Insight Dots</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{evolution.data_summary.dot_connections}</div>
                    <div className="text-xs text-muted-foreground">Connections</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
