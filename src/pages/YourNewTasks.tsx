import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

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

const YourNewTasks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNewTasks();
  }, []);

  const loadNewTasks = async () => {
    try {
      const taskIds = location.state?.taskIds || [];
      
      if (taskIds.length === 0) {
        // If no task IDs, load latest tasks from the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", fiveMinutesAgo)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setTasks(data || []);
      } else {
        // Load specific tasks by ID
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .in("id", taskIds);

        if (error) throw error;
        setTasks(data || []);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
      <p className="text-muted-foreground">Loading your new tasks...</p>
    </div>;
  }

  const tasksByMentor = tasks.reduce((acc, task) => {
    if (!acc[task.mentor_name]) {
      acc[task.mentor_name] = [];
    }
    acc[task.mentor_name].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Your New Tasks</h1>
          <p className="text-muted-foreground">
            Here are the actionable tasks extracted from your council meeting
          </p>
        </div>

        {/* New Tasks */}
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No new tasks found. Try completing a council meeting first.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(tasksByMentor).map(([mentorName, mentorTasks]) => (
              <Card key={mentorName} className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl">{mentorName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mentorTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-lg bg-accent/10 border border-accent/20 space-y-2"
                    >
                      <h4 className="font-semibold text-lg">{task.task_title}</h4>
                      <p className="text-muted-foreground">{task.task_description}</p>
                      <div className="flex gap-3 text-sm text-muted-foreground pt-2">
                        <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        <span>XP: {task.xp_value}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button onClick={() => navigate("/my-tasks")} className="flex-1" size="lg">
            View All Tasks
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button onClick={() => navigate("/dashboard")} variant="outline" className="flex-1" size="lg">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default YourNewTasks;
