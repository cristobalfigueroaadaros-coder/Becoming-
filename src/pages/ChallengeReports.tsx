import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, TrendingUp, Calendar, Award, Target, Lightbulb, BarChart3 } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears, eachMonthOfInterval } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

interface MonthlyData {
  month: string;
  completed: number;
  skipped: number;
  total: number;
  completionRate: number;
}

export default function ChallengeReports() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [yearlyStats, setYearlyStats] = useState<any>(null);
  const [insights, setInsights] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    loadReportData();
  }, [period]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const now = new Date();
      const startDate = period === "monthly" 
        ? startOfMonth(subMonths(now, 5))
        : startOfYear(subYears(now, 0));
      const endDate = period === "monthly" ? endOfMonth(now) : endOfYear(now);

      const { data: challenges, error } = await supabase
        .from("daily_challenge")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      if (error) throw error;

      if (period === "monthly") {
        // Calculate monthly breakdown
        const months = eachMonthOfInterval({ start: startDate, end: endDate });
        const monthlyBreakdown = months.map(month => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          
          const monthChallenges = challenges?.filter(c => {
            const challengeDate = new Date(c.date);
            return challengeDate >= monthStart && challengeDate <= monthEnd;
          }) || [];

          const completed = monthChallenges.filter(c => c.status === "completed").length;
          const skipped = monthChallenges.filter(c => c.status === "skipped").length;
          const total = monthChallenges.length;

          return {
            month: format(month, "MMM yyyy"),
            completed,
            skipped,
            total,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
          };
        });

        setMonthlyData(monthlyBreakdown);
      } else {
        // Calculate yearly stats
        const completed = challenges?.filter(c => c.status === "completed").length || 0;
        const skipped = challenges?.filter(c => c.status === "skipped").length || 0;
        const total = challenges?.length || 0;

        // Calculate quarterly breakdown
        const quarters = [
          { label: "Q1", start: startOfYear(now), end: new Date(now.getFullYear(), 2, 31) },
          { label: "Q2", start: new Date(now.getFullYear(), 3, 1), end: new Date(now.getFullYear(), 5, 30) },
          { label: "Q3", start: new Date(now.getFullYear(), 6, 1), end: new Date(now.getFullYear(), 8, 30) },
          { label: "Q4", start: new Date(now.getFullYear(), 9, 1), end: endOfYear(now) }
        ];

        const quarterlyData = quarters.map(q => {
          const qChallenges = challenges?.filter(c => {
            const d = new Date(c.date);
            return d >= q.start && d <= q.end;
          }) || [];
          const qCompleted = qChallenges.filter(c => c.status === "completed").length;
          return {
            quarter: q.label,
            completed: qCompleted,
            total: qChallenges.length,
            completionRate: qChallenges.length > 0 ? Math.round((qCompleted / qChallenges.length) * 100) : 0
          };
        });

        setYearlyStats({
          total,
          completed,
          skipped,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          quarterlyData
        });
      }
    } catch (error) {
      console.error("Error loading report data:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    try {
      setGeneratingInsights(true);
      const now = new Date();
      const startDate = period === "monthly" 
        ? format(startOfMonth(now), "yyyy-MM-dd")
        : format(startOfYear(now), "yyyy-MM-dd");
      const endDate = format(now, "yyyy-MM-dd");

      const { data, error } = await supabase.functions.invoke("generate-challenge-insights", {
        body: {
          period: period === "monthly" ? "month" : "year",
          startDate,
          endDate
        }
      });

      if (error) throw error;

      setInsights(data.insights);
      toast.success("Insights generated!");
    } catch (error) {
      console.error("Error generating insights:", error);
      toast.error("Failed to generate insights");
    } finally {
      setGeneratingInsights(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate("/challenge-history")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
            <h1 className="text-4xl font-bold">Challenge Reports</h1>
            <p className="text-muted-foreground mt-2">
              Long-term patterns and purpose alignment analysis
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as "monthly" | "yearly")}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="monthly">Monthly View</TabsTrigger>
            <TabsTrigger value="yearly">Yearly View</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="space-y-6">
            {/* Monthly Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Avg Completion</p>
                      <p className="text-2xl font-bold">
                        {Math.round(
                          monthlyData.reduce((acc, m) => acc + m.completionRate, 0) / monthlyData.length || 0
                        )}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Completed</p>
                      <p className="text-2xl font-bold">
                        {monthlyData.reduce((acc, m) => acc + m.completed, 0)}
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Best Month</p>
                      <p className="text-lg font-bold">
                        {monthlyData.reduce((best, m) => 
                          m.completionRate > (best?.completionRate || 0) ? m : best
                        , monthlyData[0])?.month || "N/A"}
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Progression Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Monthly Progression
                </CardTitle>
                <CardDescription>
                  Challenge completion trends over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Completed"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2}
                      name="Total"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Completion Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate Trend</CardTitle>
                <CardDescription>
                  Percentage of challenges completed each month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="completionRate" 
                      fill="hsl(var(--primary))" 
                      radius={[8, 8, 0, 0]}
                      name="Completion Rate %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="yearly" className="space-y-6">
            {yearlyStats && (
              <>
                {/* Yearly Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total</p>
                          <p className="text-2xl font-bold">{yearlyStats.total}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Completed</p>
                          <p className="text-2xl font-bold">{yearlyStats.completed}</p>
                        </div>
                        <Award className="w-8 h-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Rate</p>
                          <p className="text-2xl font-bold">{yearlyStats.completionRate}%</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Skipped</p>
                          <p className="text-2xl font-bold">{yearlyStats.skipped}</p>
                        </div>
                        <Target className="w-8 h-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quarterly Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Quarterly Performance
                    </CardTitle>
                    <CardDescription>
                      Challenge completion by quarter
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={yearlyStats.quarterlyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="quarter" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="completed" 
                          fill="hsl(var(--primary))" 
                          radius={[8, 8, 0, 0]}
                          name="Completed"
                        />
                        <Bar 
                          dataKey="total" 
                          fill="hsl(var(--muted))" 
                          radius={[8, 8, 0, 0]}
                          name="Total"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Quarterly Completion Rates */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quarterly Completion Rates</CardTitle>
                    <CardDescription>
                      Consistency across the year
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={yearlyStats.quarterlyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="quarter" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="completionRate" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          name="Completion Rate %"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* AI-Generated Insights */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Purpose Alignment Insights
            </CardTitle>
            <CardDescription>
              AI-powered analysis of your {period === "monthly" ? "monthly" : "yearly"} patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights ? (
              <div className="p-4 rounded-lg bg-background/50 border border-primary/10 whitespace-pre-wrap">
                {insights}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Generate AI-powered insights about your patterns and purpose alignment
                </p>
                <Button 
                  onClick={generateInsights}
                  disabled={generatingInsights}
                >
                  {generatingInsights ? "Generating..." : "Generate Insights"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}