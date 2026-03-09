import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lightbulb, Trophy, AlertTriangle, Activity, Zap, Calendar, BookOpen, Brain, TrendingUp, BarChart3, Flame } from "lucide-react";
import { MicroGuide } from "@/components/MicroGuide";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
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
  const fillColor = score >= 70 ? "hsl(var(--accent))" : score >= 40 ? "hsl(var(--secondary))" : "hsl(var(--muted-foreground))";
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  const label = score >= 70 ? "Strong" : score >= 40 ? "Building" : "Starting";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted) / 0.5)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            className={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold tracking-tight ${color}`}>{score}</span>
          <span className="text-[10px] text-muted-foreground font-medium">/100</span>
        </div>
      </div>
      <Badge variant="outline" className={`text-[10px] ${color} border-current/20`}>{label}</Badge>
    </div>
  );
}

function ScoreBreakdownChart({ data }: { data: WeeklyData }) {
  const completionScore = data.tasksTotal > 0 ? Math.round((data.tasksCompleted / data.tasksTotal) * 40) : 0;
  const consistencyScore = Math.round((data.activeDays / 7) * 25);
  const reflectionScore = Math.round((data.reflectionRate / 100) * 20);
  const engagementScore = (data.designThinkingInteractions > 0 || data.creativeSpaceTiles > 0) ? 15 : 0;

  const chartData = [
    { name: "Completion", value: completionScore, max: 40, fill: "hsl(var(--primary))" },
    { name: "Consistency", value: consistencyScore, max: 25, fill: "hsl(var(--accent))" },
    { name: "Reflection", value: reflectionScore, max: 20, fill: "hsl(var(--secondary))" },
    { name: "Engagement", value: engagementScore, max: 15, fill: "hsl(var(--muted-foreground))" },
  ];

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Score Breakdown</p>
      {chartData.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-semibold text-foreground">{item.value}<span className="text-muted-foreground font-normal">/{item.max}</span></span>
          </div>
          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(item.value / item.max) * 100}%`, backgroundColor: item.fill }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subValue, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/30 border border-border/40">
      <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
      <span className="text-xl font-bold tracking-tight">{value}</span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
      {subValue && <span className="text-[9px] text-muted-foreground/60">{subValue}</span>}
    </div>
  );
}

