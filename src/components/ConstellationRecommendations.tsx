import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Target, Lightbulb, ArrowRight, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConstellationRecommendation {
  title: string;
  description: string;
  related_pattern?: string;
  type: "challenge" | "focus" | "practice";
}

interface ConstellationSummary {
  dominant_themes?: string[];
  emerging_strengths?: string[];
  growth_direction?: string;
  priority_focus?: string;
}

interface ConstellationRecommendationsProps {
  summary?: ConstellationSummary;
  recommendations?: ConstellationRecommendation[];
  onActionClick?: (recommendation: ConstellationRecommendation) => void;
  compact?: boolean;
  className?: string;
}

export const ConstellationRecommendations = ({ 
  summary, 
  recommendations = [], 
  onActionClick,
  compact = false,
  className 
}: ConstellationRecommendationsProps) => {
  if (!summary && recommendations.length === 0) {
    return null;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "challenge": return Target;
      case "focus": return Brain;
      case "practice": return Lightbulb;
      default: return Sparkles;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "challenge": return "text-primary";
      case "focus": return "text-accent";
      case "practice": return "text-secondary";
      default: return "text-muted-foreground";
    }
  };

  if (compact) {
    return (
      <Card className={cn("border-primary/20 bg-gradient-to-br from-primary/5 to-transparent", className)}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Constellation Insights</h3>
                <Badge variant="secondary" className="text-xs">
                  AI-Powered
                </Badge>
              </div>
              {summary?.priority_focus && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Priority: </span>
                  {summary.priority_focus}
                </p>
              )}
              {recommendations.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3" />
                  <span>{recommendations.length} recommendations available</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Constellation Intelligence
                  <Badge variant="secondary" className="text-xs">
                    Live Insights
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Based on patterns across your journey
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Section */}
          {summary && (
            <div className="space-y-4">
              {summary.priority_focus && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-sm mb-1">Priority Focus</div>
                      <p className="text-sm text-muted-foreground">{summary.priority_focus}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {summary.dominant_themes && summary.dominant_themes.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Dominant Themes
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {summary.dominant_themes.map((theme, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {summary.emerging_strengths && summary.emerging_strengths.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Emerging Strengths
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {summary.emerging_strengths.map((strength, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {summary.growth_direction && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    Growth Direction
                  </div>
                  <p className="text-sm">{summary.growth_direction}</p>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Lightbulb className="w-4 h-4 text-accent" />
                Recommended Actions
              </div>
              <div className="space-y-2">
                {recommendations.map((rec, idx) => {
                  const Icon = getTypeIcon(rec.type);
                  const colorClass = getTypeColor(rec.type);
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group p-4 rounded-lg border border-border bg-card hover:bg-accent/5 hover:border-primary/30 transition-all cursor-pointer"
                      onClick={() => onActionClick?.(rec)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors", colorClass)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                                {rec.title}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {rec.description}
                              </p>
                              {rec.related_pattern && (
                                <div className="mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {rec.related_pattern}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
