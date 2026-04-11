import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Task {
  id: string;
  step_title: string;
  status: string;
}

export function SprintTasks({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    const { data } = await supabase
      .from("integrator_daily_steps")
      .select("id, step_title, status")
      .eq("project_id", projectId)
      .order("day_number", { ascending: true })
      .limit(10);
    setTasks(data || []);
    setLoading(false);
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await supabase.from("integrator_daily_steps").update({ status: newStatus }).eq("id", task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-primary/80">Sprint Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" />
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No sprint tasks yet.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <label key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 cursor-pointer transition-colors">
                <Checkbox
                  checked={task.status === "completed"}
                  onCheckedChange={() => toggleTask(task)}
                />
                <span className={task.status === "completed" ? "line-through text-muted-foreground" : "text-sm"}>
                  {task.step_title}
                </span>
              </label>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