function DailyActivityChart({ data }: { data: WeeklyData }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  // Simulated daily distribution based on active days
  const barData = days.map((day, i) => ({
    day,
    tasks: i < data.activeDays ? Math.max(1, Math.round(data.tasksCompleted / Math.max(data.activeDays, 1))) : 0,
  }));

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Weekly Activity</p>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={barData} barSize={16}>
          <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Bar dataKey="tasks" radius={[4, 4, 0, 0]} fill="hsl(var(--primary) / 0.6)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TaskDistributionDonut({ data }: { data: WeeklyData }) {
  const completed = data.tasksCompleted;
  const skipped = data.tasksSkipped;
  const remaining = Math.max(0, data.tasksTotal - completed - skipped);

  const chartData = [
    { name: "Completed", value: completed || 0, fill: "hsl(var(--accent))" },
    { name: "Skipped", value: skipped || 0, fill: "hsl(var(--muted-foreground) / 0.3)" },
    { name: "Remaining", value: remaining || 0, fill: "hsl(var(--muted) / 0.5)" },
  ].filter(d => d.value > 0);

  if (chartData.length === 0) return null;

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={72} height={72}>
        <PieChart>
          <Pie data={chartData} innerRadius={22} outerRadius={34} paddingAngle={2} dataKey="value" strokeWidth={0}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-[11px]">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="font-semibold">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SprintReviewTab({ data, systemInsight, insightLoading, onStartRitual }: SprintReviewTabProps) {
  const completionColor = data.completionRate >= 70 ? "text-accent" : data.completionRate >= 40 ? "text-secondary" : "text-muted-foreground";

  return (
    <div className="space-y-4">
      {/* Guide */}
      <div className="flex justify-end">
        <MicroGuide
          guideKey="sprint_review"
          title="Sprint Review"
          description={"This is your weekly reflection.\n\nHere you evaluate your week using statistics and execution data.\n\nYou review what worked, what didn't, and what direction to take next."}
        />
      </div>

      {/* Section A — Momentum Score + Breakdown */}
      <Card className="overflow-hidden">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <MomentumScoreRing score={data.momentumScore} />
            <div className="flex-1 w-full">
              <ScoreBreakdownChart data={data} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section B — System Insight */}
      {(insightLoading || systemInsight) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            {insightLoading ? (
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-muted/50 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted/50 rounded animate-pulse w-1/2" />
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-medium text-primary/70 uppercase tracking-wider mb-1">AI Analysis</p>
                <p className="text-sm leading-relaxed">{systemInsight}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section C — Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard icon={CheckCircle} label="Completed" value={data.tasksCompleted} subValue={`of ${data.tasksTotal}`} color="text-accent" />
        <StatCard icon={Calendar} label="Active Days" value={data.activeDays} subValue="of 7" color="text-primary" />
        <StatCard icon={BookOpen} label="Reflection" value={`${data.reflectionRate}%`} color="text-secondary" />
        <StatCard icon={Activity} label="Usefulness" value={data.avgUsefulnessRating ?? "—"} color="text-muted-foreground" />
      </div>

      {/* Section D — Task Distribution + Activity Chart */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-border/50">
          <CardContent className="py-4 px-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Task Distribution</p>
            <TaskDistributionDonut data={data} />
            {data.tasksTotal === 0 && (
              <p className="text-xs text-muted-foreground/60 italic">No tasks this week yet</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-4 px-4">
            <DailyActivityChart data={data} />
          </CardContent>
        </Card>
      </div>

      {/* Completion Progress */}
      <Card className="border-border/50">
        <CardContent className="py-4 px-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Completion Rate</span>
            </div>
            <span className={`text-lg font-bold ${completionColor}`}>{data.completionRate}%</span>
          </div>
          <Progress value={data.completionRate} className="h-2.5" />
          {data.tasksSkipped > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {data.tasksSkipped} skipped — that's data too, not failure.
            </p>
          )}
          {data.completionRate < 40 && data.tasksTotal > 0 && (
            <p className="text-[11px] text-muted-foreground italic">
              Every step forward counts. Let's build on this.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section E — Wins, Insights, Friction */}
      {data.topWins.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-secondary" />
              Top Wins
              <Badge variant="secondary" className="text-[9px] ml-auto">{data.topWins.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topWins.map((win, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/5 border border-secondary/10">
                <span className="text-secondary text-xs font-bold mt-0.5">W{i + 1}</span>
                <p className="text-sm leading-relaxed">{win}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.topInsights.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" />
              Key Insights
              <Badge variant="outline" className="text-[9px] ml-auto">{data.topInsights.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topInsights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-accent/5 border border-accent/10">
                <span className="text-accent text-xs font-bold mt-0.5">I{i + 1}</span>
                <p className="text-sm leading-relaxed">{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.frictionPoints.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Friction Points
              <Badge variant="outline" className="text-[9px] ml-auto">{data.frictionPoints.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.frictionPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/30">
                <span className="text-muted-foreground text-xs font-bold mt-0.5">F{i + 1}</span>
                <p className="text-sm text-muted-foreground leading-relaxed">{point}</p>
              </div>
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

      {/* CTA */}
      <Button className="w-full gap-2" size="lg" onClick={onStartRitual}>
        <Zap className="h-4 w-4" /> Continue to Weekly Ritual
      </Button>

      {data.tasksTotal === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground font-medium">No sprint data yet this week.</p>
            <p className="text-sm text-muted-foreground mt-1">Complete tasks to see your analytics here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
