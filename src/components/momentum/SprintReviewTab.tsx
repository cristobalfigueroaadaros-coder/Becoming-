import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Lightbulb, Trophy, AlertTriangle, Activity } from "lucide-react";
import type { WeeklyData } from "@/hooks/useMomentumData";

interface SprintReviewTabProps {
  data: WeeklyData;
}

export function SprintReviewTab({ data }: SprintReviewTabProps) {
  const completionColor = data.completionRate >= 70 ? "text-accent" : data.completionRate >= 40 ? "text-secondary" : "text-muted-foreground";

  return (
    <div className="space-y-4">
      {/* Completion Rate */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            Task Completion
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
          {data.tasksSkipped > 0 && (
            <p className="text-xs text-muted-foreground">
              {data.tasksSkipped} skipped — that's data too, not failure.
            </p>
          )}
          {data.completionRate < 40 && (
            <p className="text-xs text-muted-foreground italic">
              Every step forward counts. Let's build on this.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Usefulness Rating */}
      {data.avgUsefulnessRating !== null && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-secondary" />
              Average Usefulness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{data.avgUsefulnessRating}</span>
            <span className="text-sm text-muted-foreground"> / 5</span>
          </CardContent>
        </Card>
      )}

      {/* Top Wins */}
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

      {/* Top Insights */}
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

      {/* Friction Points */}
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

      {/* Phase Activity */}
      {data.phasesActive.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.phasesActive.map((phase) => (
            <Badge key={phase} variant="secondary">{phase}</Badge>
          ))}
        </div>
      )}

      {/* Empty state */}
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
