import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, BookOpen, Compass } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { WeeklyReport } from "@/hooks/useMomentumData";

interface CompoundGrowthTabProps {
  pastReports: WeeklyReport[];
  currentStreak: number;
}

export function CompoundGrowthTab({ pastReports, currentStreak }: CompoundGrowthTabProps) {
  const chartData = [...pastReports]
    .reverse()
    .map((r) => ({
      week: r.week_start.slice(5), // MM-DD
      rate: r.completion_rate,
    }));

  const totalInsights = pastReports.reduce((sum, r) => sum + (r.tasks_completed || 0), 0);

  return (
    <div className="space-y-4">
      {/* Streak */}
      <Card>
        <CardContent className="py-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
            <Flame className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{currentStreak} week{currentStreak !== 1 ? "s" : ""}</p>
            <p className="text-sm text-muted-foreground">Weekly ritual streak</p>
          </div>
        </CardContent>
      </Card>

      {/* Completion Trend */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Completion Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Accumulated Stats */}
      <Card>
        <CardContent className="py-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalInsights}</p>
            <p className="text-sm text-muted-foreground">Total tasks completed across all weeks</p>
          </div>
        </CardContent>
      </Card>

      {/* Evolution Narrative History */}
      {pastReports.filter((r) => r.evolution_narrative).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" />
              Evolution Narratives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pastReports
              .filter((r) => r.evolution_narrative)
              .slice(0, 4)
              .map((r) => (
                <div key={r.id} className="border-l-2 border-primary/30 pl-3 py-1">
                  <p className="text-xs text-muted-foreground mb-1">{r.week_start}</p>
                  <p className="text-sm">{r.evolution_narrative}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {pastReports.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Complete your first weekly ritual to start tracking growth.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
