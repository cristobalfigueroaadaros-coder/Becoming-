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
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sevenDaysAgo = format(startOfDay(subDays(new Date(), 7)), "yyyy-MM-dd");
      const today = format(new Date(), "yyyy-MM-dd");

      // Parallel fetches
      const [stepsRes, feedbackRes, insightsRes, phasesRes, dtRes, csRes, reportsRes, capsRes] = await Promise.all([
        // 1. integrator_daily_steps last 7 days
        supabase
          .from("integrator_daily_steps")
          .select("id, status, scheduled_date")
          .eq("user_id", user.id)
          .gte("scheduled_date", sevenDaysAgo)
          .lte("scheduled_date", today),

        // 2. task_feedback last 7 days
        supabase
          .from("task_feedback" as any)
          .select("win_text, insight_text, improvement_text, usefulness_rating, created_at")
          .eq("user_id", user.id)
          .gte("created_at", new Date(sevenDaysAgo).toISOString()),

        // 3. insight_dots count
        supabase
          .from("insight_dots")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .gte("created_at", new Date(sevenDaysAgo).toISOString()),

        // 4. integrator_phases active
        supabase
          .from("integrator_phases")
          .select("phase_name, started_at, completed_at")
          .eq("user_id", user.id)
          .not("started_at", "is", null),

        // 5. design_thinking_content interactions
        supabase
          .from("design_thinking_content")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .gte("created_at", new Date(sevenDaysAgo).toISOString()),

        // 6. creative_space_tiles count
        supabase
          .from("creative_space_tiles")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .gte("created_at", new Date(sevenDaysAgo).toISOString()),

        // 7. past weekly reports
        supabase
          .from("momentum_weekly_reports")
          .select("*")
          .eq("user_id", user.id)
          .order("week_start", { ascending: false })
          .limit(12),

        // 8. capabilities
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

      // Process feedback
      const feedback = (feedbackRes.data as any[]) || [];
      const wins = feedback.map((f: any) => f.win_text).filter(Boolean).slice(0, 3);
      const insights = feedback.map((f: any) => f.insight_text).filter(Boolean).slice(0, 3);
      const friction = feedback.map((f: any) => f.improvement_text).filter(Boolean).slice(0, 3);
      const ratings = feedback.map((f: any) => f.usefulness_rating).filter(Boolean);
      const avgRating = ratings.length > 0
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
        : null;

      // Process phases
      const phases = phasesRes.data || [];
      const activePhases = phases
        .filter((p) => p.started_at && !p.completed_at)
        .map((p) => p.phase_name);

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
        designThinkingInteractions: dtRes.count || 0,
        creativeSpaceTiles: csRes.count || 0,
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

  useEffect(() => {
    fetchData();
  }, []);

  return { weeklyData, pastReports, capabilities, loading, refetch: fetchData };
}
