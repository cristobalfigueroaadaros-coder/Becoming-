import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, Circle, Plus, Target, Calendar, CalendarDays, 
  CalendarRange, Sparkles, Trash2, Edit2, X, Check, Trophy,
  TrendingUp, Flame, Clock
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useAchievements } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Goal {
  id: string;
  goal_text: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  xp_value?: number;
}

interface VisionGoal {
  id: string;
  vision_text: string;
  milestones: any;
}

interface GoalStats {
  totalCompleted: number;
  streak: number;
  weeklyRate: number;
}

export const GoalHierarchy = () => {
  const [dailyGoals, setDailyGoals] = useState<Goal[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<Goal[]>([]);
  const [monthlyGoals, setMonthlyGoals] = useState<Goal[]>([]);
  const [yearlyGoals, setYearlyGoals] = useState<Goal[]>([]);
  const [visionGoal, setVisionGoal] = useState<VisionGoal | null>(null);
  const [stats, setStats] = useState<GoalStats>({ totalCompleted: 0, streak: 0, weeklyRate: 0 });
  
  const [newGoal, setNewGoal] = useState({ daily: "", weekly: "", monthly: "", yearly: "", vision: "" });
  const [showInputs, setShowInputs] = useState({ daily: false, weekly: false, monthly: false, yearly: false, vision: false });
  const [editingGoal, setEditingGoal] = useState<{ id: string; tier: string; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState("daily");
  
  const { checkMultipleAchievements } = useAchievements();

  useEffect(() => {
    loadGoals();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all completed goals count
      const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
        supabase.from("daily_goals").select("id", { count: "exact" }).eq("user_id", user.id).eq("completed", true),
        supabase.from("weekly_goals").select("id", { count: "exact" }).eq("user_id", user.id).eq("completed", true),
        supabase.from("monthly_goals").select("id", { count: "exact" }).eq("user_id", user.id).eq("completed", true),
      ]);

      const totalCompleted = (dailyRes.count || 0) + (weeklyRes.count || 0) + (monthlyRes.count || 0);

      // Calculate streak from daily goals
      const { data: recentDaily } = await supabase
        .from("daily_goals")
        .select("completed, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      let streak = 0;
      if (recentDaily) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];
          
          const dayGoals = recentDaily.filter(g => 
            g.created_at.startsWith(dateStr)
          );
          
          if (dayGoals.length > 0 && dayGoals.every(g => g.completed)) {
            streak++;
          } else if (dayGoals.length > 0) {
            break;
          }
        }
      }

      // Calculate weekly completion rate
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: weekGoals } = await supabase
        .from("daily_goals")
        .select("completed")
        .eq("user_id", user.id)
        .gte("created_at", weekAgo.toISOString());

      const weeklyRate = weekGoals && weekGoals.length > 0
        ? Math.round((weekGoals.filter(g => g.completed).length / weekGoals.length) * 100)
        : 0;

      setStats({ totalCompleted, streak, weeklyRate });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const [daily, weekly, monthly, yearly, vision] = await Promise.all([
        supabase.from("daily_goals")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", today.toISOString())
          .order("created_at", { ascending: false }),
        supabase.from("weekly_goals")
          .select("*")
          .eq("user_id", user.id)
          .gte("week_start", weekStart.toISOString().split('T')[0])
          .order("created_at", { ascending: false }),
        supabase.from("monthly_goals")
          .select("*")
          .eq("user_id", user.id)
          .gte("month_start", monthStart.toISOString().split('T')[0])
          .order("created_at", { ascending: false }),
        supabase.from("yearly_goals")
          .select("*")
          .eq("user_id", user.id)
          .eq("year", today.getFullYear())
          .order("created_at", { ascending: false }),
        supabase.from("vision_goals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      setDailyGoals(daily.data || []);
      setWeeklyGoals(weekly.data || []);
      setMonthlyGoals(monthly.data || []);
      setYearlyGoals(yearly.data || []);
      setVisionGoal(vision.data);
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
          user_id: user.id, goal_text: goalText, week_start: weekStart.toISOString().split('T')[0]
        });
      } else if (tier === "monthly") {
        await supabase.from("monthly_goals").insert({ 
          user_id: user.id, goal_text: goalText, month_start: monthStart.toISOString().split('T')[0]
        });
      } else if (tier === "yearly") {
        await supabase.from("yearly_goals").insert({ 
          user_id: user.id, goal_text: goalText, year: today.getFullYear()
        });
      } else if (tier === "vision") {
        await supabase.from("vision_goals").insert({ 
          user_id: user.id, vision_text: goalText, milestones: []
        });
      }

      setNewGoal({ ...newGoal, [tier]: "" });
      setShowInputs({ ...showInputs, [tier]: false });
      loadGoals();
      toast.success("Goal added!");

      if (tier === "vision") {
        await checkMultipleAchievements({ visionSet: true });
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteGoal = async (tier: string, goalId: string) => {
    try {
      const table = tier === "daily" ? "daily_goals" : 
                    tier === "weekly" ? "weekly_goals" : 
                    tier === "monthly" ? "monthly_goals" : "yearly_goals";

      await supabase.from(table).delete().eq("id", goalId);
      loadGoals();
      toast.success("Goal removed");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateGoal = async (tier: string, goalId: string, newText: string) => {
    try {
      const table = tier === "daily" ? "daily_goals" : 
                    tier === "weekly" ? "weekly_goals" : 
                    tier === "monthly" ? "monthly_goals" : "yearly_goals";

      await supabase.from(table).update({ goal_text: newText }).eq("id", goalId);
      setEditingGoal(null);
      loadGoals();
      toast.success("Goal updated");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const triggerCelebration = (tier: string) => {
    const configs = {
      daily: { particleCount: 50, spread: 50, colors: ['#FF6B6B', '#4ECDC4', '#FFE66D'] },
      weekly: { particleCount: 100, spread: 70, colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'] },
      monthly: { particleCount: 150, spread: 100, colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#C7CEEA'] },
      yearly: { particleCount: 200, spread: 120, colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'] },
    };

    const config = configs[tier as keyof typeof configs] || configs.daily;
    confetti({ ...config, origin: { y: 0.6 } });

    if (tier === "weekly" || tier === "monthly" || tier === "yearly") {
      setTimeout(() => {
        confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, colors: config.colors });
        confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 }, colors: config.colors });
      }, 200);
    }
  };

  const toggleGoalCompletion = async (tier: string, goalId: string, currentStatus: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const table = tier === "daily" ? "daily_goals" : 
                    tier === "weekly" ? "weekly_goals" : 
                    tier === "monthly" ? "monthly_goals" : "yearly_goals";

      await supabase.from(table).update({ 
        completed: !currentStatus,
        completed_at: !currentStatus ? new Date().toISOString() : null
      }).eq("id", goalId);

      if (!currentStatus) {
        const xpValues = { daily: 20, weekly: 50, monthly: 150, yearly: 500 };
        const xp = xpValues[tier as keyof typeof xpValues];
        
        triggerCelebration(tier);
        
        const messages = {
          daily: "Daily task complete! 🎉",
          weekly: "Weekly milestone achieved! 🌟",
          monthly: "Monthly objective done! ✨",
          yearly: "Yearly goal conquered! 🎆"
        };

        toast.success(messages[tier as keyof typeof messages], {
          description: `+${xp} XP earned`,
          duration: 4000,
        });

        const goalsMap = { daily: dailyGoals, weekly: weeklyGoals, monthly: monthlyGoals, yearly: yearlyGoals };
        const goals = goalsMap[tier as keyof typeof goalsMap];
        const allComplete = goals.filter(g => g.completed || g.id === goalId).length === goals.length;

        if (allComplete && goals.length > 0) {
          await checkMultipleAchievements({
            weeklyGoalsComplete: tier === "weekly",
            monthlyGoalsComplete: tier === "monthly",
            yearlyGoalsComplete: tier === "yearly",
          });
        }
      }

      loadGoals();
      loadStats();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const calculateProgress = (goals: Goal[]) => {
    if (goals.length === 0) return 0;
    return (goals.filter(g => g.completed).length / goals.length) * 100;
  };

  const goalTiers = [
    { name: "Today", fullName: "Daily Tasks", icon: Target, goals: dailyGoals, color: "from-blue-500 to-cyan-500", tier: "daily", xp: 20, description: "Small wins build momentum" },
    { name: "Week", fullName: "Weekly Milestones", icon: Calendar, goals: weeklyGoals, color: "from-violet-500 to-purple-500", tier: "weekly", xp: 50, description: "Stepping stones to your goals" },
    { name: "Month", fullName: "Monthly Objectives", icon: CalendarDays, goals: monthlyGoals, color: "from-amber-500 to-orange-500", tier: "monthly", xp: 150, description: "Major progress markers" },
    { name: "Year", fullName: "Yearly Aspirations", icon: CalendarRange, goals: yearlyGoals, color: "from-emerald-500 to-teal-500", tier: "yearly", xp: 500, description: "Your annual transformation" },
  ];

  const renderGoalItem = (goal: Goal, tier: string, xp: number) => {
    const isEditing = editingGoal?.id === goal.id;

    return (
      <motion.div
        key={goal.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className={cn(
          "group flex items-start gap-3 p-3 rounded-xl transition-all duration-200",
          goal.completed 
            ? "bg-green-500/10 border border-green-500/20" 
            : "bg-card/50 hover:bg-card border border-transparent hover:border-border/50"
        )}
      >
        <button
          onClick={() => !isEditing && toggleGoalCompletion(tier, goal.id, goal.completed)}
          className="flex-shrink-0 mt-0.5"
        >
          {goal.completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={editingGoal.text}
                onChange={(e) => setEditingGoal({ ...editingGoal, text: e.target.value })}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateGoal(tier, goal.id, editingGoal.text);
                  if (e.key === "Escape") setEditingGoal(null);
                }}
              />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateGoal(tier, goal.id, editingGoal.text)}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingGoal(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <p className={cn(
              "text-sm leading-relaxed",
              goal.completed && "line-through text-muted-foreground"
            )}>
              {goal.goal_text}
            </p>
          )}
          {goal.completed && goal.completed_at && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Completed {new Date(goal.completed_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {!isEditing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setEditingGoal({ id: goal.id, tier, text: goal.goal_text })}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => deleteGoal(tier, goal.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}

        {!goal.completed && (
          <Badge variant="outline" className="text-xs opacity-60 group-hover:opacity-100">
            +{xp} XP
          </Badge>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats.totalCompleted}</p>
            <p className="text-xs text-muted-foreground">Goals Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/20">
          <CardContent className="p-4 text-center">
            <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{stats.streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{stats.weeklyRate}%</p>
            <p className="text-xs text-muted-foreground">Weekly Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Vision Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-accent/5 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg">10-Year Vision</span>
                <p className="text-xs text-muted-foreground font-normal">Your north star</p>
              </div>
            </div>
            {!visionGoal && !showInputs.vision && (
              <Button size="sm" variant="outline" onClick={() => setShowInputs({ ...showInputs, vision: true })}>
                <Plus className="w-4 h-4 mr-1" /> Set Vision
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {showInputs.vision && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Where do you see yourself in 10 years?"
                  value={newGoal.vision}
                  onChange={(e) => setNewGoal({ ...newGoal, vision: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && addGoal("vision")}
                  className="bg-background/50"
                />
                <Button onClick={() => addGoal("vision")}>Save</Button>
                <Button variant="ghost" onClick={() => setShowInputs({ ...showInputs, vision: false })}>
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
            {visionGoal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl bg-background/50 border border-primary/10"
              >
                <p className="text-lg font-medium leading-relaxed">{visionGoal.vision_text}</p>
              </motion.div>
            )}
            {!visionGoal && !showInputs.vision && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Define your 10-year vision to guide all other goals
              </p>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Goal Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-auto p-1 bg-muted/50">
          {goalTiers.map((tier) => {
            const Icon = tier.icon;
            const progress = calculateProgress(tier.goals);
            const completedCount = tier.goals.filter(g => g.completed).length;
            
            return (
              <TabsTrigger
                key={tier.tier}
                value={tier.tier}
                className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-background"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
                  tier.color
                )}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium">{tier.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">
                    {completedCount}/{tier.goals.length}
                  </span>
                  {progress === 100 && tier.goals.length > 0 && (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  )}
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {goalTiers.map((tier) => {
          const progress = calculateProgress(tier.goals);
          
          return (
            <TabsContent key={tier.tier} value={tier.tier} className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{tier.fullName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    </div>
                    <Badge className={cn("bg-gradient-to-r text-white", tier.color)}>
                      +{tier.xp} XP each
                    </Badge>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {tier.goals.filter(g => g.completed).length} of {tier.goals.length} completed
                      </span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={cn("h-full bg-gradient-to-r rounded-full", tier.color)}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <AnimatePresence>
                    {tier.goals.map((goal) => renderGoalItem(goal, tier.tier, tier.xp))}
                  </AnimatePresence>

                  {tier.goals.length === 0 && !showInputs[tier.tier as keyof typeof showInputs] && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No {tier.name.toLowerCase()} goals yet</p>
                    </div>
                  )}

                  {/* Add Goal Input */}
                  <AnimatePresence>
                    {showInputs[tier.tier as keyof typeof showInputs] ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-2 pt-2"
                      >
                        <Input
                          placeholder={`Add a ${tier.name.toLowerCase()} goal...`}
                          value={newGoal[tier.tier as keyof typeof newGoal]}
                          onChange={(e) => setNewGoal({ ...newGoal, [tier.tier]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addGoal(tier.tier);
                            if (e.key === "Escape") setShowInputs({ ...showInputs, [tier.tier]: false });
                          }}
                          autoFocus
                        />
                        <Button onClick={() => addGoal(tier.tier)}>Add</Button>
                        <Button variant="ghost" onClick={() => setShowInputs({ ...showInputs, [tier.tier]: false })}>
                          <X className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowInputs({ ...showInputs, [tier.tier]: true })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add {tier.name} Goal
                      </Button>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default GoalHierarchy;
