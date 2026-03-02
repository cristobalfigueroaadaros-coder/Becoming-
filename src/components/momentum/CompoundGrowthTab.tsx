import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Target, Brain, Zap, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import type { WeeklyReport, Capability } from "@/hooks/useMomentumData";

interface CompoundGrowthTabProps {
  pastReports: WeeklyReport[];
  currentStreak: number;
  capabilities: Capability[];
}

// --- Computation helpers ---

function linearRegression(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((s, y, i) => s + i * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function getTrajectory(reports: WeeklyReport[]): "Ascending" | "Stable" | "Unstable" {
  const recent = reports.slice(0, 5).map((r) => r.momentum_score ?? 0).reverse();
  if (recent.length < 2) return "Stable";
  const slope = linearRegression(recent);
  if (slope > 2) return "Ascending";
  if (slope < -2) return "Unstable";
  return "Stable";
}

function getConsistencyIndex(reports: WeeklyReport[]): number {
  const scores = reports.map((r) => r.momentum_score ?? 0);
  if (scores.length < 2) return 100;
  const sd = stdDev(scores);
  return Math.max(0, Math.round(100 - sd * 5));
}

function getGrowthVelocity(reports: WeeklyReport[]): number {
  const recent = reports.slice(0, 5).map((r) => r.momentum_score ?? 0).reverse();
  if (recent.length < 2) return 0;
  return Math.round(linearRegression(recent) * 10) / 10;
}

type MetricKey = "momentum" | "completion" | "reflection";

export function CompoundGrowthTab({ pastReports, currentStreak, capabilities }: CompoundGrowthTabProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("momentum");
  const [compoundNarrative, setCompoundNarrative] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);

  const sorted = [...pastReports].reverse();
  const chartData = sorted.map((r) => ({
    week: r.week_start.slice(5),
    momentum: r.momentum_score ?? 0,
    completion: r.tasks_total > 0 ? Math.round((r.tasks_completed / r.tasks_total) * 100) : 0,
    reflection: (r as any).reflection_rate ?? 0,
  }));

  const trajectory = getTrajectory(pastReports);
  const consistencyIndex = getConsistencyIndex(pastReports);
  const growthVelocity = getGrowthVelocity(pastReports);

  // Focus stability
  const pivotCount = pastReports.filter((r) => r.sprint_direction?.toLowerCase().includes("pivot")).length;
  const totalReports = pastReports.length;
  const stabilityIndex = totalReports > 0 ? Math.round((1 - pivotCount / totalReports) * 100) : 100;

  // Longest continuity streak
  let longestContinuity = 0;
  let currentContinuity = 0;
  for (const r of sorted) {
    if (!r.sprint_direction?.toLowerCase().includes("pivot")) {
      currentContinuity++;
      longestContinuity = Math.max(longestContinuity, currentContinuity);
    } else {
      currentContinuity = 0;
    }
  }

  // Learning density
  const reflectionRates = pastReports.map((r) => (r as any).reflection_rate ?? 0);
  const avgReflection = reflectionRates.length > 0
    ? reflectionRates.reduce((a: number, b: number) => a + b, 0) / reflectionRates.length
    : 0;
  const learningDensity = avgReflection >= 60 ? "High" : avgReflection >= 30 ? "Moderate" : "Low";
  const densityColor = learningDensity === "High" ? "text-green-600" : learningDensity === "Moderate" ? "text-amber-600" : "text-muted-foreground";

  // Recurring themes from wins/friction
  const allWins = pastReports.flatMap((r) => ((r as any).top_wins as string[]) || []);
  const allFriction = pastReports.flatMap((r) => ((r as any).friction_points as string[]) || []);
  const winThemes = getTopThemes(allWins, 2);
  const frictionThemes = getTopThemes(allFriction, 2);

  // Capability grouping
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  const fourWeeksAgo = new Date(Date.now() - 28 * 86400000).toISOString();
  const sortedCaps = [...capabilities].sort((a, b) => b.activation_count - a.activation_count);
  const mostActivated = sortedCaps.slice(0, 3);
  const newlyEmerging = capabilities.filter((c) => c.first_activated_at >= twoWeeksAgo);
  const underused = capabilities.filter((c) => c.last_activated_at < fourWeeksAgo && c.activation_count > 0);

  // Fetch compound narrative
  useEffect(() => {
    if (pastReports.length >= 3 && !compoundNarrative) {
      setNarrativeLoading(true);
      supabase.functions.invoke("generate-compound-narrative", {
        body: {
          reports: pastReports.slice(0, 8).map((r) => ({
            week_start: r.week_start,
            momentum_score: r.momentum_score,
            completion_rate: r.completion_rate,
            reflection_rate: (r as any).reflection_rate ?? 0,
            sprint_direction: r.sprint_direction,
            evolution_narrative: r.evolution_narrative,
          })),
          capabilities: capabilities.slice(0, 10).map((c) => ({
            name: c.capability_name,
            count: c.activation_count,
          })),
          consistencyIndex,
          trajectory,
        },
      }).then(({ data, error }) => {
        if (!error && data?.narrative) setCompoundNarrative(data.narrative);
        setNarrativeLoading(false);
      }).catch(() => setNarrativeLoading(false));
    }
  }, [pastReports.length]);

  const trajectoryIcon = trajectory === "Ascending" ? <TrendingUp className="h-3.5 w-3.5" /> :
    trajectory === "Unstable" ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />;
  const trajectoryColor = trajectory === "Ascending" ? "text-green-600" : trajectory === "Unstable" ? "text-destructive" : "text-muted-foreground";

  if (pastReports.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Complete your first weekly ritual to start tracking growth.</p>
        </CardContent>
      </Card>
    );
  }

  const metricLabels: Record<MetricKey, string> = { momentum: "Momentum", completion: "Completion %", reflection: "Reflection %" };
  const metricColors: Record<MetricKey, string> = { momentum: "hsl(var(--primary))", completion: "hsl(var(--accent))", reflection: "hsl(var(--secondary))" };

  return (
    <div className="space-y-3">
      {/* Narrative block */}
      {(compoundNarrative || narrativeLoading) && (
        <Card className="border-border/50">
          <CardContent className="py-4">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Your Execution Evolution</p>
            {narrativeLoading ? (
              <p className="text-sm text-muted-foreground animate-pulse">Synthesizing your trajectory...</p>
            ) : (
              <p className="text-sm leading-relaxed">{compoundNarrative}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top metrics row */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-border/50">
          <CardContent className="py-3 px-3 text-center">
            <p className="text-xs text-muted-foreground">Trajectory</p>
            <div className={`flex items-center justify-center gap-1 mt-1 text-sm font-medium ${trajectoryColor}`}>
              {trajectoryIcon} {trajectory}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-3 px-3 text-center">
            <p className="text-xs text-muted-foreground">Consistency</p>
            <p className="text-sm font-medium mt-1">{consistencyIndex}/100</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-3 px-3 text-center">
            <p className="text-xs text-muted-foreground">Velocity</p>
            <p className={`text-sm font-medium mt-1 ${growthVelocity > 0 ? "text-green-600" : growthVelocity < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {growthVelocity > 0 ? "+" : ""}{growthVelocity}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section 1 — Execution Trend */}
      {chartData.length > 1 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              Execution Trend
            </CardTitle>
            <div className="flex gap-1 mt-2">
              {(["momentum", "completion", "reflection"] as MetricKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setSelectedMetric(k)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    selectedMetric === k
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {metricLabels[k]}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={chartData}>
                <XAxis dataKey="week" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={28} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={metricColors[selectedMetric]}
                  strokeWidth={1.5}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Section 2 — Focus Stability */}
      <Card className="border-border/50">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            Focus Stability
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-semibold">{longestContinuity}</p>
              <p className="text-[10px] text-muted-foreground">Continuity streak</p>
            </div>
            <div>
              <p className="text-lg font-semibold">{pivotCount}</p>
              <p className="text-[10px] text-muted-foreground">Pivots</p>
            </div>
            <div>
              <p className="text-lg font-semibold">{stabilityIndex}%</p>
              <p className="text-[10px] text-muted-foreground">Stability</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3 — Learning Density */}
      <Card className="border-border/50">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-muted-foreground" />
            Learning Density
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${densityColor}`}>{learningDensity}</Badge>
            <span className="text-xs text-muted-foreground">avg reflection {Math.round(avgReflection)}%</span>
          </div>
          {winThemes.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">Recurring wins</p>
              <div className="flex flex-wrap gap-1">
                {winThemes.map((t) => <Badge key={t} variant="secondary" className="text-[10px] font-normal">{t}</Badge>)}
              </div>
            </div>
          )}
          {frictionThemes.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">Recurring friction</p>
              <div className="flex flex-wrap gap-1">
                {frictionThemes.map((t) => <Badge key={t} variant="outline" className="text-[10px] font-normal">{t}</Badge>)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4 — Skill Activation */}
      {capabilities.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-muted-foreground" />
              Skill Activation
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {mostActivated.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Most activated</p>
                <div className="flex flex-wrap gap-1">
                  {mostActivated.map((c) => (
                    <Badge key={c.id} className="text-[10px] font-normal">{c.capability_name} ({c.activation_count})</Badge>
                  ))}
                </div>
              </div>
            )}
            {newlyEmerging.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Newly emerging</p>
                <div className="flex flex-wrap gap-1">
                  {newlyEmerging.map((c) => (
                    <Badge key={c.id} variant="secondary" className="text-[10px] font-normal">{c.capability_name}</Badge>
                  ))}
                </div>
              </div>
            )}
            {underused.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Underused</p>
                <div className="flex flex-wrap gap-1">
                  {underused.map((c) => (
                    <Badge key={c.id} variant="outline" className="text-[10px] font-normal">{c.capability_name}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getTopThemes(items: string[], count: number): string[] {
  const freq: Record<string, number> = {};
  for (const item of items) {
    const words = item.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .filter(([, c]) => c >= 2)
    .map(([w]) => w);
}
