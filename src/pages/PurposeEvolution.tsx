import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PurposeEntry {
  id: string;
  purpose_text: string;
  created_at: string;
}

interface EvolutionInsights {
  overallGrowth: string;
  keyThemes: string[];
  transformationStage: string;
  continuityScore: number;
  nextSteps: string[];
}

export default function PurposeEvolution() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [purposeHistory, setPurposeHistory] = useState<PurposeEntry[]>([]);
  const [currentPurpose, setCurrentPurpose] = useState<string>("");
  const [insights, setInsights] = useState<EvolutionInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzingInsights, setAnalyzingInsights] = useState(false);

  useEffect(() => {
    loadPurposeEvolution();
  }, []);

  const loadPurposeEvolution = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get purpose history
      const { data: history, error: historyError } = await supabase
        .from("purpose_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (historyError) throw historyError;

      // Get current purpose from profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("main_mission")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      setPurposeHistory(history || []);
      setCurrentPurpose(profile?.main_mission || "");

      // Auto-analyze if there's history
      if (history && history.length > 0) {
        analyzeEvolution(history, profile?.main_mission);
      }
    } catch (error) {
      console.error("Error loading purpose evolution:", error);
      toast({
        title: "Error",
        description: "Failed to load purpose evolution",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeEvolution = async (history: PurposeEntry[], current: string) => {
    setAnalyzingInsights(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke("analyze-purpose-evolution", {
        body: { purposeHistory: history, currentPurpose: current },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      setInsights(response.data.insights);
    } catch (error) {
      console.error("Error analyzing evolution:", error);
    } finally {
      setAnalyzingInsights(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Purpose Evolution
          </h1>
          <p className="text-muted-foreground">
            Track how your purpose has transformed over time
          </p>
        </div>

        {/* Current Purpose */}
        {currentPurpose && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Your Current Purpose
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium text-foreground">{currentPurpose}</p>
            </CardContent>
          </Card>
        )}

        {/* AI Insights */}
        {analyzingInsights ? (
          <Card className="mb-8">
            <CardContent className="py-8 flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing your purpose evolution...</p>
            </CardContent>
          </Card>
        ) : insights ? (
          <Card className="mb-8 border-accent/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Evolution Insights
              </CardTitle>
              <CardDescription>AI-powered analysis of your purpose journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Overall Growth</h3>
                <p className="text-muted-foreground">{insights.overallGrowth}</p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-foreground mb-2">Transformation Stage</h3>
                <Badge variant="secondary" className="text-sm">
                  {insights.transformationStage}
                </Badge>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-foreground mb-3">Key Themes</h3>
                <div className="flex flex-wrap gap-2">
                  {insights.keyThemes.map((theme, idx) => (
                    <Badge key={idx} variant="outline">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-foreground mb-2">Continuity Score</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-secondary rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-500"
                      style={{ width: `${insights.continuityScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {insights.continuityScore}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  How consistent your core themes remain
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-foreground mb-3">Next Steps</h3>
                <ul className="space-y-2">
                  {insights.nextSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Purpose Timeline</CardTitle>
            <CardDescription>
              {purposeHistory.length === 0
                ? "Your purpose journey will appear here as it evolves"
                : `${purposeHistory.length} milestone${purposeHistory.length > 1 ? "s" : ""} in your journey`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {purposeHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No purpose history yet.</p>
                <p className="text-sm mt-2">Complete the purpose discovery flow to begin.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {purposeHistory.map((entry, index) => (
                  <div key={entry.id} className="relative pl-8 pb-6 last:pb-0">
                    {/* Timeline line */}
                    {index < purposeHistory.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border" />
                    )}
                    
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-primary-foreground" />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(entry.created_at), "MMM dd, yyyy")}
                        </span>
                        {index === purposeHistory.length - 1 && (
                          <Badge variant="secondary" className="text-xs">Latest</Badge>
                        )}
                      </div>
                      <p className="text-foreground font-medium leading-relaxed">
                        {entry.purpose_text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
