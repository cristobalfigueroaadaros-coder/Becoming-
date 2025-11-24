import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Lightbulb, Link2, Target, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const DotConnectionEngine = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-dot-connections", {
        body: { autoSave: false }
      });

      if (error) throw error;
      
      if (data.error) {
        toast.info(data.message || data.error);
        return;
      }

      setAnalysis(data.analysis);
      toast.success("✨ Connections revealed!");
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Failed to analyze dots");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Button>
          <Button
            onClick={runAnalysis}
            disabled={loading}
            size="lg"
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Run Analysis
              </>
            )}
          </Button>
        </div>

        {/* Hero Section */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Dot-Connection Engine
            </CardTitle>
            <CardDescription className="text-base">
              Reveal patterns, connections, and creation ideas from your constellation of insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your dots contain hidden patterns and connections that reveal your unique genius. 
              This engine analyzes your insights across all sources—council meetings, challenges, 
              reflections, and growth—to show you what only YOU can create.
            </p>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Overview */}
            {analysis.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary">{analysis.stats.totalDots}</div>
                    <div className="text-xs text-muted-foreground">Total Dots</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-accent">{analysis.stats.themeCount}</div>
                    <div className="text-xs text-muted-foreground">Themes</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary">{analysis.patterns?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Patterns</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-accent">{analysis.connections?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Connections</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Emerging Genius */}
            {analysis.emergingGenius && (
              <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Your Emerging Genius
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed font-medium">
                    {analysis.emergingGenius}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Patterns */}
            {analysis.patterns && analysis.patterns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Recurring Patterns
                  </CardTitle>
                  <CardDescription>
                    These themes keep appearing across your journey
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.patterns.map((pattern: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-base">{pattern.name}</h4>
                        <Badge variant="secondary">{pattern.dotCount} dots</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{pattern.description}</p>
                      {pattern.themes && pattern.themes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {pattern.themes.map((theme: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Connections */}
            {analysis.connections && analysis.connections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-primary" />
                    Dot Connections
                  </CardTitle>
                  <CardDescription>
                    Meaningful connections that reveal new insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.connections.map((connection: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className="text-xs capitalize">{connection.type}</Badge>
                        {connection.dotIds && (
                          <span className="text-xs text-muted-foreground">
                            {connection.dotIds.length} dots
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed">{connection.insight}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Creation Ideas */}
            {analysis.creationIdeas && analysis.creationIdeas.length > 0 && (
              <Card className="border-2 border-accent/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Lightbulb className="w-6 h-6 text-accent" />
                    Creation Ideas
                  </CardTitle>
                  <CardDescription>
                    What you could create from your unique constellation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {analysis.creationIdeas.map((idea: any, idx: number) => (
                    <div key={idx} className="p-5 rounded-lg bg-gradient-to-br from-accent/5 to-primary/5 border-2 border-accent/20 space-y-3">
                      <h3 className="text-lg font-bold">{idea.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {idea.description}
                      </p>
                      {idea.dotConnections && idea.dotConnections.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {idea.dotConnections.map((conn: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {conn}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="pt-3 border-t border-border/30 space-y-2">
                        <div className="flex items-start gap-2">
                          <Target className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                              First Step
                            </p>
                            <p className="text-sm">{idea.firstStep}</p>
                          </div>
                        </div>
                        {idea.impact && (
                          <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                                Potential Impact
                              </p>
                              <p className="text-sm">{idea.impact}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            {analysis.nextSteps && analysis.nextSteps.length > 0 && (
              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Next Steps
                  </CardTitle>
                  <CardDescription>
                    Immediate actions to explore your genius
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.nextSteps.map((step: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span className="flex-1">{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate("/future-self/constellation")}
                className="flex-1"
                size="lg"
              >
                View Full Constellation
              </Button>
              <Button 
                onClick={() => navigate("/council-meeting")}
                variant="outline"
                className="flex-1"
              >
                Discuss with Council
              </Button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!analysis && !loading && (
          <Card className="border-dashed border-2">
            <CardContent className="pt-12 pb-12 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Ready to Reveal Your Genius?</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Click "Run Analysis" to discover the hidden patterns and connections 
                  in your constellation of insights. The engine will show you what only 
                  you can create.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DotConnectionEngine;
