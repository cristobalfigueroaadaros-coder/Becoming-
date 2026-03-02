import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, format } from "date-fns";

export interface WeeklyData {
  tasksCompleted: number;
  tasksTotal: number;
  tasksSkipped: number;
  completionRate: number;
  avgUsefulnessRating: number | null;
  topWins: string[];
  topInsights: string[];
  frictionPoints: string[];
  insightsCaptured: number;
  phasesActive: string[];
  designThinkingInteractions: number;
  creativeSpaceTiles: number;
  momentumScore: number;
  activeDays: number;
  reflectionRate: number;
}

export interface WeeklyReport {
  id: string;
  week_start: string;
  week_end: string;
  tasks_completed: number;
  tasks_total: number;
  completion_rate: number;
  evolution_narrative: string | null;
  self_ratings: Record<string, number> | null;
  streak_weeks: number;
  ritual_completed_at: string | null;
  created_at: string;
  momentum_score: number | null;
  sprint_direction: string | null;
  system_insight: string | null;
  reflection_rate: number | null;
  active_days: number | null;
  focus_category: string | null;
  top_wins?: string[];
  friction_points?: string[];
}

export interface Capability {
  id: string;
  capability_name: string;
  source_type: string;
  activation_count: number;
  first_activated_at: string;
  last_activated_at: string;
}

export function useMomentumData() {
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [pastReports, setPastReports] = useState<WeeklyReport[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [systemInsight, setSystemInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sevenDaysAgo = format(startOfDay(subDays(new Date(), 7)), "yyyy-MM-dd");
      const today = format(new Date(), "yyyy-MM-dd");

      const [stepsRes, feedbackRes, insightsRes, phasesRes, dtRes, csRes, reportsRes, capsRes] = await Promise.all([
        supabase
          .from("integrator_daily_steps")
          .select("id, status, scheduled_date")
          .eq("user_id", user.id)
          .gte("scheduled_date", sevenDaysAgo)
          .lte("scheduled_date", today),
        supabase
          .from("task_feedback" as any)
          .select("win_text, insight_text, improvement_text, usefulness_rating, created_at")
          .eq("user_id", user.id)
          .gte("created_at", new Date(sevenDaysAgo).toISOString()),
        supabase
          .from("insight_dots")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .gte("created_at", new Date(sevenDaysAgo).toISOString()),
        supabase
          .from("integrator_phases")
          .select("phase_name, started_at, completed_at")
          .eq("user_id", user.id)
          .not("started_at", "is", null),
        supabase
          .from("design_thinking_content")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .gte("created_at", new Date(sevenDaysAgo).toISOString()),
        supabase
          .from("creative_space_tiles")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .gte("created_at", new Date(sevenDaysAgo).toISOString()),
        supabase
          .from("momentum_weekly_reports")
          .select("*")
          .eq("user_id", user.id)
          .order("week_start", { ascending: false })
          .limit(12),
        supabase
          .from("momentum_capabilities")
          .select("*")
          .eq("user_id", user.id)
          .order("last_activated_at", { ascending: false }),
      ]);

      // Process steps
      const steps = stepsRes.data || [];
      const completed = steps.filter((s) => s.status === "completed").length;
      const skipped = steps.filter((s) => s.status === "skipped").length;
      const total = steps.length;

      // Active days = unique scheduled_dates with completed tasks
      const activeDays = new Set(
        steps.filter((s) => s.status === "completed").map((s) => s.scheduled_date)
      ).size;

      // Process feedback
      const feedback = (feedbackRes.data as any[]) || [];
      const wins = feedback.map((f: any) => f.win_text).filter(Boolean).slice(0, 3);
      const insights = feedback.map((f: any) => f.insight_text).filter(Boolean).slice(0, 3);
      const friction = feedback.map((f: any) => f.improvement_text).filter(Boolean).slice(0, 3);
      const ratings = feedback.map((f: any) => f.usefulness_rating).filter(Boolean);
      const avgRating = ratings.length > 0
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
        : null;

      // Reflection rate = feedback entries with insight_text / total tasks
      const feedbackWithInsights = feedback.filter((f: any) => f.insight_text).length;
      const reflectionRate = total > 0 ? Math.round((feedbackWithInsights / total) * 100) : 0;

      // Process phases
      const phases = phasesRes.data || [];
      const activePhases = phases
        .filter((p) => p.started_at && !p.completed_at)
        .map((p) => p.phase_name);

      // Compute Momentum Score (0-100)
      const completionScore = total > 0 ? (completed / total) : 0; // 40%
      const consistencyScore = activeDays / 7; // 25%
      const reflectionScore = reflectionRate / 100; // 20%
      const dtCount = dtRes.count || 0;
      const csCount = csRes.count || 0;
      const engagementScore = (dtCount > 0 || csCount > 0) ? 1 : 0; // 15%

      const momentumScore = Math.round(
        completionScore * 40 +
        consistencyScore * 25 +
        reflectionScore * 20 +
        engagementScore * 15
      );

      setWeeklyData({
        tasksCompleted: completed,
        tasksTotal: total,
        tasksSkipped: skipped,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        avgUsefulnessRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        topWins: wins,
        topInsights: insights,
        frictionPoints: friction,
        insightsCaptured: insightsRes.count || 0,
        phasesActive: activePhases,
        designThinkingInteractions: dtCount,
        creativeSpaceTiles: csCount,
        momentumScore,
        activeDays,
        reflectionRate,
      });

      setPastReports(
        (reportsRes.data || []).map((r: any) => ({
          ...r,
          completion_rate: r.tasks_total > 0
            ? Math.round((r.tasks_completed / r.tasks_total) * 100)
            : 0,
        }))
      );

      setCapabilities((capsRes.data as any[]) || []);
    } catch (err) {
      console.error("useMomentumData error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemInsight = async (data: WeeklyData) => {
    if (data.tasksTotal === 0) return;
    setInsightLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-sprint-insight", {
        body: { weeklyData: data },
      });
      if (!error && result?.insight) {
        setSystemInsight(result.insight);
      }
    } catch (err) {
      console.error("System insight fetch failed:", err);
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (weeklyData && weeklyData.tasksTotal > 0) {
      fetchSystemInsight(weeklyData);
    }
  }, [weeklyData?.tasksTotal]);

  return { weeklyData, pastReports, capabilities, systemInsight, insightLoading, loading, refetch: fetchData };
}
