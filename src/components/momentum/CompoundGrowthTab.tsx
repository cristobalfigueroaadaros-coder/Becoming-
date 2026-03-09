import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Target, Brain, Zap, BarChart3, Activity, Gauge, Shield } from "lucide-react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { MicroGuide } from "@/components/MicroGuide";
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

function GaugeIndicator({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const circumference = Math.PI * 36; // half circle
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-12 overflow-hidden">
        <svg className="w-20 h-20" viewBox="0 0 100 50">
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="hsl(var(--muted) / 0.4)" strokeWidth="8" strokeLinecap="round" />
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
      </div>
      <span className="text-lg font-bold -mt-1">{value}</span>
      <span className="text-[9px] text-muted-foreground text-center leading-tight mt-0.5">{label}</span>
    </div>
  );
}

function TrajectoryBadge({ trajectory }: { trajectory: "Ascending" | "Stable" | "Unstable" }) {
  const config = {
    Ascending: { icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10 border-green-500/20" },
    Stable: { icon: Minus, color: "text-muted-foreground", bg: "bg-muted/50 border-border/50" },
    Unstable: { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
  }[trajectory];

  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${config.bg}`}>
      <Icon className={`h-4 w-4 ${config.color}`} />
      <div>
        <p className={`text-sm font-semibold ${config.color}`}>{trajectory}</p>
        <p className="text-[9px] text-muted-foreground">Trajectory</p>
      </div>
    </div>
  );
}

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
  const densityColor = learningDensity === "High" ? "text-green-500" : learningDensity === "Moderate" ? "text-amber-500" : "text-muted-foreground";

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

  // Health radar data
  const avgMomentum = pastReports.length > 0
    ? Math.round(pastReports.reduce((s, r) => s + (r.momentum_score ?? 0), 0) / pastReports.length)
    : 0;
  const avgCompletion = pastReports.length > 0
    ? Math.round(pastReports.reduce((s, r) => s + (r.completion_rate ?? 0), 0) / pastReports.length)
    : 0;

  const radarData = [
    { metric: "Momentum", value: avgMomentum },
    { metric: "Completion", value: avgCompletion },
    { metric: "Reflection", value: Math.round(avgReflection) },
    { metric: "Consistency", value: consistencyIndex },
    { metric: "Stability", value: stabilityIndex },
  ];

  // Per-week completion bars
  const weeklyBars = sorted.map((r) => ({
    week: r.week_start.slice(5),
    score: r.momentum_score ?? 0,
  }));

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

  if (pastReports.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground font-medium">Complete your first weekly ritual to start tracking growth.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Analytics will appear here after your first sprint.</p>
        </CardContent>
      </Card>
    );
  }

  const metricLabels: Record<MetricKey, string> = { momentum: "Momentum", completion: "Completion %", reflection: "Reflection %" };
  const metricColors: Record<MetricKey, string> = { momentum: "hsl(var(--primary))", completion: "hsl(var(--accent))", reflection: "hsl(var(--secondary))" };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <MicroGuide
          guideKey="compound_growth"
          title="Compound Growth"
          description={"This view shows the accumulation of your progress over time.\n\nSmall consistent actions compound into meaningful growth."}
        />
      </div>

      {/* Narrative block */}
      {(compoundNarrative || narrativeLoading) && (
        <Card className="border-primary/15 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-md bg-primary/10">
                <Brain className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-[10px] font-medium text-primary/70 uppercase tracking-wider">Execution Evolution</p>
            </div>
            {narrativeLoading ? (
              <div className="space-y-2">
                <div className="h-3 bg-muted/50 rounded animate-pulse w-full" />
                <div className="h-3 bg-muted/50 rounded animate-pulse w-4/5" />
                <div className="h-3 bg-muted/50 rounded animate-pulse w-2/3" />
              </div>
            ) : (
              <p className="text-sm leading-relaxed">{compoundNarrative}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top metrics — Trajectory + Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="col-span-2 sm:col-span-1">
          <TrajectoryBadge trajectory={trajectory} />
        </div>
        <Card className="border-border/40">
          <CardContent className="py-3 px-2 flex justify-center">
            <GaugeIndicator value={consistencyIndex} max={100} label="Consistency" color="hsl(var(--primary))" />
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="py-3 px-2 flex justify-center">
            <GaugeIndicator
              value={Math.abs(growthVelocity)}
              max={10}
              label={`Velocity ${growthVelocity >= 0 ? "↑" : "↓"}`}
              color={growthVelocity > 0 ? "hsl(142, 76%, 36%)" : growthVelocity < 0 ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"}
            />
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="py-3 px-2 flex justify-center">
            <GaugeIndicator value={stabilityIndex} max={100} label="Stability" color="hsl(var(--secondary))" />
          </CardContent>
        </Card>
      </div>

      {/* Execution Trend — Area Chart */}
      {chartData.length > 1 && (
        <Card className="border-border/40 overflow-hidden">
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
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                    selectedMetric === k
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                  }`}
                >
                  {metricLabels[k]}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metricColors[selectedMetric]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={metricColors[selectedMetric]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={28} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11, boxShadow: "0 4px 12px -2px rgba(0,0,0,0.15)" }}
                />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={metricColors[selectedMetric]}
                  strokeWidth={2}
                  fill="url(#areaGradient)"
                  dot={{ r: 3, fill: metricColors[selectedMetric], strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Weekly Momentum Bars */}
      {weeklyBars.length > 1 && (
        <Card className="border-border/40">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              Weekly Momentum
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={weeklyBars} barSize={20}>
                <XAxis dataKey="week" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {weeklyBars.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.score >= 70 ? "hsl(var(--accent))" : entry.score >= 40 ? "hsl(var(--secondary))" : "hsl(var(--muted-foreground) / 0.3)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Health Radar */}
      <Card className="border-border/40">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            Growth Health
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-3 flex justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <Radar
                name="Health"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Focus Stability */}
      <Card className="border-border/40">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            Focus Stability
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded-lg bg-muted/30 border border-border/30">
              <p className="text-xl font-bold">{longestContinuity}</p>
              <p className="text-[10px] text-muted-foreground">Continuity streak</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30 border border-border/30">
              <p className="text-xl font-bold">{pivotCount}</p>
              <p className="text-[10px] text-muted-foreground">Pivots</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30 border border-border/30">
              <p className="text-xl font-bold">{stabilityIndex}%</p>
              <p className="text-[10px] text-muted-foreground">Stability</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Density */}
      <Card className="border-border/40">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-muted-foreground" />
            Learning Density
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2.5">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`text-xs font-semibold ${densityColor} border-current/20`}>{learningDensity}</Badge>
            <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round(avgReflection)}%`,
                  backgroundColor: learningDensity === "High" ? "hsl(142, 76%, 36%)" : learningDensity === "Moderate" ? "hsl(38, 92%, 50%)" : "hsl(var(--muted-foreground))",
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium">{Math.round(avgReflection)}%</span>
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

      {/* Skill Activation */}
      {capabilities.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-muted-foreground" />
              Skill Activation
              <Badge variant="outline" className="text-[9px] ml-auto">{capabilities.length} skills</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2.5">
            {mostActivated.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5">Most activated</p>
                <div className="space-y-1.5">
                  {mostActivated.map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <div className="flex-1 text-xs font-medium">{c.capability_name}</div>
                      <div className="w-20 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min((c.activation_count / (mostActivated[0]?.activation_count || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-6 text-right">{c.activation_count}</span>
                    </div>
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
                    <Badge key={c.id} variant="outline" className="text-[10px] font-normal text-muted-foreground">{c.capability_name}</Badge>
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
