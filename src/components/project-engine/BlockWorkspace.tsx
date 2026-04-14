import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Plus, Trash2, Check, CheckCircle2,
  MessageCircle, Sparkles, Lightbulb, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StructureNode {
  id: string;
  title: string;
  description?: string;
  status: "not_started" | "in_progress" | "strong" | "completed";
  importance: "low" | "medium" | "high";
  children: StructureNode[];
  mentorType?: string;
  suggestedActivity?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  not_started: { label: "Not Started", color: "text-muted-foreground", bg: "bg-muted-foreground/40" },
  in_progress: { label: "In Progress", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500" },
  strong: { label: "Strong", color: "text-green-600 dark:text-green-400", bg: "bg-green-500" },
  completed: { label: "Completed", color: "text-primary", bg: "bg-primary" },
};

const MENTOR_CONFIG: Record<string, { name: string; icon: string }> = {
  strategist_mentor: { name: "Strategist", icon: "♟️" },
  business_mentor: { name: "Business", icon: "📈" },
  marketing_mentor: { name: "Marketing", icon: "📣" },
  creative_visionary: { name: "Creative", icon: "🎨" },
  design_thinking_mentor: { name: "Design Thinking", icon: "🧪" },
  quantum_inventor: { name: "Inventor", icon: "⚡" },
  heart_mentor: { name: "Heart", icon: "💗" },
  scientific_mentor: { name: "Scientific", icon: "🔬" },
  discipline_mentor: { name: "Discipline", icon: "🎯" },
  alignment_mentor: { name: "Alignment", icon: "🧭" },
};

function suggestMentorForBlock(title: string): string {
  const t = title.toLowerCase();
  if (/market|audience|brand|reach|messaging|social|promot|content/.test(t)) return "marketing_mentor";
  if (/business|revenue|sales|finance|pricing|model|money|monetiz/.test(t)) return "business_mentor";
  if (/design|ux|user|interface|experience|prototype|product/.test(t)) return "design_thinking_mentor";
  if (/creative|vision|story|idea|art|concept|narrative/.test(t)) return "creative_visionary";
  if (/tech|build|develop|code|engineer|invent|technical/.test(t)) return "quantum_inventor";
  if (/research|data|test|experiment|science|validate|analys/.test(t)) return "scientific_mentor";
  if (/community|people|relation|team|connect|heart|emotion|impact/.test(t)) return "heart_mentor";
  if (/discipline|habit|routine|focus|consistency|execut/.test(t)) return "discipline_mentor";
  if (/align|value|purpose|mission|clarity|direction/.test(t)) return "alignment_mentor";
  return "strategist_mentor";
}

interface BlockWorkspaceProps {
  block: StructureNode;
  projectTitle: string;
  projectId: string;
  onBack: () => void;
  onUpdateBlock: (updates: Partial<StructureNode>) => void;
  onUpdateActivity: (activityId: string, updates: Partial<StructureNode>) => void;
  onAddActivity: () => void;
  onDeleteActivity: (activityId: string) => void;
  onMarkCompleted: () => void;
  userMentors: string[];
  isGeneratingSuggestion?: boolean;
}

export function BlockWorkspace({
  block,
  projectTitle,
  projectId,
  onBack,
  onUpdateBlock,
  onUpdateActivity,
  onAddActivity,
  onDeleteActivity,
  onMarkCompleted,
  userMentors,
  isGeneratingSuggestion,
}: BlockWorkspaceProps) {
  const navigate = useNavigate();
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(block.title);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editActivityTitle, setEditActivityTitle] = useState("");
  const [showMentorPicker, setShowMentorPicker] = useState(false);

  const linkedMentor = block.mentorType || suggestMentorForBlock(block.title);
  const mentorInfo = MENTOR_CONFIG[linkedMentor] || MENTOR_CONFIG.strategist_mentor;
  const statusCfg = STATUS_CONFIG[block.status] || STATUS_CONFIG.not_started;

  const completedActivities = block.children.filter(c => c.status === "completed" || c.status === "strong").length;
  const totalActivities = block.children.length;
  const progressPct = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  const mentorList = userMentors.length > 0
    ? userMentors.filter(m => MENTOR_CONFIG[m])
    : Object.keys(MENTOR_CONFIG);

  const handleMentorChat = () => {
    navigate(`/council?view=${linkedMentor}`, {
      state: {
        prefilledQuestion: `I need help with "${block.title}" — this is part of my project "${projectTitle}". Help me define clear, actionable activities for this block.`,
        projectName: projectTitle,
      },
    });
  };

  const cycleActivityStatus = (activity: StructureNode) => {
    const order: StructureNode["status"][] = ["not_started", "in_progress", "strong", "completed"];
    const next = order[(order.indexOf(activity.status) + 1) % order.length];
    onUpdateActivity(activity.id, { status: next });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <Input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={() => { onUpdateBlock({ title: editTitle }); setEditingTitle(false); }}
              onKeyDown={e => { if (e.key === "Enter") { onUpdateBlock({ title: editTitle }); setEditingTitle(false); } }}
              className="text-lg font-semibold"
              autoFocus
            />
          ) : (
            <h2
              className="text-lg font-semibold text-foreground cursor-pointer hover:text-primary transition-colors truncate"
              onClick={() => setEditingTitle(true)}
            >
              {block.title}
            </h2>
          )}
          <p className="text-xs text-muted-foreground">{projectTitle}</p>
        </div>
        <span className={cn("text-xs font-medium px-2 py-1 rounded-full border", statusCfg.color)}>
          {statusCfg.label}
        </span>
      </div>

      {/* Progress */}
      {totalActivities > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedActivities} of {totalActivities} activities done</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Mentor */}
      <Card className="border-border/30">
        <CardContent className="py-3">
          {!showMentorPicker ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span>{mentorInfo.icon}</span>
                <span className="text-muted-foreground">Assigned: <span className="text-foreground font-medium">{mentorInfo.name}</span></span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowMentorPicker(true)} className="text-xs h-7">
                  Change
                </Button>
                <Button size="sm" onClick={handleMentorChat} className="text-xs h-7 gap-1">
                  <MessageCircle className="w-3 h-3" /> Work with mentor
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Pick a mentor:</span>
              <div className="flex flex-wrap gap-1">
                {mentorList.map(mt => {
                  const cfg = MENTOR_CONFIG[mt];
                  if (!cfg) return null;
                  return (
                    <button
                      key={mt}
                      onClick={() => {
                        onUpdateBlock({ mentorType: mt });
                        setShowMentorPicker(false);
                      }}
                      className={cn(
                        "flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors",
                        mt === linkedMentor
                          ? "border-primary/50 bg-primary/10 text-foreground"
                          : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      <span>{cfg.icon}</span>
                      <span>{cfg.name}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setShowMentorPicker(false)} className="text-xs text-muted-foreground/60 hover:text-muted-foreground">
                cancel
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activities */}
      <Card className="border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Activities</span>
            <Button size="sm" variant="ghost" onClick={onAddActivity} className="h-7 text-xs gap-1">
              <Plus className="w-3 h-3" /> Add
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {block.children.length === 0 ? (
            <div className="space-y-3 py-3">
              {/* Suggested activity hint */}
              {block.suggestedActivity ? (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{block.suggestedActivity}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This is a starting point. Add more activities to complete this block.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => {
                      onAddActivity();
                      // The parent will handle adding this as a real activity
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Use as first activity
                  </Button>
                </div>
              ) : isGeneratingSuggestion ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Thinking of a suggestion...
                </div>
              ) : null}

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Talk to your mentor to define a stronger plan.
                </p>
                <Button size="sm" onClick={handleMentorChat} className="gap-1">
                  <MessageCircle className="w-3 h-3" /> Define with mentor
                </Button>
              </div>
            </div>
          ) : (
            <>
              {block.children.map((activity, idx) => {
                const actStatus = STATUS_CONFIG[activity.status] || STATUS_CONFIG.not_started;
                return (
                  <div
                    key={activity.id}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg border transition-colors group",
                      activity.status === "completed" || activity.status === "strong"
                        ? "border-green-500/20 bg-green-500/5"
                        : "border-border/30 hover:border-border/60"
                    )}
                  >
                    <button
                      onClick={() => cycleActivityStatus(activity)}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        activity.status === "completed" || activity.status === "strong"
                          ? "border-green-500 bg-green-500"
                          : activity.status === "in_progress"
                          ? "border-yellow-500"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {(activity.status === "completed" || activity.status === "strong") && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>

                    {editingActivityId === activity.id ? (
                      <Input
                        value={editActivityTitle}
                        onChange={e => setEditActivityTitle(e.target.value)}
                        onBlur={() => { onUpdateActivity(activity.id, { title: editActivityTitle }); setEditingActivityId(null); }}
                        onKeyDown={e => { if (e.key === "Enter") { onUpdateActivity(activity.id, { title: editActivityTitle }); setEditingActivityId(null); } }}
                        className="h-7 text-sm flex-1"
                        autoFocus
                      />
                    ) : (
                      <span
                        className={cn(
                          "text-sm flex-1 cursor-pointer transition-colors",
                          activity.status === "completed" || activity.status === "strong"
                            ? "line-through text-muted-foreground"
                            : "hover:text-primary"
                        )}
                        onClick={() => { setEditingActivityId(activity.id); setEditActivityTitle(activity.title); }}
                      >
                        {activity.title}
                      </span>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => onDeleteActivity(activity.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}

              {/* Minimum activities hint */}
              {block.children.length < 3 && (
                <p className="text-xs text-muted-foreground/60 text-center py-1">
                  Add at least {3 - block.children.length} more {block.children.length === 2 ? "activity" : "activities"} for a complete block.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Block completion */}
      {totalActivities >= 3 && completedActivities === totalActivities && block.status !== "completed" && (
        <Button onClick={onMarkCompleted} className="w-full gap-2">
          <CheckCircle2 className="w-4 h-4" /> Mark block as completed
        </Button>
      )}

      {block.status === "completed" && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Block completed!</p>
              <p className="text-xs text-muted-foreground">Move on to the next block to keep progressing.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
