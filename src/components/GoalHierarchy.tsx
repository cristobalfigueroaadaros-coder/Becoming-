import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Plus, Target, Calendar, CalendarDays, CalendarRange, Sparkles } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useAchievements } from "@/hooks/useAchievements";

interface Goal {
  id: string;
  goal_text: string;
  completed: boolean;
  xp_value?: number;
}

interface VisionGoal {
  id: string;
  vision_text: string;
  milestones: any;
}

export const GoalHierarchy = () => {
  const [dailyGoals, setDailyGoals] = useState<Goal[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<Goal[]>([]);
  const [monthlyGoals, setMonthlyGoals] = useState<Goal[]>([]);
  const [yearlyGoals, setYearlyGoals] = useState<Goal[]>([]);
  const [visionGoal, setVisionGoal] = useState<VisionGoal | null>(null);
  
  const [newGoal, setNewGoal] = useState({ daily: "", weekly: "", monthly: "", yearly: "", vision: "" });
  const [showInputs, setShowInputs] = useState({ daily: false, weekly: false, monthly: false, yearly: false, vision: false });
  
  const { checkMultipleAchievements } = useAchievements();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get week start (Monday)
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);

      // Get month start
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      // Load daily goals
      const { data: daily } = await supabase
        .from("daily_goals")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      // Load weekly goals
      const { data: weekly } = await supabase
        .from("weekly_goals")
        .select("*")
        .eq("user_id", user.id)
        .gte("week_start", weekStart.toISOString().split('T')[0])
        .order("created_at", { ascending: false });

      // Load monthly goals
      const { data: monthly } = await supabase
        .from("monthly_goals")
        .select("*")
        .eq("user_id", user.id)
        .gte("month_start", monthStart.toISOString().split('T')[0])
        .order("created_at", { ascending: false });

      // Load yearly goals
      const { data: yearly } = await supabase
        .from("yearly_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("year", today.getFullYear())
        .order("created_at", { ascending: false });

      // Load vision goal
      const { data: vision } = await supabase
        .from("vision_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setDailyGoals(daily || []);
      setWeeklyGoals(weekly || []);
      setMonthlyGoals(monthly || []);
      setYearlyGoals(yearly || []);
      setVisionGoal(vision);
    } catch (error: any) {
      console.error("Error loading goals:", error);
    }
  };

  const addGoal = async (tier: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const goalText = newGoal[tier as keyof typeof newGoal];
      if (!goalText.trim()) return;

      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      if (tier === "daily") {
        await supabase.from("daily_goals").insert({ user_id: user.id, goal_text: goalText });
      } else if (tier === "weekly") {
        await supabase.from("weekly_goals").insert({ 
          user_id: user.id, 
          goal_text: goalText,
          week_start: weekStart.toISOString().split('T')[0]
        });
      } else if (tier === "monthly") {
        await supabase.from("monthly_goals").insert({ 
          user_id: user.id, 
          goal_text: goalText,
          month_start: monthStart.toISOString().split('T')[0]
        });
      } else if (tier === "yearly") {
        await supabase.from("yearly_goals").insert({ 
          user_id: user.id, 
          goal_text: goalText,
          year: today.getFullYear()
        });
      } else if (tier === "vision") {
        await supabase.from("vision_goals").insert({ 
          user_id: user.id, 
          vision_text: goalText,
          milestones: []
        });
      }

      setNewGoal({ ...newGoal, [tier]: "" });
      setShowInputs({ ...showInputs, [tier]: false });
      loadGoals();
      toast.success("Goal added!");

      // Check vision achievement
      if (tier === "vision") {
        await checkMultipleAchievements({ visionSet: true });
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const triggerCelebration = (tier: string, xp: number) => {
    const celebrations = {
      daily: () => {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#FF6B6B', '#4ECDC4', '#FFE66D']
        });
      },
      weekly: () => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3']
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          });
        }, 200);
      },
      monthly: () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#C7CEEA'];

        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
          });

          if (Date.now() < animationEnd) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      },
      yearly: () => {
        const duration = 5000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);

          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
          });
        }, 250);
      }
    };

    celebrations[tier as keyof typeof celebrations]();
  };

  const toggleGoalCompletion = async (tier: string, goalId: string, currentStatus: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const table = tier === "daily" ? "daily_goals" : 
                    tier === "weekly" ? "weekly_goals" : 
                    tier === "monthly" ? "monthly_goals" : "yearly_goals";

      await supabase
        .from(table)
        .update({ 
          completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq("id", goalId);

      if (!currentStatus) {
        const xpValues = { daily: 20, weekly: 50, monthly: 150, yearly: 500 };
        const xp = xpValues[tier as keyof typeof xpValues];
        
        triggerCelebration(tier, xp);
        
        const messages = {
          daily: "Daily goal crushed!",
          weekly: "Weekly milestone achieved!",
          monthly: "Monthly objective completed!",
          yearly: "Yearly goal conquered! 🎆"
        };
        
        toast.success(messages[tier as keyof typeof messages], {
          description: `+${xp} XP earned!`,
          duration: 4000
        });

        // Check goal completion achievements
        const weeklyComplete = tier === "weekly" && weeklyGoals.filter(g => g.completed || g.id === goalId).length === weeklyGoals.length;
        const monthlyComplete = tier === "monthly" && monthlyGoals.filter(g => g.completed || g.id === goalId).length === monthlyGoals.length;
        const yearlyComplete = tier === "yearly" && yearlyGoals.filter(g => g.completed || g.id === goalId).length === yearlyGoals.length;

        await checkMultipleAchievements({
          weeklyGoalsComplete: weeklyComplete,
          monthlyGoalsComplete: monthlyComplete,
          yearlyGoalsComplete: yearlyComplete,
        });
      }

      loadGoals();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const calculateProgress = (goals: Goal[]) => {
    if (goals.length === 0) return 0;
    const completed = goals.filter(g => g.completed).length;
    return (completed / goals.length) * 100;
  };

  const goalTiers = [
    { 
      name: "TODAY", 
      icon: Target, 
      goals: dailyGoals, 
      color: "bg-primary", 
      tier: "daily",
      xp: 20,
      description: "Daily intentions"
    },
    { 
      name: "THIS WEEK", 
      icon: Calendar, 
      goals: weeklyGoals, 
      color: "bg-accent", 
      tier: "weekly",
      xp: 50,
      description: "Weekly milestones"
    },
    { 
      name: "THIS MONTH", 
      icon: CalendarDays, 
      goals: monthlyGoals, 
      color: "bg-secondary", 
      tier: "monthly",
      xp: 150,
      description: "Monthly objectives"
    },
    { 
      name: "THIS YEAR", 
      icon: CalendarRange, 
      goals: yearlyGoals, 
      color: "bg-mentor-quantum", 
      tier: "yearly",
      xp: 500,
      description: "Yearly aspirations"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Your Goal Hierarchy</h2>
        <p className="text-muted-foreground">From daily actions to your 10-year vision</p>
      </div>

      {/* 10-Year Vision - Top Level */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span>10-YEAR VISION</span>
            </div>
            {!visionGoal && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowInputs({ ...showInputs, vision: true })}
              >
                <Plus className="w-4 h-4 mr-1" />
                Set Vision
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showInputs.vision && (
            <div className="flex gap-2">
              <Input
                placeholder="Describe your 10-year vision..."
                value={newGoal.vision}
                onChange={(e) => setNewGoal({ ...newGoal, vision: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addGoal("vision")}
              />
              <Button onClick={() => addGoal("vision")}>Add</Button>
            </div>
          )}
          {visionGoal && (
            <div className="p-4 rounded-lg bg-background/50 border border-primary/10">
              <p className="text-lg font-medium">{visionGoal.vision_text}</p>
            </div>
          )}
          {!visionGoal && !showInputs.vision && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Set your 10-year vision to guide all other goals
            </p>
          )}
        </CardContent>
      </Card>

      {/* Goal Tiers */}
      <div className="grid md:grid-cols-2 gap-4">
        {goalTiers.map((tier) => {
          const Icon = tier.icon;
          const progress = calculateProgress(tier.goals);
          
          return (
            <Card key={tier.tier} className="border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${tier.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div>{tier.name}</div>
                      <p className="text-xs text-muted-foreground font-normal">{tier.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">+{tier.xp} XP</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="space-y-2">
                  {tier.goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                      onClick={() => toggleGoalCompletion(tier.tier, goal.id, goal.completed)}
                    >
                      {goal.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5 animate-scale-in" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                      )}
                      <span className={`text-sm transition-all ${goal.completed ? "line-through text-muted-foreground" : "group-hover:text-primary"}`}>
                        {goal.goal_text}
                      </span>
                    </div>
                  ))}
                </div>

                {showInputs[tier.tier as keyof typeof showInputs] ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Add ${tier.name.toLowerCase()} goal...`}
                      value={newGoal[tier.tier as keyof typeof newGoal]}
                      onChange={(e) => setNewGoal({ ...newGoal, [tier.tier]: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && addGoal(tier.tier)}
                    />
                    <Button size="sm" onClick={() => addGoal(tier.tier)}>Add</Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowInputs({ ...showInputs, [tier.tier]: true })}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Goal
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
