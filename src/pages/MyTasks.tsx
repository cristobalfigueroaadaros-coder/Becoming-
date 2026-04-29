import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAchievements } from "@/hooks/useAchievements";

interface Task {
  id: string;
  mentor_name: string;
  task_title: string;
  task_description: string;
  status: string;
  created_at: string;
  due_date: string;
  xp_value: number;
}

const MyTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkMultipleAchievements } = useAchievements();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "pending" ? "done" : "pending";

    try {
      // Update task status in database
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      // Find the task to get mentor name
      const task = tasks.find(t => t.id === taskId);
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      if (newStatus === "done" && task) {
        // Call complete-task edge function to award XP
        const { data: { session } } = await supabase.auth.getSession();
        
        const { data, error: completeError } = await supabase.functions.invoke('complete-task', {
          body: { 
            taskId: taskId,
            mentorName: task.mentor_name,
            isShadowTask: false
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });

        if (completeError) {
          console.error('Error completing task:', completeError);
          toast.error("Task marked complete but XP award failed");
        } else {
          // Show celebration toast with XP info
          toast.success(
            <div className="flex flex-col gap-1">
              <div className="font-semibold">Task Completed! 🎉</div>
              <div className="text-sm">+{data.xpEarned} XP earned</div>
              {data.leveledUp && <div className="text-sm font-bold text-primary">🎊 Level Up! You're now Level {data.newLevel}!</div>}
            </div>,
            { duration: 4000 }
          );

          // Check achievements
          const totalCompleted = tasks.filter(t => t.status === "done").length + 1;
          await checkMultipleAchievements({
            taskCount: totalCompleted,
          });
        }
      } else {
        toast.success("Task reopened");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const completedCount = tasks.filter(t => t.status === "done").length;
  const completionPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const tasksByMentor = tasks.reduce((acc, task) => {
    if (!acc[task.mentor_name]) {
      acc[task.mentor_name] = [];
    }
    acc[task.mentor_name].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
      <p className="text-muted-foreground">Loading tasks...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold">My Tasks</h1>
            <p className="text-muted-foreground mt-2">
              {completedCount} of {tasks.length} tasks completed
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(completionPercentage)}%</span>
              </div>
              <Progress value={completionPercentage} />
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Mentor */}
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No tasks yet. Complete a council meeting to get your first tasks!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(tasksByMentor).map(([mentorName, mentorTasks]) => (
              <Card key={mentorName}>
                <CardHeader>
                  <CardTitle className="text-xl">{mentorName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mentorTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                    >
                      <Checkbox
                        checked={task.status === "done"}
                        onCheckedChange={() => handleToggleTask(task.id, task.status)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <h4 className={`font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                          {task.task_title}
                        </h4>
                        <p className={`text-sm ${task.status === "done" ? "line-through text-muted-foreground" : "text-muted-foreground"}`}>
                          {task.task_description}
                        </p>
                        <div className="flex gap-3 text-xs text-muted-foreground pt-1">
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          <span>XP: {task.xp_value}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasks;
