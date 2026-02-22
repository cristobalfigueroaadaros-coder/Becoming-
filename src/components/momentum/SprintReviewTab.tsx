import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lightbulb, Trophy, AlertTriangle, Activity, Zap, Calendar, BookOpen, Brain } from "lucide-react";
import type { WeeklyData } from "@/hooks/useMomentumData";

interface SprintReviewTabProps {
  data: WeeklyData;
  systemInsight: string | null;
  insightLoading: boolean;
  onStartRitual: () => void;
}

function MomentumScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "text-accent" : score >= 40 ? "text-secondary" : "text-muted-foreground";
  const strokeColor = score >= 70 ? "stroke-accent" : score >= 40 ? "stroke-secondary" : "stroke-muted-foreground";
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            className={strokeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{score}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground font-medium">Momentum Score</p>
    </div>
  );
}

export function SprintReviewTab({ data, systemInsight, insightLoading, onStartRitual }: SprintReviewTabProps) {
  const completionColor = data.completionRate >= 70 ? "text-accent" : data.completionRate >= 40 ? "text-secondary" : "text-muted-foreground";

  return (
    <div className="space-y-4">
      {/* Section A — Momentum Score */}
      <Card>
        <CardContent className="py-6 flex justify-center">
          <MomentumScoreRing score={data.momentumScore} />
        </CardContent>
      </Card>

      {/* Section C — System Insight */}
      {(insightLoading || systemInsight) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4 flex items-start gap-3">
            <Brain className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            {insightLoading ? (
              <p className="text-sm text-muted-foreground animate-pulse">Analyzing your week...</p>
            ) : (
              <p className="text-sm leading-relaxed">{systemInsight}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section B — Performance Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <span className={`text-3xl font-bold ${completionColor}`}>
              {data.tasksCompleted}/{data.tasksTotal}
            </span>
            <span className="text-sm text-muted-foreground">
              {data.completionRate}% completed
            </span>
          </div>
          <Progress value={data.completionRate} className="h-2" />

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-lg font-semibold">{data.activeDays}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Active Days</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <BookOpen className="h-3 w-3 text-muted-foreground" />
                <span className="text-lg font-semibold">{data.reflectionRate}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Reflection Rate</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="text-lg font-semibold">{data.avgUsefulnessRating ?? "—"}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Usefulness</p>
            </div>
          </div>

          {data.tasksSkipped > 0 && (
            <p className="text-xs text-muted-foreground">
              {data.tasksSkipped} skipped — that's data too, not failure.
            </p>
          )}
          {data.completionRate < 40 && data.tasksTotal > 0 && (
            <p className="text-xs text-muted-foreground italic">
              Every step forward counts. Let's build on this.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section D — Wins, Insights, Friction */}
      {data.topWins.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-secondary" />
              Top Wins
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topWins.map((win, i) => (
              <div key={i} className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 text-[10px] shrink-0">W{i + 1}</Badge>
                <p className="text-sm">{win}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.topInsights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topInsights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 text-[10px] shrink-0">I{i + 1}</Badge>
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.frictionPoints.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Friction Points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.frictionPoints.map((point, i) => (
              <p key={i} className="text-sm text-muted-foreground">• {point}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {data.phasesActive.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.phasesActive.map((phase) => (
            <Badge key={phase} variant="secondary">{phase}</Badge>
          ))}
        </div>
      )}

      {/* Section E — CTA */}
      <Button className="w-full gap-2" size="lg" onClick={onStartRitual}>
        <Zap className="h-4 w-4" /> Continue to Weekly Ritual
      </Button>

      {data.tasksTotal === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No sprint data yet this week.</p>
            <p className="text-sm text-muted-foreground mt-1">Complete tasks to see your review here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
