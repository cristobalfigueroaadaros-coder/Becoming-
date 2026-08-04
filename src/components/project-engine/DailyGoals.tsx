import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface StructureNode {
  id: string;
  title: string;
  status: "not_started" | "in_progress" | "strong" | "completed";
  importance: "low" | "medium" | "high";
  children: StructureNode[];
  mentorType?: string;
}

interface DailyGoal {
  id: string;
  text: string;
  blockTitle: string;
  activityTitle: string;
  activityId: string;
  completed: boolean;
}

interface DailyGoalsProps {
  structure: StructureNode[];
  projectTitle: string;
  onActivityStatusChange: (activityId: string, status: StructureNode["status"]) => void;
}

/**
 * Derives daily goals from activities across blocks.
 * Prioritizes the main active block but mixes in other blocks for creativity.
 */
function deriveGoals(structure: StructureNode[]): DailyGoal[] {
  const goals: DailyGoal[] = [];

  // Collect all blocks with incomplete activities
  const activeBlocks = structure.filter(
    block => block.status !== "completed" && block.children.length > 0
  );

  if (activeBlocks.length === 0) return [];

  // Sort: in_progress first, then not_started
  const sorted = [...activeBlocks].sort((a, b) => {
    if (a.status === "in_progress" && b.status !== "in_progress") return -1;
    if (b.status === "in_progress" && a.status !== "in_progress") return 1;
    return 0;
  });

  const primaryBlock = sorted[0];
  const secondaryBlock = sorted.length > 1 ? sorted[1] : null;

  // Get incomplete activities from primary block (up to 2)
  const primaryActivities = primaryBlock.children
    .filter(a => a.status !== "completed" && a.status !== "strong")
    .slice(0, 2);

  primaryActivities.forEach(activity => {
    goals.push({
      id: `goal-${activity.id}`,
      text: activity.title,
      blockTitle: primaryBlock.title,
      activityTitle: activity.title,
      activityId: activity.id,
      completed: false,
    });
  });

  // Mix in 1 from secondary block for cross-block thinking
  if (secondaryBlock) {
    const secondaryActivity = secondaryBlock.children
      .find(a => a.status !== "completed" && a.status !== "strong");
    if (secondaryActivity) {
      goals.push({
        id: `goal-${secondaryActivity.id}`,
        text: secondaryActivity.title,
        blockTitle: secondaryBlock.title,
        activityTitle: secondaryActivity.title,
        activityId: secondaryActivity.id,
        completed: false,
      });
    }
  }

  return goals.slice(0, 3); // Max 3 daily goals
}

export function DailyGoals({ structure, projectTitle, onActivityStatusChange }: DailyGoalsProps) {
  const goals = useMemo(() => deriveGoals(structure), [structure]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  if (goals.length === 0) return null;

  const toggleGoal = (goal: DailyGoal) => {
    const newCompleted = new Set(completedIds);
    if (newCompleted.has(goal.id)) {
      newCompleted.delete(goal.id);
      onActivityStatusChange(goal.activityId, "in_progress");
    } else {
      newCompleted.add(goal.id);
      onActivityStatusChange(goal.activityId, "completed");
    }
    setCompletedIds(newCompleted);
  };

  const completedCount = completedIds.size;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-primary/80 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Today's Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Progress */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>{completedCount} of {goals.length} done today</span>
          {completedCount === goals.length && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Sparkles className="w-3 h-3" /> All done!
            </span>
          )}
        </div>

        {goals.map(goal => {
          const isDone = completedIds.has(goal.id);
          return (
            <div
              key={goal.id}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                isDone
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-border/30"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                  isDone ? "border-green-500 bg-green-500" : "border-muted-foreground/30"
                )}
              >
                {isDone && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", isDone && "line-through text-muted-foreground")}>
                  {goal.text}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  from: {goal.blockTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleGoal(goal)}
                className={cn(
                  "shrink-0 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                  isDone
                    ? "border-green-500/30 text-green-700 hover:bg-green-500/10 dark:text-green-300"
                    : "border-primary/30 text-primary hover:bg-primary/10"
                )}
                aria-label={isDone ? `Mark ${goal.text} as not done` : `Mark ${goal.text} complete`}
              >
                {isDone ? "Undo" : "Mark complete"}
              </button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
