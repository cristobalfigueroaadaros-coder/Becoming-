import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, TrendingUp, Calendar, Target, Award, Lightbulb, CheckCircle2, XCircle, BarChart3 } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";

interface DailyChallenge {
  id: string;
  date: string;
  challenge_title: string;
  challenge_description: string;
  source_reason: string;
  status: string;
  completed_at: string | null;
  reflection_text: string | null;
  created_at: string;
}

interface ChallengeStat {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

export default function ChallengeHistory() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ChallengeStat[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ date: Date; completed: boolean }[]>([]);

  useEffect(() => {
    loadChallengeHistory();
  }, []);

  const loadChallengeHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("daily_challenge")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      const challengeData = data || [];
      setChallenges(challengeData);

      // Calculate stats
      const completed = challengeData.filter(c => c.status === "completed").length;
      const skipped = challengeData.filter(c => c.status === "skipped").length;
      const pending = challengeData.filter(c => c.status === "pending").length;
      const total = challengeData.length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Calculate current streak
      let currentStreak = 0;
      const sortedByDate = [...challengeData].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      for (const challenge of sortedByDate) {
        if (challenge.status === "completed") {
          currentStreak++;
        } else if (challenge.status === "skipped") {
          break;
        }
      }

      // Analyze patterns
      const sourceReasons = challengeData
        .filter(c => c.status === "completed")
        .map(c => c.source_reason);
      
      const mostCommonPattern = getMostCommonPattern(sourceReasons);

      setStats([
        {
          label: "Completed",
          value: completed,
          icon: CheckCircle2,
          color: "text-green-500"
        },
        {
          label: "Completion Rate",
          value: `${completionRate}%`,
          icon: TrendingUp,
          color: "text-primary"
        },
        {
          label: "Current Streak",
          value: currentStreak,
          icon: Target,
          color: "text-orange-500"
        },
        {
          label: "Total Challenges",
          value: total,
          icon: Award,
          color: "text-purple-500"
        }
      ]);

      // Prepare weekly calendar data
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

      const weekData = daysInWeek.map(day => {
        const challenge = challengeData.find(c => 
          isSameDay(new Date(c.date), day)
        );
        return {
          date: day,
          completed: challenge?.status === "completed"
        };
      });

      setWeeklyData(weekData);
    } catch (error) {
      console.error("Error loading challenge history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMostCommonPattern = (reasons: string[]): string => {
    if (reasons.length === 0) return "Not enough data yet";
    
    const keywords = ["purpose", "challenge", "growth", "domain", "shadow"];
    const counts: Record<string, number> = {};
    
    keywords.forEach(keyword => {
      counts[keyword] = reasons.filter(r => 
        r.toLowerCase().includes(keyword)
      ).length;
    });

    const max = Math.max(...Object.values(counts));
    const topKeyword = Object.keys(counts).find(k => counts[k] === max);
    
    return topKeyword 
      ? `Focused on ${topKeyword}-driven challenges`
      : "Exploring various growth areas";
  };

  const getInsights = (): string[] => {
    const insights: string[] = [];
    const completed = challenges.filter(c => c.status === "completed");
    const total = challenges.length;

    if (total === 0) {
      return ["Start your first challenge to unlock insights!"];
    }

    const completionRate = (completed.length / total) * 100;

    if (completionRate > 80) {
      insights.push("🎯 Exceptional consistency! You're building powerful momentum.");
    } else if (completionRate > 60) {
      insights.push("💪 Strong commitment to growth. Keep pushing forward!");
    } else if (completionRate > 40) {
      insights.push("🌱 You're making progress. Small steps compound over time.");
    } else {
      insights.push("🔥 Focus on completing one challenge at a time to build momentum.");
    }

    // Pattern analysis
    const hasReflections = completed.filter(c => c.reflection_text && c.reflection_text.length > 50).length;
    if (hasReflections > completed.length * 0.7) {
      insights.push("📝 Your detailed reflections show deep self-awareness.");
    }

    // Recent activity
    const recentChallenges = challenges.slice(0, 7);
    const recentCompleted = recentChallenges.filter(c => c.status === "completed").length;
    if (recentCompleted >= 5) {
      insights.push("🚀 You're on fire this week! This momentum is transformative.");
    }

    return insights;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading challenge history...</p>
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
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-4xl font-bold">Challenge History</h1>
            <p className="text-muted-foreground mt-2">
              Your journey of daily purpose-aligned growth
            </p>
          </div>
          <Button
            onClick={() => navigate("/challenge-reports")}
            className="mt-8"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            View Reports
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weekly Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weeklyData.map((day, index) => (
                <div
                  key={index}
                  className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 ${
                    day.completed
                      ? "bg-primary/20 border-primary"
                      : "bg-muted/50 border-muted"
                  }`}
                >
                  <span className="text-xs text-muted-foreground">
                    {format(day.date, "EEE")}
                  </span>
                  <span className="text-lg font-semibold">
                    {format(day.date, "d")}
                  </span>
                  {day.completed && (
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Growth Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getInsights().map((insight, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-background/50 border border-primary/10"
                >
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Challenge Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Challenge Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {challenges.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No challenges yet. Start your first challenge today!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className={`p-4 rounded-lg border-2 ${
                      challenge.status === "completed"
                        ? "bg-primary/5 border-primary/20"
                        : challenge.status === "skipped"
                        ? "bg-muted/30 border-muted"
                        : "bg-accent/5 border-accent/20"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(challenge.date), "MMM d, yyyy")}
                          </span>
                          {challenge.status === "completed" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-600 text-xs rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Completed
                            </span>
                          ) : challenge.status === "skipped" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                              <XCircle className="w-3 h-3" />
                              Skipped
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/20 text-accent-foreground text-xs rounded-full">
                              Pending
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-lg mb-1">
                          {challenge.challenge_title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {challenge.challenge_description}
                        </p>
                        <p className="text-xs text-muted-foreground italic">
                          {challenge.source_reason}
                        </p>
                      </div>
                    </div>
                    {challenge.reflection_text && (
                      <div className="mt-3 p-3 bg-background/50 rounded-lg border border-primary/10">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Your Reflection:
                        </p>
                        <p className="text-sm">{challenge.reflection_text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}