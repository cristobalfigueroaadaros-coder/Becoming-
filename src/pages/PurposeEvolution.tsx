import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Sparkles, Loader2, Check } from "lucide-react";
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

interface RefinedPurpose {
  statement: string;
  rationale: string;
  key_additions: string[];
  alignment_score: number;
}

interface PurposeRefinement {
  refined_purposes: RefinedPurpose[];
  growth_indicators: string[];
  integration_suggestions: string;
}

export default function PurposeEvolution() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [purposeHistory, setPurposeHistory] = useState<PurposeEntry[]>([]);
  const [currentPurpose, setCurrentPurpose] = useState<string>("");
  const [insights, setInsights] = useState<EvolutionInsights | null>(null);
  const [refinement, setRefinement] = useState<PurposeRefinement | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzingInsights, setAnalyzingInsights] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const refinePurpose = async () => {
    setIsRefining(true);
    try {
      const { data, error } = await supabase.functions.invoke('refine-purpose-from-constellation');

      if (error) throw error;

      setRefinement(data);
      toast({
        title: "Purpose refinement generated",
        description: "Review the AI-suggested evolutions of your purpose",
      });
    } catch (error: any) {
      console.error('Error refining purpose:', error);
      toast({
        title: "Error refining purpose",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRefining(false);
    }
  };

  const adoptPurpose = async (newPurpose: string) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save old purpose to history
      if (currentPurpose) {
        await supabase.from('purpose_history').insert({
          user_id: user.id,
          purpose_text: currentPurpose
        });
      }

      // Update current purpose
      const { error } = await supabase
        .from('profiles')
        .update({ main_mission: newPurpose })
        .eq('id', user.id);

      if (error) throw error;

      setCurrentPurpose(newPurpose);
      setRefinement(null);
      
      toast({
        title: "Purpose updated",
        description: "Your evolved purpose has been saved",
      });

      // Reload history
      loadPurposeEvolution();
    } catch (error: any) {
      console.error('Error adopting purpose:', error);
      toast({
        title: "Error saving purpose",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {purposeHistory.length >= 2 && (
            <Button onClick={refinePurpose} disabled={isRefining}>
              {isRefining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refining...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Refine from Constellation
                </>
              )}
            </Button>
          )}
        </div>

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

      {/* Purpose Refinement Suggestions */}
      {refinement && (
        <Card className="p-6 mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">AI-Refined Purpose Suggestions</h2>
          </div>
          
          {refinement.growth_indicators.length > 0 && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-2">Growth Indicators</h3>
              <ul className="space-y-1">
                {refinement.growth_indicators.map((indicator, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {indicator}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-6">
            {refinement.refined_purposes.map((refined, index) => (
              <Card key={index} className="p-4 border-border/50">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Option {index + 1}</h3>
                      <Badge variant="secondary">{refined.alignment_score}% aligned</Badge>
                    </div>
                    <p className="text-lg mb-2">{refined.statement}</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => adoptPurpose(refined.statement)}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        Adopt
                      </>
                    )}
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{refined.rationale}</p>
                
                {refined.key_additions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs font-medium text-muted-foreground mb-1">New Elements:</p>
                    <div className="flex flex-wrap gap-1">
                      {refined.key_additions.map((addition, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {addition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {refinement.integration_suggestions && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-medium mb-2">Integration Suggestions</h3>
              <p className="text-sm text-muted-foreground">{refinement.integration_suggestions}</p>
            </div>
          )}
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
